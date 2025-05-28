import React, { useEffect, useState } from 'react';
import { productViewModel, Product, ProductEvent } from './viewmodel/ProductViewModel';
import './ViewModelListExample.css';

// Product item component that only subscribes to changes for that specific product
const ProductItem: React.FC<{ 
  productId: number; 
  onSelect: (id: number) => void;
}> = ({ productId, onSelect }) => {
  // Get the ListStateFlow instance for direct item subscription
  const listFlow = productViewModel.getListStateFlow();
  
  // Use the useListItem hook to subscribe only to this specific product
  const [product, setProduct] = useState<Product | null>(null);
  
  useEffect(() => {
    // Get initial product data
    const initialProduct = listFlow.getItem(productId);
    if (initialProduct) {
      setProduct(initialProduct);
    }
    
    // Since ListStateFlow doesn't have a direct subscribeToItem method,
    // we'll manually check for updates to this specific product
    const checkInterval = setInterval(() => {
      const currentProduct = listFlow.getItem(productId);
      if (currentProduct && 
          JSON.stringify(currentProduct) !== JSON.stringify(product)) {
        setProduct(currentProduct);
      }
    }, 100);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [productId, listFlow, product]);
  
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
const ViewModelListExample: React.FC = () => {
  // Component states
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>(['all']);
  
  // Setup ViewModel subscriptions
  useEffect(() => {
    // Subscribe to state changes (data, loading, error)
    const unsubscribeState = productViewModel.subscribeToState(
      'product-list-state',
      (state) => {
        setLoading(state.loading);
        if (state.error) {
          setError(state.error);
        }
        if (state.data) {
          setProducts(state.data);
          // Update categories when products change
          setCategories(['all', ...new Set(state.data.map(p => p.category))]);
        }
      }
    );
    
    // Subscribe to events
    const unsubscribeEvents = productViewModel.subscribeToEvents(
      'product-list-events',
      (event) => {
        console.log('Event received:', event);
        // You can handle specific events here if needed
      }
    );
    
    // Connect to real-time updates
    productViewModel.connectToRealTimeUpdates();
    setConnectionStatus(productViewModel.connectionStatus);
    
    // Fetch initial data
    productViewModel.fetchProducts();
    
    // Cleanup on unmount
    return () => {
      unsubscribeState();
      unsubscribeEvents();
      productViewModel.disconnect();
    };
  }, []);
  
  // Filter products based on search and category
  const filteredProducts = productViewModel.filterProducts(filter, categoryFilter);
  
  // Simulate stock update from user
  const simulateStockUpdate = (productId: number, newStock: number) => {
    productViewModel.updateStock(productId, newStock);
  };
  
  if (loading && products.length === 0) {
    return <div className="loading">Loading products...</div>;
  }
  
  if (error && products.length === 0) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="viewmodel-list-example">
      <h2>Real-time list example with ViewModel and ListStateFlow</h2>
      
      <div className="connection-status">
        Socket.io connection status: <span className={`status-${connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}>{connectionStatus}</span>
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
                onSelect={(id) => {
                  const product = productViewModel.getProduct(id);
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
                    const name = e.target.value;
                    
                    // Update through ViewModel
                    productViewModel.updateProduct(selectedProduct.id, { name });
                    
                    // Update local state for UI
                    setSelectedProduct({
                      ...selectedProduct,
                      name,
                      lastUpdated: new Date().toISOString()
                    });
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
                    
                    // Update through ViewModel
                    productViewModel.updateProduct(selectedProduct.id, { price });
                    
                    // Update local state for UI
                    setSelectedProduct({
                      ...selectedProduct,
                      price,
                      lastUpdated: new Date().toISOString()
                    });
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
                      const status = newStock === 0 ? 'out-of-stock' as const : 
                                    newStock < 10 ? 'low-stock' as const : 
                                    'available' as const;
                      
                      setSelectedProduct({
                        ...selectedProduct,
                        stock: newStock,
                        status,
                        lastUpdated: new Date().toISOString()
                      });
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
                      const status = newStock === 0 ? 'out-of-stock' as const : 
                                    newStock < 10 ? 'low-stock' as const : 
                                    'available' as const;
                      
                      setSelectedProduct({
                        ...selectedProduct,
                        stock: newStock,
                        status,
                        lastUpdated: new Date().toISOString()
                      });
                    }}
                  />
                  <button
                    onClick={() => {
                      const newStock = selectedProduct.stock + 1;
                      simulateStockUpdate(selectedProduct.id, newStock);
                      
                      // Local update for UI
                      const status = newStock === 0 ? 'out-of-stock' as const : 
                                    newStock < 10 ? 'low-stock' as const : 
                                    'available' as const;
                      
                      setSelectedProduct({
                        ...selectedProduct,
                        stock: newStock,
                        status,
                        lastUpdated: new Date().toISOString()
                      });
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
                    const category = e.target.value;
                    
                    // Update through ViewModel
                    productViewModel.updateProduct(selectedProduct.id, { category });
                    
                    // Update local state for UI
                    setSelectedProduct({
                      ...selectedProduct,
                      category,
                      lastUpdated: new Date().toISOString()
                    });
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
                  {selectedProduct.status === 'low-stock' && 'Low Stock'}
                  {selectedProduct.status === 'out-of-stock' && 'Out of Stock'}
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
                      // Delete through ViewModel
                      productViewModel.removeProduct(selectedProduct.id);
                      
                      // Clear selection
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
          <li>ViewModel manages business logic and API interactions</li>
          <li>ListStateFlow handles efficient list state management</li>
          <li>Initial data is fetched from the API and stored in ListStateFlow</li>
          <li>Socket.io connection is established to receive real-time updates</li>
          <li>Each product has its own subscription that enables individual updates</li>
          <li>Local changes are sent to the server and server changes are broadcast to all clients</li>
          <li>Only components related to changed products are re-rendered, not the entire list</li>
          <li>Data is stored in IndexedDB so it's available even when offline</li>
          <li>The ViewModel pattern separates business logic from UI concerns</li>
        </ol>
      </div>
    </div>
  );
};

export default ViewModelListExample;
