// Coroutines.ts
/**
 * Implementation of Kotlin-like Coroutines for TypeScript
 * Provides structured concurrency and cancellation support
 */

/**
 * Deferred represents a value that will be available in the future
 * Similar to Kotlin's Deferred
 */
export class Deferred<T> {
  private promise: Promise<T>;
  private resolveCallback!: (value: T) => void;
  private rejectCallback!: (reason: any) => void;
  private _completed: boolean = false;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolveCallback = (value: T) => {
        this._completed = true;
        resolve(value);
      };
      this.rejectCallback = (reason: any) => {
        this._completed = true;
        reject(reason);
      };
    });
  }

  /**
   * Check if the deferred has been completed
   */
  get completed(): boolean {
    return this._completed;
  }

  /**
   * Resolve the deferred with a value
   * @param value The value to resolve with
   */
  resolve(value: T): void {
    this.resolveCallback(value);
  }

  /**
   * Reject the deferred with a reason
   * @param reason The reason for rejection
   */
  reject(reason: any): void {
    this.rejectCallback(reason);
  }

  /**
   * Get the promise associated with this deferred
   * @returns Promise that will resolve to the deferred value
   */
  asPromise(): Promise<T> {
    return this.promise;
  }

  /**
   * Wait for the deferred to complete
   * Similar to Kotlin's await()
   */
  async await(): Promise<T> {
    return this.promise;
  }
}

/**
 * Job represents a cancellable unit of work
 * Similar to Kotlin's Job
 */
export class Job {
  private _cancelled: boolean = false;
  private _completed: boolean = false;
  private _children: Set<Job> = new Set();
  private _onCancelCallbacks: Array<() => void> = [];
  private _onCompleteCallbacks: Array<() => void> = [];

  /**
   * Check if the job is active
   */
  get isActive(): boolean {
    return !this._cancelled && !this._completed;
  }

  /**
   * Check if the job is cancelled
   */
  get isCancelled(): boolean {
    return this._cancelled;
  }

  /**
   * Check if the job is completed
   */
  get isCompleted(): boolean {
    return this._completed;
  }

  /**
   * Add a child job
   * @param child The child job to add
   */
  addChild(child: Job): void {
    if (this._cancelled) {
      child.cancel();
      return;
    }
    this._children.add(child);
    
    // Remove the child when it completes
    child.onComplete(() => {
      this._children.delete(child);
    });
  }

  /**
   * Cancel the job and all its children
   */
  cancel(): void {
    if (this._cancelled || this._completed) return;
    
    this._cancelled = true;
    
    // Cancel all children
    this._children.forEach(child => child.cancel());
    this._children.clear();
    
    // Run cancel callbacks
    this._onCancelCallbacks.forEach(callback => callback());
    this._onCancelCallbacks = [];
  }

  /**
   * Complete the job
   */
  complete(): void {
    if (this._cancelled || this._completed) return;
    
    this._completed = true;
    
    // Run complete callbacks
    this._onCompleteCallbacks.forEach(callback => callback());
    this._onCompleteCallbacks = [];
  }

  /**
   * Register a callback to run when the job is cancelled
   * @param callback The callback to run
   */
  onCancel(callback: () => void): void {
    if (this._cancelled) {
      callback();
      return;
    }
    this._onCancelCallbacks.push(callback);
  }

  /**
   * Register a callback to run when the job is completed
   * @param callback The callback to run
   */
  onComplete(callback: () => void): void {
    if (this._completed) {
      callback();
      return;
    }
    this._onCompleteCallbacks.push(callback);
  }

  /**
   * Join this job (wait for completion)
   * @returns Promise that resolves when the job completes
   */
  async join(): Promise<void> {
    if (this._completed || this._cancelled) return;
    
    return new Promise<void>((resolve) => {
      this.onComplete(() => resolve());
      this.onCancel(() => resolve());
    });
  }
}

/**
 * CoroutineScope for managing the lifecycle of coroutines
 * Similar to Kotlin's CoroutineScope
 */
export class CoroutineScope {
  private _job: Job;
  private _active: boolean = true;
  
  constructor(job?: Job) {
    this._job = job || new Job();
  }

  /**
   * Get the job associated with this scope
   */
  get job(): Job {
    return this._job;
  }

  /**
   * Check if the scope is active
   */
  get isActive(): boolean {
    return this._active && this._job.isActive;
  }

  /**
   * Launch a coroutine in this scope
   * @param task The task to execute
   * @returns Promise that resolves to the result of the task
   */
  launch<T>(task: () => Promise<T>): Job {
    if (!this.isActive) {
      throw new Error("Cannot launch in an inactive scope");
    }
    
    const childJob = new Job();
    this._job.addChild(childJob);
    
    // Execute the task
    const promise = task()
      .then(result => {
        childJob.complete();
        return result;
      })
      .catch(error => {
        childJob.complete();
        throw error;
      });
    
    // Handle cancellation
    childJob.onCancel(() => {
      // In a real implementation, we would need a way to cancel the promise
      // This is a limitation of JavaScript promises
    });
    
    return childJob;
  }

  /**
   * Create a deferred value in this scope
   * @returns A new Deferred instance
   */
  async<T>(): Deferred<T> {
    const deferred = new Deferred<T>();
    
    // Link the deferred to the scope's lifecycle
    this._job.onCancel(() => {
      if (!deferred.completed) {
        deferred.reject(new Error("Cancelled"));
      }
    });
    
    return deferred;
  }

  /**
   * Cancel the scope and all its coroutines
   */
  cancel(): void {
    this._active = false;
    this._job.cancel();
  }
}

/**
 * Create a new CoroutineScope
 * @returns A new CoroutineScope instance
 */
export function createCoroutineScope(): CoroutineScope {
  return new CoroutineScope();
}

/**
 * Delay execution for a specified time
 * Similar to Kotlin's delay function
 * @param ms Time to delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run a block with a timeout
 * Similar to Kotlin's withTimeout
 * @param ms Timeout in milliseconds
 * @param block The block to execute
 * @returns Promise that resolves to the result of the block or rejects if timeout occurs
 */
export async function withTimeout<T>(ms: number, block: () => Promise<T>): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timed out after ${ms}ms`));
    }, ms);
  });
  
  try {
    return await Promise.race([block(), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

/**
 * Run multiple tasks in parallel and wait for all to complete
 * @param tasks Tasks to run
 * @returns Promise that resolves when all tasks complete
 */
export async function awaitAll<T>(tasks: Array<Promise<T>>): Promise<T[]> {
  return Promise.all(tasks);
}

/**
 * Run a task in a new coroutine scope and wait for it to complete
 * Similar to Kotlin's coroutineScope function
 * @param block The block to execute
 * @returns Promise that resolves to the result of the block
 */
export async function coroutineScope<T>(block: (scope: CoroutineScope) => Promise<T>): Promise<T> {
  const scope = new CoroutineScope();
  
  try {
    return await block(scope);
  } finally {
    scope.cancel();
  }
}
