import { ViewModel } from '../../src/ViewModel';
import { ListStateFlow } from '../../src/ListStateFlow';
import { StorageType } from '../../src/GlobalStateFlow';

// Define product interface
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  lastUpdated: string;
  status: 'available' | 'low-stock' | 'out-of-stock';
}

// Define events for the ViewModel
export enum ProductEvent {
  LOADED = 'LOADED',
  PRODUCT_ADDED = 'PRODUCT_ADDED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_REMOVED = 'PRODUCT_REMOVED',
  STOCK_UPDATED = 'STOCK_UPDATED',
  BATCH_UPDATED = 'BATCH_UPDATED',
  ERROR = 'ERROR'
}

// Define intents for the ViewModel (MVI pattern)
export type ProductIntent =
  | { type: 'FETCH_PRODUCTS' }
  | { type: 'ADD_PRODUCT'; product: Product }
  | { type: 'UPDATE_PRODUCT'; id: number; updates: Partial<Omit<Product, 'id'>> }
  | { type: 'REMOVE_PRODUCT'; id: number }
  | { type: 'UPDATE_STOCK'; id: number; newStock: number }
  | { type: 'BATCH_UPDATE_STOCK'; updates: Array<{ id: number; newStock: number }> }
  | { type: 'CONNECT_REALTIME' }
  | { type: 'DISCONNECT_REALTIME' }

/**
 * ProductViewModel combines business logic with efficient list state management
 * It handles both API calls and real-time updates
 * Now implements MVI pattern with intents
 */
export class ProductViewModel extends ViewModel<Product[], ProductEvent, ProductIntent> {
  // ListStateFlow for efficient list management
  private productsListFlow: ListStateFlow<Product>;
  // Store unsubscribe functions
  private _unsubscribeFunctions: Map<string, () => void> = new Map();
  // Socket connection for real-time updates
  private socket: any = null;
  // Connection status
  private _connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';

  constructor() {
    super([]); // Initialize with empty array

    // Create ListStateFlow instance
    this.productsListFlow = new ListStateFlow<Product>(
      'products',
      [],
      {
        idField: 'id',
        persistOptions: {
          enabled: true,
          storageType: StorageType.INDEXED_DB,
          dbName: 'products-db',
          storeName: 'products-store',
          debounceTime: 300
        }
      }
    );

    // Subscribe to list changes to update ViewModel state
    // We need to manually track changes since ListStateFlow doesn't have a direct subscribe method
    let previousProducts = this.productsListFlow.getItems();
    
    // Create an interval to check for changes
    const intervalId = setInterval(() => {
      const currentProducts = this.productsListFlow.getItems();
      if (JSON.stringify(currentProducts) !== JSON.stringify(previousProducts)) {
        this.updateData(currentProducts);
        previousProducts = currentProducts;
      }
    }, 100);
    
    // Store the cleanup function
    this._unsubscribeFunctions.set('viewmodel-subscription', () => clearInterval(intervalId));
  }

  /**
   * Get connection status
   */
  get connectionStatus(): 'connected' | 'disconnected' | 'error' {
    return this._connectionStatus;
  }

  /**
   * Get the ListStateFlow instance for direct operations
   */
  getListStateFlow(): ListStateFlow<Product> {
    return this.productsListFlow;
  }

  /**
   * Fetch initial data from API
   */
  async fetchProducts(): Promise<void> {
    this.setLoading(true);
    try {
      // In a real app, replace with your API endpoint
      const response = await fetch('https://api.example.com/products');
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data: Product[] = await response.json();
      
      // Update ListStateFlow with fetched data
      this.productsListFlow.updateItems(data);
      
      // Emit event
      this.emitEvent(ProductEvent.LOADED);
      this.setLoading(false);
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Unknown error');
      this.emitEvent(ProductEvent.ERROR);
      this.setLoading(false);
    }
  }

  /**
   * Process intents according to the MVI pattern
   * @param intent The intent to process
   */
  protected processIntent(intent: ProductIntent): void {
    switch (intent.type) {
      case 'FETCH_PRODUCTS':
        this.fetchProducts();
        break;
      case 'ADD_PRODUCT':
        this.addProduct(intent.product);
        break;
      case 'UPDATE_PRODUCT':
        this.updateProduct(intent.id, intent.updates);
        break;
      case 'REMOVE_PRODUCT':
        this.removeProduct(intent.id);
        break;
      case 'UPDATE_STOCK':
        this.updateStock(intent.id, intent.newStock);
        break;
      case 'BATCH_UPDATE_STOCK':
        this.batchUpdateStock(intent.updates);
        break;
      case 'CONNECT_REALTIME':
        this.connectToRealTimeUpdates();
        break;
      case 'DISCONNECT_REALTIME':
        this.disconnect();
        break;
      default:
        console.warn('Unknown intent type:', (intent as any).type);
    }
  }
  
