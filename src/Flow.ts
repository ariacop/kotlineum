// Flow.ts
/**
 * Implementation of Kotlin-like Flow for TypeScript
 * Provides a cold asynchronous data stream with backpressure support
 */
import { CoroutineScope, Job } from './Coroutines';

/**
 * Interface for Flow collectors
 */
export interface FlowCollector<T> {
  emit(value: T): Promise<void>;
}

/**
 * Flow interface representing an asynchronous stream of values
 * Similar to Kotlin's Flow
 */
export interface Flow<T> {
  collect(collector: FlowCollector<T>): Promise<void>;
  map<R>(transform: (value: T) => R | Promise<R>): Flow<R>;
  filter(predicate: (value: T) => boolean | Promise<boolean>): Flow<T>;
  flatMap<R>(transform: (value: T) => Flow<R>): Flow<R>;
  take(count: number): Flow<T>;
  onEach(action: (value: T) => void | Promise<void>): Flow<T>;
  toArray(): Promise<T[]>;
  first(): Promise<T | null>;
  reduce<R>(initial: R, operation: (accumulator: R, value: T) => R | Promise<R>): Promise<R>;
  collectValues(callback: (value: T) => void | Promise<void>): Promise<void>;
}

/**
 * Base implementation of Flow
 */
export abstract class AbstractFlow<T> implements Flow<T> {
  /**
   * Collect values from the flow
   * @param collector The collector to emit values to
   */
  abstract collect(collector: FlowCollector<T>): Promise<void>;

  /**
   * Transform each value emitted by the flow
   * @param transform Function to transform values
   * @returns A new flow with transformed values
   */
  map<R>(transform: (value: T) => R | Promise<R>): Flow<R> {
    const upstream = this;
    return new (class extends AbstractFlow<R> {
      async collect(collector: FlowCollector<R>): Promise<void> {
        await upstream.collect({
          emit: async (value: T) => {
            const transformed = await transform(value);
            await collector.emit(transformed);
          }
        });
      }
    })();
  }

  /**
   * Filter values emitted by the flow
   * @param predicate Function to test values
   * @returns A new flow with filtered values
   */
  filter(predicate: (value: T) => boolean | Promise<boolean>): Flow<T> {
    const upstream = this;
    return new (class extends AbstractFlow<T> {
      async collect(collector: FlowCollector<T>): Promise<void> {
        await upstream.collect({
          emit: async (value: T) => {
            const passes = await predicate(value);
            if (passes) {
              await collector.emit(value);
            }
          }
        });
      }
    })();
  }

  /**
   * Apply a transformation to each value and flatten the results
   * @param transform Function to transform values into a Flow
   * @returns A new flow with flattened results
   */
  flatMap<R>(transform: (value: T) => Flow<R>): Flow<R> {
    const upstream = this;
    return new (class extends AbstractFlow<R> {
      async collect(collector: FlowCollector<R>): Promise<void> {
        await upstream.collect({
          emit: async (value: T) => {
            const innerFlow = transform(value);
            await innerFlow.collect({
              emit: async (innerValue: R) => {
                await collector.emit(innerValue);
              }
            });
          }
        });
      }
    })();
  }

  /**
   * Take a specified number of values from the flow
   * @param count Number of values to take
   * @returns A new flow with at most count values
   */
  take(count: number): Flow<T> {
    if (count <= 0) return flowOf();
    
    const upstream = this;
    return new (class extends AbstractFlow<T> {
      async collect(collector: FlowCollector<T>): Promise<void> {
        let remaining = count;
        
        await upstream.collect({
          emit: async (value: T) => {
            if (remaining > 0) {
              await collector.emit(value);
              remaining--;
            }
            
            // Stop collection when we've taken enough values
            if (remaining <= 0) {
              throw new FlowCancellationException();
            }
          }
        }).catch(error => {
          if (!(error instanceof FlowCancellationException)) {
            throw error;
          }
        });
      }
    })();
  }

  /**
   * Apply a side effect to each value in the flow
   * @param action Function to apply to each value
   * @returns The same flow
   */
  onEach(action: (value: T) => void | Promise<void>): Flow<T> {
    const upstream = this;
    return new (class extends AbstractFlow<T> {
      async collect(collector: FlowCollector<T>): Promise<void> {
        await upstream.collect({
          emit: async (value: T) => {
            await action(value);
            await collector.emit(value);
          }
        });
      }
    })();
  }

