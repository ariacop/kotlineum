import { Callback } from './types';
import { PersistOptions } from './GlobalStateFlow';
/**
 * Options for ListStateFlow
 */
export interface ListStateFlowOptions<T> {
    /** Custom ID field for list items (default: 'id') */
    idField?: keyof T;
    /** Persistence options */
    persistOptions?: PersistOptions;
}
/**
 * ListStateFlow for efficiently managing large lists with individual item updates
 */
export declare class ListStateFlow<T extends Record<string | number | symbol, any>> {
    private key;
    private stateFlow;
    private idField;
    private itemStateFlows;
    /**
     * Create a new ListStateFlow
     * @param key Unique identifier for this flow
     * @param initialItems Initial list items
     * @param options Configuration options
     */
    constructor(key: string, initialItems?: T[], options?: ListStateFlowOptions<T>);
    /**
     * Initialize individual state flows for each item
     */
    private initializeItemFlows;
    /**
     * Get the current list of items
     */
    getItems(): T[];
    /**
     * Get a specific item by ID
     */
    getItem(id: string | number): T | undefined;
    /**
     * Update the entire list
     */
    updateItems(newItems: T[]): void;
    /**
     * Update a specific item in the list
     */
    updateItem(id: string | number, updater: (item: T) => T): void;
    /**
     * Add a new item to the list
     */
    addItem(item: T): void;
    /**
     * Remove an item from the list
     */
    removeItem(id: string | number): void;
    /**
     * Subscribe to changes in the entire list
     */
    subscribeToList(uniqueId: string, callback: Callback<T[]>): () => void;
    /**
     * Subscribe to changes in a specific item
     */
    subscribeToItem(id: string | number, uniqueId: string, callback: Callback<T>): () => void;
    /**
     * Batch update multiple items at once
     */
    batchUpdate(updates: {
        id: string | number;
        update: (item: T) => T;
    }[]): void;
    /**
     * Filter the list and return a new array (doesn't modify the original list)
     */
    filter(predicate: (item: T) => boolean): T[];
    /**
     * Map the list to a new array (doesn't modify the original list)
     */
    map<R>(mapper: (item: T) => R): R[];
    /**
     * Get the number of items in the list
     */
    get size(): number;
}
/**
 * React hook to use a ListStateFlow
 * @deprecated Use useGlobalListStateFlow from useListStateFlow.ts instead
 */
export declare function useListStateFlow<T extends Record<string | number | symbol, any>>(key: string, initialItems?: T[], options?: ListStateFlowOptions<T>): ListStateFlow<T>;
