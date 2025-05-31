import React, { useEffect, useState } from 'react';
import { productViewModel, Product, ProductIntent } from './ProductViewModel';
import './ViewModelListExample.css';

/**
 * Example component demonstrating the MVI pattern with the ProductViewModel
 */
const MVIExample: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  
  // Subscribe to ViewModel state and events
  useEffect(() => {
    // Subscribe to state changes
    const unsubscribeState = productViewModel.subscribeToState('mvi-example', (state) => {
      setProducts(state.data || []);
      setLoading(state.loading);
      setError(state.error);
    });
    
    // Fetch initial data using the MVI pattern (dispatch an intent)
    productViewModel.dispatch({ type: 'FETCH_PRODUCTS' });
    
    // Connect to real-time updates using the MVI pattern
    productViewModel.dispatch({ type: 'CONNECT_REALTIME' });
    
    // Cleanup subscriptions
    return () => {
      unsubscribeState();
      // Disconnect from real-time updates
      productViewModel.dispatch({ type: 'DISCONNECT_REALTIME' });
    };
  }, []);
  
  // Handle adding a new product
  const handleAddProduct = () => {
    if (!newProductName || !newProductPrice || !newProductStock || !newProductCategory) {
      alert('Please fill in all fields');
      return;
    }
    
    const newProduct: Product = {
      id: Date.now(), // Use timestamp as temporary ID
      name: newProductName,
      price: parseFloat(newProductPrice),
      stock: parseInt(newProductStock),
      category: newProductCategory,
      lastUpdated: new Date().toISOString(),
      status: parseInt(newProductStock) > 10 ? 'available' : parseInt(newProductStock) > 0 ? 'low-stock' : 'out-of-stock'
    };
    
    // Dispatch ADD_PRODUCT intent
    productViewModel.dispatch({
      type: 'ADD_PRODUCT',
      product: newProduct
    });
    
    // Clear form
    setNewProductName('');
    setNewProductPrice('');
    setNewProductStock('');
    setNewProductCategory('');
  };
  
  // Handle updating stock
  const handleUpdateStock = (id: number, currentStock: number) => {
    const newStock = prompt('Enter new stock level:', currentStock.toString());
    
    if (newStock !== null) {
      const stockValue = parseInt(newStock);
      
      if (!isNaN(stockValue)) {
        // Dispatch UPDATE_STOCK intent
        productViewModel.dispatch({
          type: 'UPDATE_STOCK',
          id,
          newStock: stockValue
        });
      }
    }
  };
  
  // Handle removing a product
  const handleRemoveProduct = (id: number) => {
    if (confirm('Are you sure you want to remove this product?')) {
      // Dispatch REMOVE_PRODUCT intent
      productViewModel.dispatch({
        type: 'REMOVE_PRODUCT',
        id
      });
    }
  };
  
  // Handle batch updating stock for all products
  const handleBatchUpdateStock = () => {
    const percentage = prompt('Enter percentage to adjust stock (e.g. -10 for 10% decrease, 20 for 20% increase):');
    
    if (percentage !== null) {
      const percentValue = parseInt(percentage);
      
      if (!isNaN(percentValue)) {
        const updates = products.map(product => {
          const newStock = Math.max(0, Math.round(product.stock * (1 + percentValue / 100)));
          return { id: product.id, newStock };
        });
        
        // Dispatch BATCH_UPDATE_STOCK intent
        productViewModel.dispatch({
          type: 'BATCH_UPDATE_STOCK',
          updates
        });
      }
    }
  };
  
  // Get status class for styling
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'available': return 'status-available';
      case 'low-stock': return 'status-low';
      case 'out-of-stock': return 'status-out';
      default: return '';
    }
  };
  
  return (
    <div className="product-list-container">
      <h1>Product Management (MVI Pattern Example)</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="add-product-form">
        <h2>Add New Product</h2>
        <div className="form-row">
          <input
            type="text"
            placeholder="Product Name"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Price"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder="Stock"
            value={newProductStock}
            onChange={(e) => setNewProductStock(e.target.value)}
          />
          <input
            type="text"
            placeholder="Category"
            value={newProductCategory}
            onChange={(e) => setNewProductCategory(e.target.value)}
          />
          <button onClick={handleAddProduct}>Add Product</button>
        </div>
      </div>
      
      <div className="product-controls">
        <button onClick={handleBatchUpdateStock}>Batch Update Stock</button>
      </div>
      
      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>{product.stock}</td>
                <td>{product.category}</td>
                <td className={getStatusClass(product.status)}>{product.status}</td>
                <td>{new Date(product.lastUpdated).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleUpdateStock(product.id, product.stock)}>
                    Update Stock
                  </button>
                  <button onClick={() => handleRemoveProduct(product.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div className="connection-status">
        Connection Status: {productViewModel.connectionStatus}
      </div>
    </div>
  );
};

export default MVIExample;