  /**
   * Collect all values from the flow into an array
   * @returns Promise that resolves to an array of all values
   */
  async toArray(): Promise<T[]> {
    const result: T[] = [];
    
    await this.collect({
      emit: async (value: T) => {
        result.push(value);
      }
    });
    
    return result;
  }

  /**
   * Collect the first value from the flow
   * @returns Promise that resolves to the first value or null if the flow is empty
   */
  async first(): Promise<T | null> {
    let result: T | null = null;
    let found = false;
    
    await this.take(1).collect({
      emit: async (value: T) => {
        result = value;
        found = true;
      }
    });
    
    return result;
  }

  /**
   * Reduce the flow to a single value
   * @param initial Initial value
   * @param operation Function to combine values
   * @returns Promise that resolves to the reduced value
   */
  async reduce<R>(initial: R, operation: (accumulator: R, value: T) => R | Promise<R>): Promise<R> {
    let result = initial;
    
    await this.collect({
      emit: async (value: T) => {
        result = await operation(result, value);
      }
    });
    
    return result;
  }

  /**
   * Collect values from the flow with a simple callback
   * @param callback Function to call for each value
   * @returns Promise that resolves when collection is complete
   */
  async collectValues(callback: (value: T) => void | Promise<void>): Promise<void> {
    await this.collect({
      emit: async (value: T) => {
        await callback(value);
      }
    });
  }
}

/**
 * Exception used to cancel flow collection
 */
export class FlowCancellationException extends Error {
  constructor() {
    super('Flow collection was cancelled');
    this.name = 'FlowCancellationException';
  }
}

/**
 * Create a flow from a function
 * @param block Function that emits values to a collector
 * @returns A new flow
 */
export function flow<T>(block: (collector: FlowCollector<T>) => Promise<void>): Flow<T> {
  return new (class extends AbstractFlow<T> {
    async collect(collector: FlowCollector<T>): Promise<void> {
      await block(collector);
    }
  })();
}

/**
 * Create a flow from a fixed set of values
 * @param values Values to emit
 * @returns A new flow
 */
export function flowOf<T>(...values: T[]): Flow<T> {
  return flow(async (collector) => {
    for (const value of values) {
      await collector.emit(value);
    }
  });
}

/**
 * Create a flow from an array
 * @param array Array of values
 * @returns A new flow
 */
export function flowFromArray<T>(array: T[]): Flow<T> {
  return flowOf(...array);
}

/**
 * Create a flow from a promise
 * @param promise Promise to await
 * @returns A new flow that emits the promise result
 */
export function flowFromPromise<T>(promise: Promise<T>): Flow<T> {
  return flow(async (collector) => {
    const value = await promise;
    await collector.emit(value);
  });
}

/**
 * Create a flow that emits values at fixed intervals
 * @param period Interval in milliseconds
 * @param initialDelay Initial delay in milliseconds
 * @returns A new flow that emits incrementing numbers
 */
export function ticker(period: number, initialDelay: number = 0): Flow<number> {
  return flow(async (collector) => {
    if (initialDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, initialDelay));
    }
    
    let tick = 0;
    while (true) {
      await collector.emit(tick++);
      await new Promise(resolve => setTimeout(resolve, period));
    }
  });
}

/**
 * Collect a flow in a coroutine scope
 * @param scope The coroutine scope
 * @param flow The flow to collect
 * @param collector The collector function
 * @returns A job that can be used to cancel collection
 */
export function launchFlowCollection<T>(
  scope: CoroutineScope,
  flow: Flow<T>,
  collector: (value: T) => void | Promise<void>
): Job {
  return scope.launch(async () => {
    await flow.collect({
      emit: async (value: T) => {
        await collector(value);
      }
    });
  });
}

/**
 * Convert a StateFlow to a Flow
 * @param stateFlow The StateFlow to convert
 * @returns A Flow that emits values from the StateFlow
 */
export function asFlow<T>(stateFlow: { getValue: () => T; subscribe: (id: string, callback: (value: T) => void) => () => void }): Flow<T> {
  return flow(async (collector) => {
    // Emit the current value
    await collector.emit(stateFlow.getValue());
    
    // Set up a promise that never resolves to keep the flow active
    await new Promise<void>((resolve) => {
      const unsubscribe = stateFlow.subscribe('flow-subscription', async (value) => {
        try {
          await collector.emit(value);
        } catch (e) {
          if (e instanceof FlowCancellationException) {
            unsubscribe();
            resolve();
          } else {
            throw e;
          }
        }
      });
    });
  });
}
