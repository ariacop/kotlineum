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
export declare abstract class AbstractFlow<T> implements Flow<T> {
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
    map<R>(transform: (value: T) => R | Promise<R>): Flow<R>;
    /**
     * Filter values emitted by the flow
     * @param predicate Function to test values
     * @returns A new flow with filtered values
     */
    filter(predicate: (value: T) => boolean | Promise<boolean>): Flow<T>;
    /**
     * Apply a transformation to each value and flatten the results
     * @param transform Function to transform values into a Flow
     * @returns A new flow with flattened results
     */
    flatMap<R>(transform: (value: T) => Flow<R>): Flow<R>;
    /**
     * Take a specified number of values from the flow
     * @param count Number of values to take
     * @returns A new flow with at most count values
     */
    take(count: number): Flow<T>;
    /**
     * Apply a side effect to each value in the flow
     * @param action Function to apply to each value
     * @returns The same flow
     */
    onEach(action: (value: T) => void | Promise<void>): Flow<T>;
    /**
     * Collect all values from the flow into an array
     * @returns Promise that resolves to an array of all values
     */
    toArray(): Promise<T[]>;
    /**
     * Collect the first value from the flow
     * @returns Promise that resolves to the first value or null if the flow is empty
     */
    first(): Promise<T | null>;
    /**
     * Reduce the flow to a single value
     * @param initial Initial value
     * @param operation Function to combine values
     * @returns Promise that resolves to the reduced value
     */
    reduce<R>(initial: R, operation: (accumulator: R, value: T) => R | Promise<R>): Promise<R>;
    /**
     * Collect values from the flow with a simple callback
     * @param callback Function to call for each value
     * @returns Promise that resolves when collection is complete
     */
    collectValues(callback: (value: T) => void | Promise<void>): Promise<void>;
}
/**
 * Exception used to cancel flow collection
 */
export declare class FlowCancellationException extends Error {
    constructor();
}
/**
 * Create a flow from a function
 * @param block Function that emits values to a collector
 * @returns A new flow
 */
export declare function flow<T>(block: (collector: FlowCollector<T>) => Promise<void>): Flow<T>;
/**
 * Create a flow from a fixed set of values
 * @param values Values to emit
 * @returns A new flow
 */
export declare function flowOf<T>(...values: T[]): Flow<T>;
/**
 * Create a flow from an array
 * @param array Array of values
 * @returns A new flow
 */
export declare function flowFromArray<T>(array: T[]): Flow<T>;
/**
 * Create a flow from a promise
 * @param promise Promise to await
 * @returns A new flow that emits the promise result
 */
export declare function flowFromPromise<T>(promise: Promise<T>): Flow<T>;
/**
 * Create a flow that emits values at fixed intervals
 * @param period Interval in milliseconds
 * @param initialDelay Initial delay in milliseconds
 * @returns A new flow that emits incrementing numbers
 */
export declare function ticker(period: number, initialDelay?: number): Flow<number>;
/**
 * Collect a flow in a coroutine scope
 * @param scope The coroutine scope
 * @param flow The flow to collect
 * @param collector The collector function
 * @returns A job that can be used to cancel collection
 */
export declare function launchFlowCollection<T>(scope: CoroutineScope, flow: Flow<T>, collector: (value: T) => void | Promise<void>): Job;
/**
 * Convert a StateFlow to a Flow
 * @param stateFlow The StateFlow to convert
 * @returns A Flow that emits values from the StateFlow
 */
export declare function asFlow<T>(stateFlow: {
    getValue: () => T;
    subscribe: (id: string, callback: (value: T) => void) => () => void;
}): Flow<T>;
