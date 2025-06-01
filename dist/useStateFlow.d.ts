import { Callback } from './types';
import { StateFlowEvent } from './GlobalStateFlow';
/**
 * Interface for StateFlow event subscriber
 */
export type StateFlowEventCallback<T> = (event: StateFlowEvent<T>) => void;
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
    subscribeToEvents?: (uniqueId: string, callback: StateFlowEventCallback<T>) => () => void;
    emitEvent?: (event: StateFlowEvent<T>) => void;
}
/**
 * Creates a local StateFlow instance
 * @param initialValue Initial value for the StateFlow
 * @returns A StateFlow instance
 */
export declare function StateFlow<T>(initialValue: T, options?: {
    emitEvents?: boolean;
}): StateFlow<T>;
/**
 * React hook to use a StateFlow within a component
 * @param initialValue Initial value for the StateFlow
 * @returns [currentValue, updateFunction] and StateFlow methods
 */
export declare function useStateFlow<T>(initialValue: T, options?: {
    emitEvents?: boolean;
}): StateFlow<T> & [T, (newValue: T) => void];
