import React, { useEffect, useState } from 'react';
import { ProductListFlow } from './ListFlowExample';
import { delay } from '../../src/Coroutines';

// Define Product type
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

const ListFlowExampleComponent: React.FC = () => {
  // Create an instance of ProductListFlow
  const [productListFlow] = useState<ProductListFlow<Product>>(() => {
    // Initial data
    const initialProducts: Product[] = [
      { id: 1, name: 'Laptop', price: 25000000, category: 'Electronics', stock: 10 },
      { id: 2, name: 'Smartphone', price: 12000000, category: 'Electronics', stock: 15 },
      { id: 3, name: 'Wireless Headphones', price: 2500000, category: 'Accessories', stock: 20 },
      { id: 4, name: 'Gaming Mouse', price: 1800000, category: 'Accessories', stock: 8 },
      { id: 5, name: 'Mechanical Keyboard', price: 3500000, category: 'Accessories', stock: 5 }
    ];
    
    return new ProductListFlow<Product>(initialProducts);
  });
  
  // Component states
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(30000000);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const [totalValue, setTotalValue] = useState<number>(0);
  
  // New product form
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductCategory, setNewProductCategory] = useState<string>('');
  const [newProductStock, setNewProductStock] = useState<number>(0);
  
  // Get list of categories
  const categories = ['All', ...new Set(products.map(p => p.category))];

  // Subscribe to list changes
  useEffect(() => {
    const unsubscribe = productListFlow.subscribe('list-flow-example', (items) => {
      setProducts(items);
    });
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
      productListFlow.dispose();
    };
  }, [productListFlow]);

  // Apply filter and sorting using Flow
  useEffect(() => {
    const applyFiltersAndSort = async () => {
      setLoading(true);
      
      try {
        // Create filtered Flow
        const filteredFlow = productListFlow.filteredFlow(product => {
          // Filter by price
          const priceInRange = product.price >= minPrice && product.price <= maxPrice;
          
          // Filter by category
          const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
          
          return priceInRange && categoryMatch;
        });
        
        // Get filtered products
        const filtered = await filteredFlow.first() || [];
        
        // Sort products
        let sorted = [...filtered];
        
        switch (sortBy) {
          case 'name':
            sorted.sort((a, b) => sortOrder === 'asc' ? 
              a.name.localeCompare(b.name) : 
              b.name.localeCompare(a.name));
            break;
          case 'price':
            sorted.sort((a, b) => sortOrder === 'asc' ? 
              a.price - b.price : 
              b.price - a.price);
            break;
          case 'stock':
            sorted.sort((a, b) => sortOrder === 'asc' ? 
              a.stock - b.stock : 
              b.stock - a.stock);
            break;
        }
        
        // Update state
        setFilteredProducts(sorted);
        
        // Calculate total value using Flow
        const totalValueFlow = filteredFlow.map(items => 
          items.reduce((sum, item) => sum + (item.price * item.stock), 0)
        );
        
        const total = await totalValueFlow.first() || 0;
        setTotalValue(total);
      } catch (error) {
        console.error('Error applying filters:', error);
      } finally {
        setLoading(false);
      }
    };
    
    applyFiltersAndSort();
  }, [productListFlow, minPrice, maxPrice, selectedCategory, sortBy, sortOrder, products]);

  // Add new product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProductName.trim() || newProductPrice <= 0 || !newProductCategory.trim() || newProductStock < 0) {
      return;
    }
    
    const newId = Math.max(0, ...products.map(p => p.id)) + 1;
    
    const newProduct: Product = {
      id: newId,
      name: newProductName,
      price: newProductPrice,
      category: newProductCategory,
      stock: newProductStock
    };
    
    productListFlow.add(newProduct);
    
    // Clear form
    setNewProductName('');
    setNewProductPrice(0);
    setNewProductCategory('');
    setNewProductStock(0);
  };

  // Batch update product stock
  const handleBatchUpdateStock = async () => {
    setLoading(true);
    
    try {
      // Use batchUpdate to update all products in a single operation
      await productListFlow.batchUpdate(product => ({
        ...product,
        // Increase stock randomly between 1 and 5
        stock: product.stock + Math.floor(Math.random() * 5) + 1
      }));
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add products gradually
  const handleAddProductsWithDelay = async () => {
    setLoading(true);
    
    try {
      const newProducts: Product[] = [
        { id: 100, name: 'Tablet', price: 8500000, category: 'Electronics', stock: 7 },
        { id: 101, name: 'Bluetooth Speaker', price: 1200000, category: 'Accessories', stock: 12 },
        { id: 102, name: 'Power Bank', price: 950000, category: 'Accessories', stock: 18 }
      ];
      
      // Add products with a 800ms delay between each addition
      await productListFlow.addItemsWithDelay(newProducts, 800);
    } catch (error) {
      console.error('Error adding products with delay:', error);
    } finally {
      setLoading(false);
    }
  };

  // Asynchronous processing of products
  const handleProcessItems = async () => {
    setLoading(true);
    
    try {
      await productListFlow.processItems(async (product) => {
        console.log(`Processing product: ${product.name}`);
        // Simulate a time-consuming operation
        await delay(300);
      });
      
      alert('Products processed successfully');
    } catch (error) {
      console.error('Error processing items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format price in Rials
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US').format(price) + ' Rials';
  };

  return (
    <div style={{ fontFamily: 'Tahoma, Arial, sans-serif', maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ borderBottom: '2px solid #3f51b5', paddingBottom: '10px', color: '#3f51b5' }}>
        ListFlow Example with Coroutines and Flow
      </h1>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Filters and Sorting */}
        <div style={{ flex: 1, backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
          <h2 style={{ color: '#3f51b5', marginTop: 0 }}>Filters and Sorting</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price Range:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
                min="0"
              />
              <span style={{ alignSelf: 'center' }}>to</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
                min="0"
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Sort by:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  flex: 2,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              >
                <option value="name">Product Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              backgroundColor: '#e8eaf6', 
              padding: '10px', 
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              Total Inventory Value: {formatPrice(totalValue)}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleBatchUpdateStock}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Batch Update Stock
            </button>
            
            <button
              onClick={handleAddProductsWithDelay}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Products with Delay
            </button>
            
            <button
              onClick={handleProcessItems}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#9c27b0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Process Products Asynchronously
            </button>
          </div>
        </div>
        
        {/* Add Product Form */}
        <div style={{ flex: 1, backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
          <h2 style={{ color: '#3f51b5', marginTop: 0 }}>Add New Product</h2>
          
          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Product Name:</label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Price (Rials):</label>
              <input
                type="number"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
                min="0"
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Category:</label>
              <input
                type="text"
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Stock:</label>
              <input
                type="number"
                value={newProductStock}
                onChange={(e) => setNewProductStock(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
                min="0"
                required
              />
            </div>
            
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#3f51b5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Add Product
            </button>
          </form>
        </div>
      </div>
      
      {/* Display loading state */}
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '10px',
          backgroundColor: '#e8eaf6',
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#3f51b5'
        }}>
          Processing...
        </div>
      )}
      
      {/* Product list */}
      <div>
        <h2 style={{ color: '#3f51b5' }}>Product List ({filteredProducts.length})</h2>
        
        {filteredProducts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No products found with the selected filters.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#3f51b5', color: 'white' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Product Name</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Price</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Stock</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id}
                    style={{ 
                      borderBottom: '1px solid #e0e0e0',
                      backgroundColor: product.stock < 5 ? '#ffebee' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '10px' }}>{product.id}</td>
                    <td style={{ padding: '10px' }}>{product.name}</td>
                    <td style={{ padding: '10px' }}>{product.category}</td>
                    <td style={{ padding: '10px' }}>{formatPrice(product.price)}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        color: product.stock < 5 ? '#f44336' : 'inherit',
                        fontWeight: product.stock < 5 ? 'bold' : 'normal'
                      }}>
                        {product.stock}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>{formatPrice(product.price * product.stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListFlowExampleComponent;
