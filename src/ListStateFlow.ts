// ListStateFlow.ts
import { Callback } from './types';
import { StateFlow } from './useStateFlow';
import { GlobalStateFlow, PersistOptions, StorageType } from './GlobalStateFlow';

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
export class ListStateFlow<T extends Record<string | number | symbol, any>> {
  private stateFlow: StateFlow<T[]>;
  private idField: keyof T;
  private itemStateFlows: Map<string | number, StateFlow<T>> = new Map();

  /**
   * Create a new ListStateFlow
   * @param key Unique identifier for this flow
   * @param initialItems Initial list items
   * @param options Configuration options
   */
  constructor(
    private key: string,
    initialItems: T[] = [],
    options: ListStateFlowOptions<T> = {}
  ) {
    this.idField = options.idField || 'id' as keyof T;
    
    // Create the main state flow for the entire list
    this.stateFlow = GlobalStateFlow<T[]>(key, initialItems, options.persistOptions);
    
    // Create individual state flows for each item
    this.initializeItemFlows(initialItems);
  }

  /**
   * Initialize individual state flows for each item
   */
  private initializeItemFlows(items: T[]): void {
    // Clear existing flows
    this.itemStateFlows.clear();
    
    // Create a flow for each item
    items.forEach(item => {
      const id = String(item[this.idField]);
      const itemKey = `${this.key}_item_${id}`;
      const itemFlow = GlobalStateFlow<T>(itemKey, item);
      this.itemStateFlows.set(id, itemFlow);
    });
  }

  /**
   * Get the current list of items
   */
  getItems(): T[] {
    return this.stateFlow.getValue();
  }

  /**
   * Get a specific item by ID
   */
  getItem(id: string | number): T | undefined {
    const stringId = String(id);
    const itemFlow = this.itemStateFlows.get(stringId);
    return itemFlow ? itemFlow.getValue() : undefined;
  }

  /**
   * Update the entire list
   */
  updateItems(newItems: T[]): void {
    this.stateFlow.update(newItems);
    this.initializeItemFlows(newItems);
  }

  /**
   * Update a specific item in the list
   */
  updateItem(id: string | number, updater: (item: T) => T): void {
    const stringId = String(id);
    const itemFlow = this.itemStateFlows.get(stringId);
    
    if (itemFlow) {
      const currentItem = itemFlow.getValue();
      const updatedItem = updater(currentItem);
      
      // Update the individual item flow
      itemFlow.update(updatedItem);
      
      // Update the item in the main list
      const currentList = this.stateFlow.getValue();
      const updatedList = currentList.map(item => 
        String(item[this.idField]) === stringId ? updatedItem : item
      );
      
      // Update the main list flow without reinitializing item flows
      this.stateFlow.update(updatedList);
    }
  }

  /**
   * Add a new item to the list
   */
  addItem(item: T): void {
    const id = String(item[this.idField]);
    
    // Create a new flow for this item
    const itemKey = `${this.key}_item_${id}`;
    const itemFlow = GlobalStateFlow<T>(itemKey, item);
    this.itemStateFlows.set(id, itemFlow);
    
    // Add to the main list
    const currentList = this.stateFlow.getValue();
    this.stateFlow.update([...currentList, item]);
  }

  /**
   * Remove an item from the list
   */
  removeItem(id: string | number): void {
    const stringId = String(id);
    
    // Remove from item flows
    this.itemStateFlows.delete(stringId);
    
    // Remove from the main list
    const currentList = this.stateFlow.getValue();
    const updatedList = currentList.filter(item => 
      String(item[this.idField]) !== stringId
    );
    
    this.stateFlow.update(updatedList);
  }

  /**
   * Subscribe to changes in the entire list
   */
  subscribeToList(uniqueId: string, callback: Callback<T[]>): () => void {
    return this.stateFlow.subscribe(uniqueId, callback);
  }

  /**
   * Subscribe to changes in a specific item
   */
  subscribeToItem(id: string | number, uniqueId: string, callback: Callback<T>): () => void {
    const stringId = String(id);
    const itemFlow = this.itemStateFlows.get(stringId);
    
    if (itemFlow) {
      return itemFlow.subscribe(uniqueId, callback);
    }
    
    // Return a no-op unsubscribe function if item doesn't exist
    return () => {};
  }

  /**
   * Batch update multiple items at once
   */
  batchUpdate(updates: { id: string | number; update: (item: T) => T }[]): void {
    const currentList = this.stateFlow.getValue();
    let updatedList = [...currentList];
    
    updates.forEach(({ id, update }) => {
      const stringId = String(id);
      const itemFlow = this.itemStateFlows.get(stringId);
      
      if (itemFlow) {
        const currentItem = itemFlow.getValue();
        const updatedItem = update(currentItem);
        
        // Update the individual item flow
        itemFlow.update(updatedItem);
        
        // Update in our temporary list
        updatedList = updatedList.map(item => 
          String(item[this.idField]) === stringId ? updatedItem : item
        );
      }
    });
    
    // Update the main list flow once with all changes
    this.stateFlow.update(updatedList);
  }

  /**
   * Filter the list and return a new array (doesn't modify the original list)
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this.stateFlow.getValue().filter(predicate);
  }

  /**
   * Map the list to a new array (doesn't modify the original list)
   */
  map<R>(mapper: (item: T) => R): R[] {
    return this.stateFlow.getValue().map(mapper);
  }

  /**
   * Get the number of items in the list
   */
  get size(): number {
    return this.stateFlow.getValue().length;
  }
}

// GlobalListStateFlow is now defined in GlobalListStateFlow.ts

/**
 * React hook to use a ListStateFlow
 * @deprecated Use useGlobalListStateFlow from useListStateFlow.ts instead
 */
export function useListStateFlow<T extends Record<string | number | symbol, any>>(
  key: string,
  initialItems: T[] = [],
  options: ListStateFlowOptions<T> = {}
): ListStateFlow<T> {
  // Create a new ListStateFlow instance
  return new ListStateFlow<T>(key, initialItems, options);
}
