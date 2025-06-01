import { StateFlow } from './useStateFlow';
/**
 * Storage type for persistence
 */
export declare enum StorageType {
    /** Use localStorage (default) */
    LOCAL_STORAGE = "localStorage",
    /** Use IndexedDB */
    INDEXED_DB = "indexedDB"
}
/**
 * Event types for StateFlow
 */
export declare enum StateFlowEventType {
    INITIAL_LOAD_COMPLETE = "INITIAL_LOAD_COMPLETE",
    VALUE_UPDATED = "VALUE_UPDATED",
    PERSISTED = "PERSISTED",
    LOADED_FROM_STORAGE = "LOADED_FROM_STORAGE",
    ERROR = "ERROR"
}
/**
 * Event interface for StateFlow
 */
export interface StateFlowEvent<T> {
    type: StateFlowEventType;
    key: string;
    value?: T;
    timestamp: number;
    error?: Error;
}
/**
 * Options for persistent StateFlow
 */
export interface PersistOptions {
    /** Key to use in storage */
    storageKey?: string;
    /** Whether to enable persistence */
    enabled?: boolean;
    /** Storage type to use (localStorage or indexedDB) */
    storageType?: StorageType;
    /** Database name for IndexedDB (only used with IndexedDB) */
    dbName?: string;
    /** Store name for IndexedDB (only used with IndexedDB) */
    storeName?: string;
    /** Custom serializer function */
    serialize?: (value: any) => string;
    /** Custom deserializer function */
    deserialize?: (value: string) => any;
    /** Debounce time in ms for saving to storage (default: 300) */
    debounceTime?: number;
    /** Whether to emit events when values are updated or persisted */
    emitEvents?: boolean;
}
/**
 * Get or create a global StateFlow instance
 * @param key Unique identifier for this StateFlow
 * @param initialValue Initial value for the StateFlow (only used if creating a new instance)
 * @param persistOptions Options for persisting the state to localStorage
 * @returns A StateFlow instance
 */
export declare function GlobalStateFlow<T>(key: string, initialValue: T, persistOptions?: PersistOptions): StateFlow<T>;
/**
 * React hook to use a global StateFlow
 * @param key Unique identifier for the StateFlow
 * @param initialValue Initial value (only used if creating a new instance)
 * @param persistOptions Options for persisting the state to localStorage
 * @returns [currentValue, updateFunction]
 */
export declare function useGlobalStateFlow<T>(key: string, initialValue: T, persistOptions?: PersistOptions): [T, (newValue: T) => void];
