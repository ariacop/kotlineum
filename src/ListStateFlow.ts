// ListStateFlow.ts
import { Callback } from './types';
import { StateFlow } from './useStateFlow';
import { GlobalStateFlow, PersistOptions, StorageType } from './GlobalStateFlow';
import Logger from './logger';

/**
 * Event types for ListStateFlow
 */
export enum ListStateFlowEventType {
  INITIAL_LOAD_COMPLETE = 'INITIAL_LOAD_COMPLETE',
  ITEM_ADDED = 'ITEM_ADDED',
  ITEM_UPDATED = 'ITEM_UPDATED',
  ITEM_REMOVED = 'ITEM_REMOVED'
}

/**
 * Event interface for ListStateFlow
 */
export interface ListStateFlowEvent<T> {
  type: ListStateFlowEventType;
  data?: any;
  item?: T;
  items?: T[];
  timestamp: number;
}

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
  /**
   * Whether to emit events when items are added, updated, or removed
   * @default true
   */
  emitEvents?: boolean;
}

/**
 * ListStateFlow for efficiently managing large lists with individual item updates
 * Enhanced with stream-like operations similar to Kotlin's Flow
 */
export class ListStateFlow<T extends Record<string | number | symbol, any>> {
  private stateFlow: StateFlow<T[]>;
  private idField: keyof T;
  private itemStateFlows: Map<string | number, StateFlow<T>> = new Map();
  private pendingItemSubscriptions: Map<string | number, Map<string, Callback<T>>> = new Map();
  private itemAdditionCallbacks: Map<string, ItemAdditionCallback<T>> = new Map();
  private eventSubscribers: Map<string, (event: ListStateFlowEvent<T>) => void> = new Map();
  private key: string;
  private emitEvents: boolean;

