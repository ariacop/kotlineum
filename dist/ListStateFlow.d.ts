import { Callback } from './types';
import { StateFlow } from './useStateFlow';
import { PersistOptions } from './GlobalStateFlow';
/**
 * Interface for item addition callbacks
 */
export interface ItemAdditionCallback<T> {
    onItemAdded: (item: T) => void;
}
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
 * Enhanced with stream-like operations similar to Kotlin's Flow
 */
export declare class ListStateFlow<T extends Record<string | number | symbol, any>> {
    private key;
    private stateFlow;
    private idField;
    private itemStateFlows;
    private pendingItemSubscriptions;
    private itemAdditionCallbacks;
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
     * Add a new item to the list with callback notification
     * @param item The item to add
     * @param callbackId Optional ID for the callback
     * @param callback Optional callback to execute when the item is added
     */
    addItemWithCallback(item: T, callbackId?: string, callback?: ItemAdditionCallback<T>): void;
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
     * Pre-register a subscription for an item that doesn't exist yet
     * @param id The ID of the item to subscribe to
     * @param uniqueId Unique identifier for the subscription
     * @param callback Function to call when the item is updated
     * @returns Function to unsubscribe
     */
    preSubscribeToItem(id: string | number, uniqueId: string, callback: Callback<T>): () => void;
    /**
     * Register a callback for when any item is added to the list
     * @param callbackId Unique identifier for the callback
     * @param callback Function to call when an item is added
     * @returns Function to unregister the callback
     */
    onItemAdded(callbackId: string, callback: ItemAdditionCallback<T>): () => void;
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
     * Find an item in the list
     * @param predicate Function to test each item
     * @returns The first item that satisfies the predicate, or undefined
     */
    find(predicate: (item: T) => boolean): T | undefined;
    /**
     * Check if any item in the list satisfies the predicate
     * @param predicate Function to test each item
     * @returns True if any item satisfies the predicate, false otherwise
     */
    some(predicate: (item: T) => boolean): boolean;
    /**
     * Check if all items in the list satisfy the predicate
     * @param predicate Function to test each item
     * @returns True if all items satisfy the predicate, false otherwise
     */
    every(predicate: (item: T) => boolean): boolean;
    /**
     * Reduce the list to a single value
     * @param reducer Function to reduce the list
     * @param initialValue Initial value for the reduction
     * @returns The reduced value
     */
    reduce<R>(reducer: (accumulator: R, item: T) => R, initialValue: R): R;
    /**
     * Sort the list and return a new array (doesn't modify the original list)
     * @param compareFn Function to compare items
     * @returns Sorted array
     */
    sort(compareFn?: (a: T, b: T) => number): T[];
    /**
     * Get a slice of the list
     * @param start Start index
     * @param end End index (exclusive)
     * @returns Sliced array
     */
    slice(start?: number, end?: number): T[];
    /**
     * Collect items from the list asynchronously
     * Similar to Kotlin's Flow.collect
     * @param collector Function to process the items
     * @returns Promise that resolves when collection is complete
     */
    collect(collector: (items: T[]) => void | Promise<void>): Promise<void>;
    /**
     * Transform the list and collect the results asynchronously
     * @param transform Function to transform each item
     * @param collector Function to process the transformed items
     * @returns Promise that resolves when collection is complete
     */
    mapAndCollect<R>(transform: (item: T) => R, collector: (items: R[]) => void | Promise<void>): Promise<void>;
    /**
     * Subscribe to the list and collect items as they change
     * @param uniqueId Unique identifier for the subscription
     * @param collector Function to process the items
     * @returns Function to unsubscribe
     */
    collectFlow(uniqueId: string, collector: (items: T[]) => void): () => void;
    /**
     * Map the list to a new array (doesn't modify the original list)
     * @param transform Function to transform each item
     * @returns Array of transformed items
     */
    map<R>(transform: (item: T) => R): R[];
    /**
     * Get the number of items in the list
     */
    get size(): number;
    /**
     * Get the underlying StateFlow
     * @returns StateFlow instance for the list
     */
    getStateFlow(): StateFlow<T[]>;
    /**
     * Clean up resources
     */
    dispose(): void;
}
/**
 * React hook to use a ListStateFlow
 * @deprecated Use useGlobalListStateFlow from useListStateFlow.ts instead
 */
export declare function useListStateFlow<T extends Record<string | number | symbol, any>>(key: string, initialItems?: T[], options?: ListStateFlowOptions<T>): ListStateFlow<T>;
