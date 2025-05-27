import { Callback } from './types';
import { SharedFlow } from './useSharedFlow';
/**
 * Get or create a global SharedFlow instance
 * @param key Unique identifier for this SharedFlow
 * @returns A SharedFlow instance
 */
export declare function GlobalSharedFlow<T>(key: string): SharedFlow<T>;
/**
 * React hook to use a global SharedFlow
 * @param key Unique identifier for the SharedFlow
 * @param initialCallback Optional callback function to be called when a value is emitted
 * @returns [emitFunction, subscribeFunction]
 */
export declare function useGlobalSharedFlow<T>(key: string, initialCallback?: Callback<T>): [(value: T) => void, (callback: Callback<T>) => () => void];
/**
 * Hook to subscribe to a global shared flow and get the latest emitted value
 * @param key Unique identifier for the SharedFlow
 * @param initialState Optional initial state
 * @returns [latestValue, emitFunction]
 */
export declare function useGlobalSharedFlowWithState<T>(key: string, initialState?: T): [T | undefined, (value: T) => void];