  /**
   * Create a new ListStateFlow
   * @param key Unique identifier for this flow
   * @param initialItems Initial list items
   * @param options Configuration options
   */
  constructor(
    key: string,
    initialItems: T[] = [],
    options: ListStateFlowOptions<T> = {}
  ) {
    this.key = key;
    this.idField = options.idField || 'id' as keyof T;
    this.emitEvents = options.emitEvents !== undefined ? options.emitEvents : true;
    
    // Create the main state flow for the entire list
    this.stateFlow = GlobalStateFlow<T[]>(key, initialItems, options.persistOptions);
    
    // Create individual state flows for each item
    this.initializeItemFlows(initialItems);
    
    // Emit event that initial loading is complete
    if (this.emitEvents) {
      this.emitEvent({
        type: ListStateFlowEventType.INITIAL_LOAD_COMPLETE,
        items: initialItems,
        timestamp: Date.now()
      });
    }
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
    
    // First try to get from the item flows
    const itemFlow = this.itemStateFlows.get(stringId);
    if (itemFlow) {
      return itemFlow.getValue();
    }
    
    // If not found in item flows, check the main list
    const currentList = this.stateFlow.getValue();
    const item = currentList.find(item => String(item[this.idField]) === stringId);
    
    if (item) {
      // If found in the main list but not in flows, create a flow for it
      Logger.debug(`[Kotlineum] ListStateFlow.getItem: Creating missing flow for item ${stringId}`);
      const itemKey = `${this.key}_item_${stringId}`;
      const newItemFlow = GlobalStateFlow<T>(itemKey, item);
      this.itemStateFlows.set(stringId, newItemFlow);
      return item;
    }
    
    return undefined;
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
   * If an item with the same ID already exists, only update subscribers without adding the item again
   */
  addItem(item: T): void {
    const id = String(item[this.idField]);
    
    // Check if an item with this ID already exists
    const existingItemFlow = this.itemStateFlows.get(id);
    const currentList = this.stateFlow.getValue();
    const itemExists = currentList.some(existingItem => String(existingItem[this.idField]) === id);
    
    if (existingItemFlow && itemExists) {
      // Item with this ID already exists, don't add it again
      // Just update the existing item flow with the new value
      existingItemFlow.update(item);
      
      // Emit item updated event
      if (this.emitEvents) {
        this.emitEvent({
          type: ListStateFlowEventType.ITEM_UPDATED,
          item: item,
          timestamp: Date.now()
        });
      }
    } else {
      // Create a new flow for this item
      const itemKey = `${this.key}_item_${id}`;
      const itemFlow = GlobalStateFlow<T>(itemKey, item);
      this.itemStateFlows.set(id, itemFlow);
      
      // Add to the main list only if it doesn't already exist
      this.stateFlow.update([...currentList, item]);
      
      // Trigger all registered callbacks
      this.itemAdditionCallbacks.forEach(callback => {
        callback.onItemAdded(item);
      });
      
      // Emit item added event
      if (this.emitEvents) {
        this.emitEvent({
          type: ListStateFlowEventType.ITEM_ADDED,
          item: item,
          timestamp: Date.now()
        });
      }
    }
    
    // Check if there are any pending subscriptions for this item
    const pendingSubscriptions = this.pendingItemSubscriptions.get(id);
    
    if (pendingSubscriptions) {
      // Activate all pending subscriptions
      pendingSubscriptions.forEach((callback, uniqueId) => {
        // Get the item flow (either existing or just created)
        const itemFlow = this.itemStateFlows.get(id);
        if (itemFlow) {
          itemFlow.subscribe(uniqueId, callback);
        }
      });
      
      // Clear the pending subscriptions for this item
      this.pendingItemSubscriptions.delete(id);
    }
  }
  
  /**
   * Add a new item to the list with callback notification
   * @param item The item to add
   * @param callbackId Optional ID for the callback
   * @param callback Optional callback to execute when the item is added
   */
  addItemWithCallback(
    item: T, 
    callbackId?: string, 
    callback?: ItemAdditionCallback<T>
  ): void {
    // Add the item using the standard method
    this.addItem(item);
    
    // Execute the provided callback if any
    if (callbackId && callback) {
      this.itemAdditionCallbacks.set(callbackId, callback);
      callback.onItemAdded(item);
    }
  }

  /**
   * Remove an item from the list
   */
  removeItem(id: string | number): void {
    const stringId = String(id);
    
    // Remove from item flows
    this.itemStateFlows.delete(stringId);
    
    // Remove the item from the list
    const currentList = this.stateFlow.getValue();
    const removedItem = currentList.find(item => String(item[this.idField]) === id);
    this.stateFlow.update(currentList.filter(item => String(item[this.idField]) !== id));
    
    // Emit item removed event
    if (this.emitEvents && removedItem) {
      this.emitEvent({
        type: ListStateFlowEventType.ITEM_REMOVED,
        item: removedItem,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Subscribe to changes in the entire list
   */
  subscribeToList(uniqueId: string, callback: Callback<T[]>): () => void {
    return this.stateFlow.subscribe(uniqueId, callback);
  }

  /**
   * Subscribe to changes in a specific item
   * If the item doesn't exist yet, it will automatically pre-register the subscription
   * @param id The ID of the item to subscribe to
   * @param uniqueId Unique identifier for the subscription
   * @param callback Function to call when the item is updated
   * @returns Function to unsubscribe
   */
  subscribeToItem(id: string | number, uniqueId: string, callback: Callback<T>): () => void {
    const stringId = String(id);
    const itemFlow = this.itemStateFlows.get(stringId);
    
    if (itemFlow) {
      // Item exists, subscribe normally
      return itemFlow.subscribe(uniqueId, callback);
    }
    
    // Item doesn't exist yet, store the subscription for later
    if (!this.pendingItemSubscriptions.has(stringId)) {
      this.pendingItemSubscriptions.set(stringId, new Map());
    }
    
    const pendingSubscriptions = this.pendingItemSubscriptions.get(stringId)!;
    pendingSubscriptions.set(uniqueId, callback);
    
    // Return a function to unsubscribe
    return () => {
      const subscriptions = this.pendingItemSubscriptions.get(stringId);
      if (subscriptions) {
        subscriptions.delete(uniqueId);
        if (subscriptions.size === 0) {
          this.pendingItemSubscriptions.delete(stringId);
        }
      }
    };
  }
  
  /**
   * Register a callback for when any item is added to the list
   * @param callbackId Unique identifier for the callback
   * @param callback Function to call when an item is added
   * @returns Function to unregister the callback
   */
  onItemAdded(
    callbackId: string, 
    callback: ItemAdditionCallback<T>
  ): () => void {
    this.itemAdditionCallbacks.set(callbackId, callback);
    
    // Return a function to unregister the callback
    return () => {
      this.itemAdditionCallbacks.delete(callbackId);
    };
  }

  /**
   * Add multiple items to the list at once
   * @param items Array of items to add
   */
  addItems(items: T[]): void {
    if (!items || items.length === 0) {
      Logger.debug(`[Kotlineum] ListStateFlow.addItems: No items to add`);
      return;
    }

    Logger.debug(`[Kotlineum] ListStateFlow.addItems: Adding ${items.length} items`);
    
    const currentList = this.stateFlow.getValue();
    // Create a new list instead of modifying the existing one
    // This prevents duplicate items from being added
    let newList = [...currentList];
    const addedItems: T[] = [];
    const updatedItems: T[] = [];
    
    // Process each item
    items.forEach(item => {
      const id = String(item[this.idField]);
      
      // Check if an item with this ID already exists in the current list
      const existingIndex = newList.findIndex(existingItem => 
        String(existingItem[this.idField]) === id
      );
      const existingItemFlow = this.itemStateFlows.get(id);
      
      if (existingIndex >= 0) {
        // Item with this ID already exists, update it
        if (existingItemFlow) {
          existingItemFlow.update(item);
        } else {
          // Create a flow if it doesn't exist (shouldn't happen normally)
          const itemKey = `${this.key}_item_${id}`;
          const itemFlow = GlobalStateFlow<T>(itemKey, item);
          this.itemStateFlows.set(id, itemFlow);
        }
        
        // Update the item in our new list
        newList[existingIndex] = item;
        updatedItems.push(item);
      } else {
        // Create a new flow for this item
        const itemKey = `${this.key}_item_${id}`;
        const itemFlow = GlobalStateFlow<T>(itemKey, item);
        this.itemStateFlows.set(id, itemFlow);
        
        // Add to our new list
        newList.push(item);
        addedItems.push(item);
        
        // Check if there are any pending subscriptions for this item
        const pendingSubscriptions = this.pendingItemSubscriptions.get(id);
        
        if (pendingSubscriptions) {
          // Activate all pending subscriptions
          pendingSubscriptions.forEach((callback, uniqueId) => {
            itemFlow.subscribe(uniqueId, callback);
          });
          
          // Clear the pending subscriptions for this item
          this.pendingItemSubscriptions.delete(id);
        }
      }
    });
    
    // Update the main list flow once with all changes
    this.stateFlow.update(newList);
    
    // Trigger callbacks and emit events
    if (addedItems.length > 0) {
      // Trigger all registered callbacks for added items
      addedItems.forEach(item => {
        this.itemAdditionCallbacks.forEach(callback => {
          callback.onItemAdded(item);
        });
      });
      
      // Emit items added event
      if (this.emitEvents) {
        this.emitEvent({
          type: ListStateFlowEventType.ITEM_ADDED,
          items: addedItems,
          timestamp: Date.now()
        });
      }
    }
    
    // Emit items updated event if any items were updated
    if (updatedItems.length > 0 && this.emitEvents) {
      this.emitEvent({
        type: ListStateFlowEventType.ITEM_UPDATED,
        items: updatedItems,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Add multiple items to the list with callback notification
   * @param items Array of items to add
   * @param callbackId Optional ID for the callback
   * @param callback Optional callback to execute when items are added
   */
  addItemsWithCallback(
    items: T[], 
    callbackId?: string, 
    callback?: ItemAdditionCallback<T>
  ): void {
    // Register the callback first if provided
    if (callbackId && callback) {
      this.itemAdditionCallbacks.set(callbackId, callback);
    }
    
    // Add the items using the standard method
    // The callback will be triggered automatically in addItems for new items
    this.addItems(items);
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
   * Find an item in the list
   * @param predicate Function to test each item
   * @returns The first item that satisfies the predicate, or undefined
   */
  find(predicate: (item: T) => boolean): T | undefined {
    return this.stateFlow.getValue().find(predicate);
  }
  
  /**
   * Check if any item in the list satisfies the predicate
   * @param predicate Function to test each item
   * @returns True if any item satisfies the predicate, false otherwise
   */
  some(predicate: (item: T) => boolean): boolean {
    return this.stateFlow.getValue().some(predicate);
  }
  
  /**
   * Check if all items in the list satisfy the predicate
   * @param predicate Function to test each item
   * @returns True if all items satisfy the predicate, false otherwise
   */
  every(predicate: (item: T) => boolean): boolean {
    return this.stateFlow.getValue().every(predicate);
  }
  
  /**
   * Reduce the list to a single value
   * @param reducer Function to reduce the list
   * @param initialValue Initial value for the reduction
   * @returns The reduced value
   */
  reduce<R>(reducer: (accumulator: R, item: T) => R, initialValue: R): R {
    return this.stateFlow.getValue().reduce(
      (acc, item) => reducer(acc, item),
      initialValue
    );
  }
  
  /**
   * Sort the list and return a new array (doesn't modify the original list)
   * @param compareFn Function to compare items
   * @returns Sorted array
   */
  sort(compareFn?: (a: T, b: T) => number): T[] {
    return [...this.stateFlow.getValue()].sort(compareFn);
  }
  
  /**
   * Get a slice of the list
   * @param start Start index
   * @param end End index (exclusive)
   * @returns Sliced array
   */
  slice(start?: number, end?: number): T[] {
    return this.stateFlow.getValue().slice(start, end);
  }
  
  /**
   * Collect items from the list asynchronously
   * Similar to Kotlin's Flow.collect
   * @param collector Function to process the items
   * @returns Promise that resolves when collection is complete
   */
  async collect(collector: (items: T[]) => void | Promise<void>): Promise<void> {
    const items = this.stateFlow.getValue();
    await collector(items);
    
    // Return a promise that resolves when the collector is done
    return Promise.resolve();
  }
  
  /**
   * Transform the list and collect the results asynchronously
   * @param transform Function to transform each item
   * @param collector Function to process the transformed items
   * @returns Promise that resolves when collection is complete
   */
  async mapAndCollect<R>(
    transform: (item: T) => R,
    collector: (items: R[]) => void | Promise<void>
  ): Promise<void> {
    const items = this.stateFlow.getValue().map(transform);
    await collector(items);
    
    // Return a promise that resolves when the collector is done
    return Promise.resolve();
  }
  
  /**
   * Subscribe to the list and collect items as they change
   * @param uniqueId Unique identifier for the subscription
   * @param collector Function to process the items
   * @returns Function to unsubscribe
   */
  collectFlow(uniqueId: string, collector: (items: T[]) => void): () => void {
    return this.subscribeToList(uniqueId, collector);
  }

  /**
   * Map the list to a new array (doesn't modify the original list)
   * @param transform Function to transform each item
   * @returns Array of transformed items
   */
  map<R>(transform: (item: T) => R): R[] {
    return this.stateFlow.getValue().map(transform);
  }

  /**
   * Get the number of items in the list
   */
  get size(): number {
    return this.stateFlow.getValue().length;
  }

  /**
   * Get the underlying StateFlow
   * @returns StateFlow instance for the list
   */
  getStateFlow(): StateFlow<T[]> {
    return this.stateFlow;
  }

  /**
   * Subscribe to events from this ListStateFlow
   * @param uniqueId Unique identifier for the subscription
   * @param callback Function to call when an event occurs
   * @returns Function to unsubscribe
   */
  subscribeToEvents(uniqueId: string, callback: (event: ListStateFlowEvent<T>) => void): () => void {
    this.eventSubscribers.set(uniqueId, callback);
    
    return () => {
      this.eventSubscribers.delete(uniqueId);
    };
  }
  
  /**
   * Emit an event to all subscribers
   * @param event The event to emit
   */
  private emitEvent(event: ListStateFlowEvent<T>): void {
    this.eventSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        Logger.error('Error in event subscriber:', e);
      }
    });
  }
  
  /**
   * Dispose this flow and all item flows
   */
  dispose(): void {
    // Dispose all item flows
    this.itemStateFlows.forEach(flow => flow.dispose());
    
    // Clear the maps
    this.itemStateFlows.clear();
    this.pendingItemSubscriptions.clear();
    this.itemAdditionCallbacks.clear();
    this.eventSubscribers.clear();
    
    // Dispose the main flow
    this.stateFlow.dispose();
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
