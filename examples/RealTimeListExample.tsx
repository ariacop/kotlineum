import React, { useEffect, useState } from 'react';
import { useGlobalListStateFlow, useListItem } from '../src/useListStateFlow';
import { StorageType } from '../src/GlobalStateFlow';
import './RealTimeListExample.css';

// Note: In a real project, you need to install the socket.io-client package
// npm install socket.io-client

// Simulating Socket.io types for the example
interface Socket {
  on(event: string, callback: (...args: any[]) => void): Socket;
  emit(event: string, ...args: any[]): Socket;
  connect(): Socket;
  disconnect(): Socket;
  connected: boolean;
}

// Socket.io client simulation
class SocketIOClient {
  static io(url: string, options?: any): Socket {
    // Simulating Socket.io connection
    return {
      on: (event: string, callback: (...args: any[]) => void) => {
        // Simulation of event handling
        return this.io(url);
      },
      emit: (event: string, ...args: any[]) => {
        // Simulation of event emission
        return this.io(url);
      },
      connect: () => this.io(url),
      disconnect: () => this.io(url),
      connected: true
    };
  }
}

// Define data type for list items
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  lastUpdated: string;
  status: 'available' | 'low-stock' | 'out-of-stock';
}

// Product item component that only subscribes to changes for that specific product
const ProductItem: React.FC<{ 
  productId: number; 
  listFlow: any;
  onSelect: (id: number) => void;
}> = ({ productId, listFlow, onSelect }) => {
  // Use the useListItem hook to subscribe only to this specific product
  const [product, updateProduct] = useListItem(listFlow, productId);
  
  if (!product) return null;
  
  // Determine CSS class based on product status
  const statusClass = `status-${product.status}`;
  
  return (
    <div className={`product-item ${statusClass}`} onClick={() => onSelect(productId)}>
      <h3>{product.name}</h3>
      <div className="product-price">${product.price.toFixed(2)}</div>
      <div className="product-stock">
        <span className="label">Stock:</span>
        <span className="value">{product.stock}</span>
      </div>
      <div className="product-category">{product.category}</div>
      <div className="product-updated">
        Last updated: {new Date(product.lastUpdated).toLocaleTimeString()}
      </div>
      <div className={`product-status ${statusClass}`}>
        {product.status === 'available' && 'Available'}
        {product.status === 'low-stock' && 'Low Stock'}
        {product.status === 'out-of-stock' && 'Out of Stock'}
      </div>
    </div>
  );
};

