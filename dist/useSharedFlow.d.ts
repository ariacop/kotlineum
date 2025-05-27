import { Callback } from './types';
/**
 * Interface for SharedFlow
 * Similar to Kotlin's SharedFlow, this provides a way to emit values to multiple subscribers
 * without maintaining a current state value
 */
export interface SharedFlow<T> {
    subscribe: (uniqueId: string, callback: Callback<T>) => () => void;
    unsubscribe: (uniqueId: string) => void;
    emit: (value: T) => void;
    getSubscriberCount: () => number;
}
/**
 * Creates a local SharedFlow instance
 * @returns A SharedFlow instance
 */
export declare function SharedFlow<T>(): SharedFlow<T>;
/**
 * React hook to use a SharedFlow within a component
 * @returns A SharedFlow instance and utility functions
 */
export declare function useSharedFlow<T>(): SharedFlow<T> & [(value: T) => void, (callback: Callback<T>) => () => void];
/**
 * Hook to create a SharedFlow and get the latest emitted value
 * @param initialState Optional initial state
 * @returns [latestValue, emitFunction, subscribeFunction]
 */
export declare function useSharedFlowWithState<T>(initialState?: T): [T | undefined, (value: T) => void, (callback: Callback<T>) => () => void];
