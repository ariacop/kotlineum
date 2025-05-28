// useListStateFlow.ts
import { useEffect, useState } from 'react';
import { ListStateFlow, GlobalListStateFlow, ListStateFlowOptions } from './ListStateFlow';

/**
 * React hook for using a ListStateFlow with automatic subscription management
 * @param key Unique identifier for the ListStateFlow
 * @param initialItems Initial list items
 * @param options Configuration options
 * @returns [items, listStateFlow] - Current items and the ListStateFlow instance
 */
export function useGlobalListStateFlow<T extends Record<string | number | symbol, any>>(
  key: string,
  initialItems: T[] = [],
  options: ListStateFlowOptions<T> = {}
): [T[], ListStateFlow<T>] {
  // Get or create the ListStateFlow
  const listFlow = GlobalListStateFlow<T>(key, initialItems, options);
  
  // Local state to track the current items
  const [items, setItems] = useState<T[]>(listFlow.getItems());
  
  useEffect(() => {
    // Subscribe to changes in the list
    const unsubscribe = listFlow.subscribeToList(`hook-${key}-${Math.random()}`, (newItems) => {
      setItems(newItems);
    });
    
    // Initial sync
    setItems(listFlow.getItems());
    
    // Cleanup subscription
    return unsubscribe;
  }, [key, listFlow]);
  
  return [items, listFlow];
}

/**
 * React hook for using a specific item from a ListStateFlow
 * @param listFlow The ListStateFlow instance
 * @param itemId ID of the item to subscribe to
 * @returns [item, updateItem] - Current item and update function
 */
export function useListItem<T extends Record<string | number | symbol, any>>(
  listFlow: ListStateFlow<T>,
  itemId: string | number
): [T | undefined, (updater: (item: T) => T) => void] {
  // Local state to track the current item
  const [item, setItem] = useState<T | undefined>(listFlow.getItem(itemId));
  
  // Update function
  const updateItem = (updater: (item: T) => T) => {
    if (item) {
      listFlow.updateItem(itemId, updater);
    }
  };
  
  useEffect(() => {
    // Subscribe to changes in the specific item
    const unsubscribe = listFlow.subscribeToItem(
      itemId,
      `item-hook-${itemId}-${Math.random()}`,
      (newItem) => {
        setItem(newItem);
      }
    );
    
    // Initial sync
    setItem(listFlow.getItem(itemId));
    
    // Cleanup subscription
    return unsubscribe;
  }, [listFlow, itemId]);
  
  return [item, updateItem];
}
