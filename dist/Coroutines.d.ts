/**
 * Implementation of Kotlin-like Coroutines for TypeScript
 * Provides structured concurrency and cancellation support
 */
/**
 * Deferred represents a value that will be available in the future
 * Similar to Kotlin's Deferred
 */
export declare class Deferred<T> {
    private promise;
    private resolveCallback;
    private rejectCallback;
    private _completed;
    constructor();
    /**
     * Check if the deferred has been completed
     */
    get completed(): boolean;
    /**
     * Resolve the deferred with a value
     * @param value The value to resolve with
     */
    resolve(value: T): void;
    /**
     * Reject the deferred with a reason
     * @param reason The reason for rejection
     */
    reject(reason: any): void;
    /**
     * Get the promise associated with this deferred
     * @returns Promise that will resolve to the deferred value
     */
    asPromise(): Promise<T>;
    /**
     * Wait for the deferred to complete
     * Similar to Kotlin's await()
     */
    await(): Promise<T>;
}
/**
 * Job represents a cancellable unit of work
 * Similar to Kotlin's Job
 */
export declare class Job {
    private _cancelled;
    private _completed;
    private _children;
    private _onCancelCallbacks;
    private _onCompleteCallbacks;
    /**
     * Check if the job is active
     */
    get isActive(): boolean;
    /**
     * Check if the job is cancelled
     */
    get isCancelled(): boolean;
    /**
     * Check if the job is completed
     */
    get isCompleted(): boolean;
    /**
     * Add a child job
     * @param child The child job to add
     */
    addChild(child: Job): void;
    /**
     * Cancel the job and all its children
     */
    cancel(): void;
    /**
     * Complete the job
     */
    complete(): void;
    /**
     * Register a callback to run when the job is cancelled
     * @param callback The callback to run
     */
    onCancel(callback: () => void): void;
    /**
     * Register a callback to run when the job is completed
     * @param callback The callback to run
     */
    onComplete(callback: () => void): void;
    /**
     * Join this job (wait for completion)
     * @returns Promise that resolves when the job completes
     */
    join(): Promise<void>;
}
/**
 * CoroutineScope for managing the lifecycle of coroutines
 * Similar to Kotlin's CoroutineScope
 */
export declare class CoroutineScope {
    private _job;
    private _active;
    constructor(job?: Job);
    /**
     * Get the job associated with this scope
     */
    get job(): Job;
    /**
     * Check if the scope is active
     */
    get isActive(): boolean;
    /**
     * Launch a coroutine in this scope
     * @param task The task to execute
     * @returns Promise that resolves to the result of the task
     */
    launch<T>(task: () => Promise<T>): Job;
    /**
     * Create a deferred value in this scope
     * @returns A new Deferred instance
     */
    async<T>(): Deferred<T>;
    /**
     * Cancel the scope and all its coroutines
     */
    cancel(): void;
}
/**
 * Create a new CoroutineScope
 * @returns A new CoroutineScope instance
 */
export declare function createCoroutineScope(): CoroutineScope;
/**
 * Delay execution for a specified time
 * Similar to Kotlin's delay function
 * @param ms Time to delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Run a block with a timeout
 * Similar to Kotlin's withTimeout
 * @param ms Timeout in milliseconds
 * @param block The block to execute
 * @returns Promise that resolves to the result of the block or rejects if timeout occurs
 */
export declare function withTimeout<T>(ms: number, block: () => Promise<T>): Promise<T>;
/**
 * Run multiple tasks in parallel and wait for all to complete
 * @param tasks Tasks to run
 * @returns Promise that resolves when all tasks complete
 */
export declare function awaitAll<T>(tasks: Array<Promise<T>>): Promise<T[]>;
/**
 * Run a task in a new coroutine scope and wait for it to complete
 * Similar to Kotlin's coroutineScope function
 * @param block The block to execute
 * @returns Promise that resolves to the result of the block
 */
export declare function coroutineScope<T>(block: (scope: CoroutineScope) => Promise<T>): Promise<T>;
