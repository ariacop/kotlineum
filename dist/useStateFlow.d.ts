import { Callback } from './types';
/**
 * Interface for StateFlow
 */
export interface StateFlow<T> {
    getValue: () => T;
    subscribe: (uniqueId: string, callback: Callback<T>) => () => void;
    unsubscribe: (uniqueId: string) => void;
    update: (newValue: T) => void;
    getSubscriberCount: () => number;
    dispose: () => void;
}
/**
 * Creates a local StateFlow instance
 * @param initialValue Initial value for the StateFlow
 * @returns A StateFlow instance
 */
export declare function StateFlow<T>(initialValue: T): StateFlow<T>;
/**
 * React hook to use a StateFlow within a component
 * @param initialValue Initial value for the StateFlow
 * @returns [currentValue, updateFunction] and StateFlow methods
 */
export declare function useStateFlow<T>(initialValue: T): StateFlow<T> & [T, (newValue: T) => void];