  /**
   * Connect to Socket.io for real-time updates
   */
  private connectToRealTimeUpdates(): void {
    try {
      // In a real app, use the actual socket.io-client
      // import { io } from 'socket.io-client';
      // this.socket = io('https://api.example.com');
      
      // Simulation for the example
      this.socket = this.createMockSocket();
      
      // Setup event handlers
      this.setupSocketEvents();
      
      // Update connection status
      this._connectionStatus = 'connected';
    } catch (error) {
      this.setError(error instanceof Error ? error.message : 'Connection error');
      this._connectionStatus = 'error';
      this.emitEvent(ProductEvent.ERROR);
    }
  }

  /**
   * Disconnect from Socket.io
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this._connectionStatus = 'disconnected';
    }
  }

  /**
   * Add a new product
   */
  addProduct(product: Product): void {
    // Add to ListStateFlow
    this.productsListFlow.addItem(product);
    
    // In a real app, send to server
    if (this.socket && this._connectionStatus === 'connected') {
      this.socket.emit('addProduct', product);
    }
    
    // Emit event
    this.emitEvent(ProductEvent.PRODUCT_ADDED);
  }

  /**
   * Update a product
   */
  updateProduct(id: number, updates: Partial<Omit<Product, 'id'>>): void {
    // Update in ListStateFlow
    this.productsListFlow.updateItem(id, (product) => {
      const updatedProduct = {
        ...product,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      // In a real app, send to server
      if (this.socket && this._connectionStatus === 'connected') {
        this.socket.emit('updateProduct', updatedProduct);
      }
      
      return updatedProduct;
    });
    
    // Emit event
    this.emitEvent(ProductEvent.PRODUCT_UPDATED);
  }

  /**
   * Update product stock
   */
  updateStock(id: number, newStock: number): void {
    // Determine status based on stock level
    let status: 'available' | 'low-stock' | 'out-of-stock';
    
    if (newStock <= 0) {
      status = 'out-of-stock';
    } else if (newStock < 10) {
      status = 'low-stock';
    } else {
      status = 'available';
    }
    
    // Update in ListStateFlow
    this.productsListFlow.updateItem(id, (product) => {
      const updatedProduct = {
        ...product,
        stock: newStock,
        status,
        lastUpdated: new Date().toISOString()
      };
      
      // In a real app, send to server
      if (this.socket && this._connectionStatus === 'connected') {
        this.socket.emit('updateStock', id, newStock);
      }
      
      return updatedProduct;
    });
    
    // Emit event
    this.emitEvent(ProductEvent.STOCK_UPDATED);
  }
  
  /**
   * Batch update stock for multiple products at once
   */
  batchUpdateStock(updates: Array<{ id: number; newStock: number }>): void {
    // Prepare batch updates for ListStateFlow
    const batchUpdates = updates.map(({ id, newStock }) => {
      // Determine status based on stock level
      let status: 'available' | 'low-stock' | 'out-of-stock';
      
      if (newStock <= 0) {
        status = 'out-of-stock';
      } else if (newStock < 10) {
        status = 'low-stock';
      } else {
        status = 'available';
      }
      
      return {
        id,
        update: (product: Product) => ({
          ...product,
          stock: newStock,
          status,
          lastUpdated: new Date().toISOString()
        })
      };
    });
    
    // Apply batch updates to ListStateFlow
    this.productsListFlow.batchUpdate(batchUpdates);
    
    // In a real app, send to server
    if (this.socket && this._connectionStatus === 'connected') {
      this.socket.emit('batchUpdateStock', updates);
    }
    
    // Emit event
    this.emitEvent(ProductEvent.BATCH_UPDATED);
  }

  /**
   * Remove a product
   */
  removeProduct(id: number): void {
    // Remove from ListStateFlow
    this.productsListFlow.removeItem(id);
    
    // In a real app, send to server
    if (this.socket && this._connectionStatus === 'connected') {
      this.socket.emit('removeProduct', id);
    }
    
    // Emit event
    this.emitEvent(ProductEvent.PRODUCT_REMOVED);
  }

  /**
   * Filter products by search term and category
   */
  filterProducts(searchTerm: string, category: string = 'all'): Product[] {
    const products = this.getData() || [];
    
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'all' || product.category === category;
      
      return matchesSearch && matchesCategory;
    });
  }

  /**
   * Get unique categories from products
   */
  getCategories(): string[] {
    const products = this.getData() || [];
    return ['all', ...new Set(products.map(p => p.category))];
  }

  /**
   * Get a single product by ID
   */
  getProduct(id: number): Product | undefined {
    return this.productsListFlow.getItem(id);
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketEvents(): void {
    if (!this.socket) return;
    
    // Product added event
    this.socket.on('productAdded', (newProduct: Product) => {
      console.log('New product received:', newProduct);
      this.productsListFlow.addItem(newProduct);
      this.emitEvent(ProductEvent.PRODUCT_ADDED);
    });
    
    // Product updated event
    this.socket.on('productUpdated', (updatedProduct: Product) => {
      console.log('Product update received:', updatedProduct);
      this.productsListFlow.updateItem(updatedProduct.id, () => updatedProduct);
      this.emitEvent(ProductEvent.PRODUCT_UPDATED);
    });
    
    // Stock updated event
    this.socket.on('stockUpdated', (productId: number, newStock: number) => {
      console.log(`Stock update for product ${productId}:`, newStock);
      
      this.productsListFlow.updateItem(productId, (product) => {
        // Determine status based on new stock level
        let status: 'available' | 'low-stock' | 'out-of-stock' = product.status;
        
        if (newStock <= 0) {
          status = 'out-of-stock';
        } else if (newStock < 10) {
          status = 'low-stock';
        } else {
          status = 'available';
        }
        
        return {
          ...product,
          stock: newStock,
          status,
          lastUpdated: new Date().toISOString()
        };
      });
      
      this.emitEvent(ProductEvent.STOCK_UPDATED);
    });
    
    // Product removed event
    this.socket.on('productRemoved', (productId: number) => {
      console.log(`Product removed ${productId}`);
      this.productsListFlow.removeItem(productId);
      this.emitEvent(ProductEvent.PRODUCT_REMOVED);
    });
    
    // Batch update event
    this.socket.on('batchUpdate', (updates: { id: number, stock: number }[]) => {
      console.log('Batch update received:', updates);
      
      // Process batch updates
      updates.forEach(({ id, stock }) => {
        this.productsListFlow.updateItem(id, (product) => {
          // Determine status based on new stock level
          let status: 'available' | 'low-stock' | 'out-of-stock' = product.status;
          
          if (stock <= 0) {
            status = 'out-of-stock';
          } else if (stock < 10) {
            status = 'low-stock';
          } else {
            status = 'available';
          }
          
          return {
            ...product,
            stock,
            status,
            lastUpdated: new Date().toISOString()
          };
        });
      });
      
      this.emitEvent(ProductEvent.BATCH_UPDATED);
    });
  }

  /**
   * Create a mock socket for the example
   */
  private createMockSocket(): any {
    const eventHandlers: Record<string, Function[]> = {};
    
    return {
      on: (event: string, callback: Function) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(callback);
        return this;
      },
      
      emit: (event: string, ...args: any[]) => {
        console.log(`Emitting ${event} with:`, args);
        // Simulate server response for demo purposes
        setTimeout(() => {
          if (event === 'addProduct' && args[0]) {
            const handlers = eventHandlers['productAdded'] || [];
            handlers.forEach(handler => handler(args[0]));
          }
          else if (event === 'updateProduct' && args[0]) {
            const handlers = eventHandlers['productUpdated'] || [];
            handlers.forEach(handler => handler(args[0]));
          }
          else if (event === 'updateStock' && args[0] && args[1] !== undefined) {
            const handlers = eventHandlers['stockUpdated'] || [];
            handlers.forEach(handler => handler(args[0], args[1]));
          }
          else if (event === 'removeProduct' && args[0]) {
            const handlers = eventHandlers['productRemoved'] || [];
            handlers.forEach(handler => handler(args[0]));
          }
        }, 300);
        
        return this;
      },
      
      disconnect: () => {
        console.log('Socket disconnected');
        return this;
      },
      
      connected: true
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Unsubscribe from ListStateFlow
    this._unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this._unsubscribeFunctions.clear();
    
    // Call parent dispose
    super.dispose();
  }
}

// Create a singleton instance
export const productViewModel = new ProductViewModel();