// Main component
const RealTimeListExample: React.FC = () => {
  // Use GlobalListStateFlow to manage the products list
  const [products, listFlow] = useGlobalListStateFlow<Product>(
    'realTimeProducts',
    [], // Initial empty value - data will be fetched from API
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
  
  // Component states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Fetch initial data from API
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Assume this is your API endpoint
        const response = await fetch('https://api.example.com/products');
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const data: Product[] = await response.json();
        
        // Update list with data received from API
        listFlow.updateItems(data);
        
        setLoading(false);
      } catch (err) {
        setError(`Error fetching data: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [listFlow]);
  
  // Connect to Socket.io
  useEffect(() => {
    const connectToSocketIO = () => {
      try {
        // Create Socket.io connection
        const socketInstance = SocketIOClient.io('https://api.example.com');
        
        // Setup Socket.io events
        
        // Product added event
        socketInstance.on('productAdded', (newProduct: Product) => {
          console.log('New product received:', newProduct);
          listFlow.addItem(newProduct);
        });
        
        // Product updated event
        socketInstance.on('productUpdated', (updatedProduct: Product) => {
          console.log('Product update received:', updatedProduct);
          listFlow.updateItem(updatedProduct.id, () => updatedProduct);
        });
        
        // Stock updated event
        socketInstance.on('stockUpdated', (productId: number, newStock: number) => {
          console.log(`Stock update for product ${productId}:`, newStock);
          
          listFlow.updateItem(productId, (product) => {
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
        });
        
        // Product removed event
        socketInstance.on('productRemoved', (productId: number) => {
          console.log(`Product removed ${productId}`);
          listFlow.removeItem(productId);
          
          // If the selected product was removed, clear the selection
          if (selectedProduct?.id === productId) {
            setSelectedProduct(null);
          }
        });
        
        // Batch update event
        socketInstance.on('batchUpdate', (updates: { id: number, stock: number }[]) => {
          console.log('Batch update received:', updates);
          
          // Process batch updates
          updates.forEach(({ id, stock }) => {
            listFlow.updateItem(id, (product) => {
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
        });
        
        // Connect to socket
        socketInstance.connect();
        console.log('Connected to Socket.io');
        setConnectionStatus('Connected');
        setSocket(socketInstance);
      } catch (err) {
        console.error('Error connecting to Socket.io:', err);
        setConnectionStatus('Connection Error');
      }
    };
    
    connectToSocketIO();
  }, [listFlow, selectedProduct, socket]);
  

  
  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  // Extract unique categories for filtering
  const categories = ['all', ...new Set(products.map(p => p.category))];
  
  // Simulate stock update from user
  const simulateStockUpdate = (productId: number, newStock: number) => {
    // In a real application, this would be an API request
    // But for this example, we directly emit to the socket
    if (socket && socket.connected) {
      socket.emit('updateStock', productId, newStock);
    } else {
      // Local update if connection is not established
      listFlow.updateItem(productId, (product) => {
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
    }
  };
  
  if (loading) {
    return <div className="loading">Loading products...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="real-time-list-example">
      <h2>Real-time list example with GlobalListStateFlow and Socket.io</h2>
      
      <div className="connection-status">
        Socket.io connection status: <span className={`status-${connectionStatus === 'Connected' ? 'connected' : 'disconnected'}`}>{connectionStatus}</span>
      </div>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="category-filter"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All categories' : category}
            </option>
          ))}
        </select>
      </div>
      
      <div className="main-content">
        <div className="products-list">
          <h3>Products ({filteredProducts.length})</h3>
          
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductItem
                key={product.id}
                productId={product.id}
                listFlow={listFlow}
                onSelect={(id) => {
                  const product = listFlow.getItem(id);
                  if (product) setSelectedProduct(product);
                }}
              />
            ))}
          </div>
        </div>
        
        {selectedProduct && (
          <div className="product-detail">
            <h3>Product details</h3>
            <button className="close-button" onClick={() => setSelectedProduct(null)}>×</button>
            
            <div className="detail-content">
              <div className="detail-field">
                <label>ID:</label>
                <span>{selectedProduct.id}</span>
              </div>
              
              <div className="detail-field">
                <label>Name:</label>
                <input
                  type="text"
                  value={selectedProduct.name}
                  onChange={(e) => {
                    const updatedProduct = {
                      ...selectedProduct,
                      name: e.target.value,
                      lastUpdated: new Date().toISOString()
                    };
                    
                    // Local update
                    listFlow.updateItem(selectedProduct.id, () => updatedProduct);
                    setSelectedProduct(updatedProduct);
                    
                    // In a real application, this would be an API request
                    if (socket && socket.connected) {
                      socket.emit('updateProduct', updatedProduct);
                    }
                  }}
                />
              </div>
              
              <div className="detail-field">
                <label>Price:</label>
                <input
                  type="number"
                  value={selectedProduct.price}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value) || 0;
                    const updatedProduct = {
                      ...selectedProduct,
                      price,
                      lastUpdated: new Date().toISOString()
                    } as Product;
                    
                    // Local update
                    listFlow.updateItem(selectedProduct.id, () => updatedProduct);
                    setSelectedProduct(updatedProduct);
                    
                    // In a real application, this would be an API request
                    if (socket && socket.connected) {
                      socket.emit('updateProduct', updatedProduct);
                    }
                  }}
                />
              </div>
              
              <div className="detail-field">
                <label>Stock:</label>
                <div className="stock-control">
                  <button
                    onClick={() => {
                      const newStock = Math.max(0, selectedProduct.stock - 1);
                      simulateStockUpdate(selectedProduct.id, newStock);
                      
                      // Local update for UI
                      const updatedProduct = {
                        ...selectedProduct,
                        stock: newStock,
                        status: newStock === 0 ? 'out-of-stock' as const : newStock < 10 ? 'low-stock' as const : 'available' as const,
                        lastUpdated: new Date().toISOString()
                      };
                      setSelectedProduct(updatedProduct);
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={selectedProduct.stock}
                    onChange={(e) => {
                      const newStock = parseInt(e.target.value) || 0;
                      simulateStockUpdate(selectedProduct.id, newStock);
                      
                      // Local update for UI
                      const updatedProduct = {
                        ...selectedProduct,
                        stock: newStock,
                        status: newStock === 0 ? 'out-of-stock' as const : newStock < 10 ? 'low-stock' as const : 'available' as const,
                        lastUpdated: new Date().toISOString()
                      };
                      setSelectedProduct(updatedProduct);
                    }}
                  />
                  <button
                    onClick={() => {
                      const newStock = selectedProduct.stock + 1;
                      simulateStockUpdate(selectedProduct.id, newStock);
                      
                      // Local update for UI
                      const updatedProduct = {
                        ...selectedProduct,
                        stock: newStock,
                        status: newStock === 0 ? 'out-of-stock' as const : newStock < 10 ? 'low-stock' as const : 'available' as const,
                        lastUpdated: new Date().toISOString()
                      };
                      setSelectedProduct(updatedProduct);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="detail-field">
                <label>Category:</label>
                <select
                  value={selectedProduct.category}
                  onChange={(e) => {
                    const updatedProduct = {
                      ...selectedProduct,
                      category: e.target.value,
                      lastUpdated: new Date().toISOString()
                    };
                    
                    // Local update
                    listFlow.updateItem(selectedProduct.id, () => updatedProduct);
                    setSelectedProduct(updatedProduct);
                    
                    // In a real application, this would be an API request
                    if (socket && socket.connected) {
                      socket.emit('updateProduct', updatedProduct);
                    }
                  }}
                >
                  {categories.filter(c => c !== 'all').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="detail-field">
                <label>Status:</label>
                <span className={`status-badge ${selectedProduct.status}`}>
                  {selectedProduct.status === 'available' && 'Available'}
                  {selectedProduct.status === 'low-stock' && 'Low stock'}
                  {selectedProduct.status === 'out-of-stock' && 'Out of stock'}
                </span>
              </div>
              
              <div className="detail-field">
                <label>Last updated:</label>
                <span>{new Date(selectedProduct.lastUpdated).toLocaleString()}</span>
              </div>
              
              <div className="detail-actions">
                <button
                  className="delete-button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete product "${selectedProduct.name}"?`)) {
                      // In a real application, this would be an API request
                      if (socket && socket.connected) {
                        socket.emit('deleteProduct', selectedProduct.id);
                      } else {
                        // Local delete if connection is not established
                        listFlow.removeItem(selectedProduct.id);
                      }
                      
                      setSelectedProduct(null);
                    }
                  }}
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="explanation">
        <h3>How It Works</h3>
        <ol>
          <li>Initial data is fetched from the API and stored in GlobalListStateFlow</li>
          <li>Socket.io connection is established to receive real-time updates</li>
          <li>Each product has its own StateFlow that enables individual updates</li>
          <li>Local changes are sent to the server and server changes are broadcast to all clients</li>
          <li>Only components related to changed products are re-rendered, not the entire list</li>
          <li>Data is stored in IndexedDB so it's available even when offline</li>
          <li>Batch updates are performed in a single operation for better performance</li>
        </ol>
      </div>
    </div>
  );
};

export default RealTimeListExample;
