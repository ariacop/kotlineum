// AdvancedListStateFlowExample.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { GlobalListStateFlow } from '../src/GlobalListStateFlow';
import './AdvancedListStateFlowExample.css';

// Define the product type
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

// Create a global list state flow for products
const productsFlow = GlobalListStateFlow<Product>(
  'advanced-products',
  [
    { id: 1, name: 'Laptop', price: 1200, stock: 10 },
    { id: 2, name: 'Smartphone', price: 800, stock: 15 },
  ],
  { idField: 'id' }
);

const AdvancedListStateFlowExample: React.FC = () => {
  // State for all products
  const [products, setProducts] = useState<Product[]>([]);
  
  // State for a specific product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // State for new product form
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    stock: 0,
  });
  
  // State for pre-subscription ID
  const [preSubscribeId, setPreSubscribeId] = useState<number>(0);
  
  // State for pre-subscription status
  const [preSubscriptionActive, setPreSubscriptionActive] = useState<boolean>(false);
  
  // State for subscription log
  const [subscriptionLog, setSubscriptionLog] = useState<string[]>([]);
  
  // Add log entry
  const addLogEntry = useCallback((entry: string) => {
    setSubscriptionLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${entry}`]);
  }, []);
  
  // Subscribe to the entire list
  useEffect(() => {
    const unsubscribe = productsFlow.subscribeToList('example-component', (updatedProducts) => {
      setProducts(updatedProducts);
      addLogEntry(`List updated, total items: ${updatedProducts.length}`);
    });
    
    // Register a callback for when any item is added
    const unregisterCallback = productsFlow.onItemAdded('global-callback', {
      onItemAdded: (item) => {
        addLogEntry(`Item added globally: ${item.name} (ID: ${item.id})`);
      }
    });
    
    return () => {
      unsubscribe();
      unregisterCallback();
    };
  }, [addLogEntry]);
  
  // Handle product selection
  const handleSelectProduct = (id: number) => {
    const product = productsFlow.getItem(id);
    if (product) {
      setSelectedProduct(product);
      
      // Subscribe to this specific product
      const unsubscribe = productsFlow.subscribeToItem(id, `product-${id}`, (updatedProduct) => {
        setSelectedProduct(updatedProduct);
        addLogEntry(`Product ${updatedProduct.id} updated: ${JSON.stringify(updatedProduct)}`);
      });
      
      // Unsubscribe when component unmounts or when selection changes
      return unsubscribe;
    }
  };
  
  // Handle pre-subscription
  const handlePreSubscribe = () => {
    if (preSubscribeId <= 0) {
      alert('Please enter a valid product ID');
      return;
    }
    
    // Check if product already exists
    const existingProduct = productsFlow.getItem(preSubscribeId);
    if (existingProduct) {
      addLogEntry(`Product with ID ${preSubscribeId} already exists, subscribing normally`);
      handleSelectProduct(preSubscribeId);
      return;
    }
    
    // Subscribe to a product that doesn't exist yet (pre-subscription)
    const unsubscribe = productsFlow.subscribeToItem(
      preSubscribeId,
      `pre-subscribe-${preSubscribeId}`,
      (product) => {
        addLogEntry(`Pre-subscribed product ${preSubscribeId} updated: ${JSON.stringify(product)}`);
        setSelectedProduct(product);
      }
    );
    
    setPreSubscriptionActive(true);
    addLogEntry(`Pre-subscribed to product with ID: ${preSubscribeId}`);
    
    // Return unsubscribe function
    return () => {
      unsubscribe();
      setPreSubscriptionActive(false);
    };
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: name === 'name' ? value : Number(value),
    }));
  };
  
  // Handle form submission to add a new product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a random ID or use the pre-subscription ID if active
    const id = preSubscriptionActive ? preSubscribeId : Math.floor(Math.random() * 1000) + 10;
    
    const product: Product = {
      id,
      ...newProduct,
    };
    
    // Add the product with a specific callback for this addition
    productsFlow.addItemWithCallback(
      product,
      `add-callback-${id}`,
      {
        onItemAdded: (item) => {
          addLogEntry(`Item added with specific callback: ${item.name} (ID: ${item.id})`);
        }
      }
    );
    
    // Reset the form
    setNewProduct({
      name: '',
      price: 0,
      stock: 0,
    });
    
    // If we were using a pre-subscription ID, reset it
    if (preSubscriptionActive) {
      setPreSubscriptionActive(false);
      setPreSubscribeId(0);
    }
  };
  
  // Handle updating a product's stock
  const handleUpdateStock = (id: number, change: number) => {
    productsFlow.updateItem(id, (product) => ({
      ...product,
      stock: Math.max(0, product.stock + change),
    }));
  };
  
  return (
    <div className="advanced-list-example">
      <h2>Advanced ListStateFlow Example</h2>
      <p className="description">
        This example demonstrates the enhanced ListStateFlow with callbacks for item additions 
        and pre-subscriptions to items by ID.
      </p>
      
      <div className="example-container">
        <div className="products-list">
          <h3>Products List</h3>
          <ul>
            {products.map(product => (
              <li key={product.id} onClick={() => handleSelectProduct(product.id)}>
                <strong>{product.name}</strong> - ${product.price} 
                <span className={product.stock < 5 ? 'low-stock' : ''}>
                  (Stock: {product.stock})
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="product-detail">
          <h3>Selected Product</h3>
          {selectedProduct ? (
            <div>
              <h4>{selectedProduct.name}</h4>
              <p>ID: {selectedProduct.id}</p>
              <p>Price: ${selectedProduct.price}</p>
              <p>Stock: {selectedProduct.stock}</p>
              <div className="stock-controls">
                <button onClick={() => handleUpdateStock(selectedProduct.id, -1)}>-</button>
                <button onClick={() => handleUpdateStock(selectedProduct.id, 1)}>+</button>
              </div>
            </div>
          ) : (
            <p>No product selected</p>
          )}
        </div>
        
        <div className="add-product">
          <h3>Add New Product</h3>
          <form onSubmit={handleAddProduct}>
            <div>
              <label>Name:</label>
              <input 
                type="text" 
                name="name" 
                value={newProduct.name} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div>
              <label>Price:</label>
              <input 
                type="number" 
                name="price" 
                value={newProduct.price} 
                onChange={handleInputChange} 
                min="0" 
                required 
              />
            </div>
            <div>
              <label>Stock:</label>
              <input 
                type="number" 
                name="stock" 
                value={newProduct.stock} 
                onChange={handleInputChange} 
                min="0" 
                required 
              />
            </div>
            <button type="submit">Add Product</button>
          </form>
        </div>
        
        <div className="pre-subscribe">
          <h3>Pre-subscribe to Product</h3>
          <div>
            <label>Product ID:</label>
            <input 
              type="number" 
              value={preSubscribeId} 
              onChange={(e) => setPreSubscribeId(Number(e.target.value))} 
              min="1" 
            />
            <button 
              onClick={handlePreSubscribe}
              disabled={preSubscriptionActive}
            >
              {preSubscriptionActive ? 'Pre-subscribed' : 'Pre-subscribe'}
            </button>
          </div>
          {preSubscriptionActive && (
            <p className="subscription-active">
              Pre-subscription active for Product ID: {preSubscribeId}
            </p>
          )}
        </div>
        
        <div className="subscription-log">
          <h3>Subscription Log</h3>
          <div className="log-entries">
            {subscriptionLog.map((entry, index) => (
              <div key={index} className="log-entry">{entry}</div>
            ))}
          </div>
          <button onClick={() => setSubscriptionLog([])}>Clear Log</button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedListStateFlowExample;
