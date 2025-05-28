import { ListStateFlow, ListStateFlowOptions } from './ListStateFlow';
/**
 * React hook for using a ListStateFlow with automatic subscription management
 * @param key Unique identifier for the ListStateFlow
 * @param initialItems Initial list items
 * @param options Configuration options
 * @returns [items, listStateFlow] - Current items and the ListStateFlow instance
 */
export declare function useGlobalListStateFlow<T extends Record<string | number | symbol, any>>(key: string, initialItems?: T[], options?: ListStateFlowOptions<T>): [T[], ListStateFlow<T>];
/**
 * React hook for using a specific item from a ListStateFlow
 * @param listFlow The ListStateFlow instance
 * @param itemId ID of the item to subscribe to
 * @returns [item, updateItem] - Current item and update function
 */
export declare function useListItem<T extends Record<string | number | symbol, any>>(listFlow: ListStateFlow<T>, itemId: string | number): [T | undefined, (updater: (item: T) => T) => void];
