import { StateFlow } from './useStateFlow';
/**
 * Get or create a global StateFlow instance
 * @param key Unique identifier for this StateFlow
 * @param initialValue Initial value for the StateFlow (only used if creating a new instance)
 * @returns A StateFlow instance
 */
export declare function GlobalStateFlow<T>(key: string, initialValue: T): StateFlow<T>;
/**
 * React hook to use a global StateFlow
 * @param key Unique identifier for the StateFlow
 * @param initialValue Initial value (only used if creating a new instance)
 * @returns [currentValue, updateFunction]
 */
export declare function useGlobalStateFlow<T>(key: string, initialValue: T): [T, (newValue: T) => void];
