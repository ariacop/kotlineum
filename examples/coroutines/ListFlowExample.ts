import { ListStateFlow } from '../../src/ListStateFlow';
import { flow, Flow, flowOf, asFlow } from '../../src/Flow';
import { CoroutineScope, createCoroutineScope, delay } from '../../src/Coroutines';

/**
 * Example of combining ListStateFlow with Flow
 * This class demonstrates how to use Flow to process ListStateFlow data
 */
export class ProductListFlow<T extends { id: number }> {
  private listStateFlow: ListStateFlow<T>;
  private coroutineScope: CoroutineScope;

  constructor(initialItems: T[] = []) {
    // Create ListStateFlow with a unique key
    this.listStateFlow = new ListStateFlow<T>('product_list_flow', initialItems, {
      idField: 'id'
    });
    
    // Create CoroutineScope for managing asynchronous operations
    this.coroutineScope = createCoroutineScope();
  }

  /**
   * Convert ListStateFlow to Flow
   * This enables the use of Flow operations
   */
  asFlow(): Flow<T[]> {
    return asFlow(this.listStateFlow.getStateFlow());
  }

  /**
   * Get Flow of filtered items
   * @param predicate Filter function
   */
  filteredFlow(predicate: (item: T) => boolean): Flow<T[]> {
    return this.asFlow().map(items => items.filter(predicate));
  }

  /**
   * Get Flow of sorted items
   * @param compareFn Comparison function
   */
  sortedFlow(compareFn: (a: T, b: T) => number): Flow<T[]> {
    return this.asFlow().map(items => [...items].sort(compareFn));
  }

  /**
   * Get Flow of a specific item
   * @param id Item identifier
   */
  itemFlow(id: number): Flow<T | null> {
    return this.asFlow().map(items => items.find(item => item.id === id) || null);
  }

  /**
   * Process items asynchronously using Flow
   * @param processor Processing function
   */
  async processItems(processor: (item: T) => Promise<void>): Promise<void> {
    const items = this.listStateFlow.getStateFlow().getValue();
    const itemsFlow = flowOf(...items);
    
    await itemsFlow.collectValues(async (item) => {
      await processor(item);
    });
  }

  /**
   * Add items in batches with delay
   * Useful for simulating gradual data loading
   * @param items New items
   * @param delayMs Delay between each addition
   */
  async addItemsWithDelay(items: T[], delayMs: number = 500): Promise<void> {
    const itemsFlow = flowOf(...items);
    
    await itemsFlow.collectValues(async (item) => {
      this.listStateFlow.addItem(item);
      await delay(delayMs);
    });
  }

  /**
   * Map items to new values and collect results
   * @param transform Transform function
   */
  async mapAndCollect<R>(transform: (item: T) => Promise<R>): Promise<R[]> {
    const items = this.listStateFlow.getStateFlow().getValue();
    const itemsFlow = flowOf(...items);
    
    const results: R[] = [];
    
    await itemsFlow.collectValues(async (item) => {
      const result = await transform(item);
      results.push(result);
    });
    
    return results;
  }

  /**
   * Subscribe to list changes using Flow
   * @param callback Callback function for each change
   * @returns Unsubscribe function
   */
  subscribeToChanges(callback: (items: T[]) => void): () => void {
    const id = `flow-subscription-${Date.now()}`;
    return this.listStateFlow.getStateFlow().subscribe(id, callback);
  }

  /**
   * Search items using Flow
   * @param searchFn Search function
   */
  async searchItems(searchFn: (item: T) => boolean): Promise<T[]> {
    const result = await this.asFlow()
      .map(items => items.filter(searchFn))
      .first();
    return result || [];
  }

  /**
   * Batch update items
   * @param updater Update function
   */
  async batchUpdate(updater: (item: T) => T): Promise<void> {
    const items = this.listStateFlow.getStateFlow().getValue();
    
    // Create Flow from items
    const itemsFlow = flowOf(...items);
    
    // Collect updated items
    const updates: { id: number; update: (item: T) => T }[] = [];
    
    items.forEach(item => {
      updates.push({
        id: item.id,
        update: updater
      });
    });
    
    // Update all items in one operation
    this.listStateFlow.batchUpdate(updates);
  }

  /**
   * Add a new item
   * @param item New item
   */
  add(item: T): void {
    this.listStateFlow.addItem(item);
  }

  /**
   * Update an item
   * @param item Updated item
   */
  update(item: T): void {
    this.listStateFlow.updateItem(item.id, () => item);
  }

  /**
   * Remove an item
   * @param id Item ID
   */
  remove(id: number): void {
    this.listStateFlow.removeItem(id);
  }

  /**
   * Get all items
   */
  getItems(): T[] {
    return this.listStateFlow.getStateFlow().getValue();
  }

  /**
   * Get an item by ID
   * @param id Item ID
   */
  getItem(id: number): T | undefined {
    return this.listStateFlow.getStateFlow().getValue().find(item => item.id === id);
  }

  /**
   * Subscribe to list changes
   * @param id Subscription ID
   * @param callback Callback function for each change
   */
  subscribe(id: string, callback: (items: T[]) => void): () => void {
    return this.listStateFlow.getStateFlow().subscribe(id, callback);
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.coroutineScope.cancel();
    this.listStateFlow.dispose();
  }
}
