import React, { useEffect, useState } from 'react';
import { ListStateFlow } from '../../src/ListStateFlow';

// Define a product type for our example
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

const ListFlowExample: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [listFlow, setListFlow] = useState<ListStateFlow<Product> | null>(null);

  // Initialize ListStateFlow with sample data
  useEffect(() => {
    const initialProducts: Product[] = [
      { id: 1, name: 'Laptop', price: 1200, category: 'Electronics', inStock: true },
      { id: 2, name: 'Smartphone', price: 800, category: 'Electronics', inStock: true },
      { id: 3, name: 'Headphones', price: 150, category: 'Electronics', inStock: false },
      { id: 4, name: 'Coffee Maker', price: 90, category: 'Kitchen', inStock: true },
      { id: 5, name: 'Blender', price: 70, category: 'Kitchen', inStock: true },
      { id: 6, name: 'Desk', price: 250, category: 'Furniture', inStock: true },
      { id: 7, name: 'Chair', price: 120, category: 'Furniture', inStock: false },
      { id: 8, name: 'Bookshelf', price: 180, category: 'Furniture', inStock: true },
    ];

    // Create a new ListStateFlow instance
    const productListFlow = new ListStateFlow<Product>('products', initialProducts, { idField: 'id' });
    setListFlow(productListFlow);
    setProducts(initialProducts);

    // Subscribe to changes in the list
    const unsubscribe = productListFlow.collectFlow('list-flow-example', (items) => {
      setProducts(items);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Apply filters and calculate total when dependencies change
  useEffect(() => {
    if (listFlow) {
      // Example of using the new stream operations
      
      // Filter products by price and category
      const filtered = listFlow.filter(product => 
        product.price >= minPrice && 
        (categoryFilter === '' || product.category === categoryFilter)
      );
      setFilteredProducts(filtered);
      
      // Calculate total value of all products using reduce
      const total = listFlow.reduce((sum, product) => sum + product.price, 0);
      setTotalValue(total);
      
      // Example of async collect (just for demonstration)
      listFlow.collect(async (items) => {
        console.log('Collected items:', items);
        // You could do async processing here
      });
    }
  }, [listFlow, minPrice, categoryFilter]);

  // Add a new product
  const handleAddProduct = () => {
    if (listFlow) {
      const newProduct: Product = {
        id: Date.now(),
        name: `New Product ${Math.floor(Math.random() * 100)}`,
        price: Math.floor(Math.random() * 500) + 50,
        category: ['Electronics', 'Kitchen', 'Furniture'][Math.floor(Math.random() * 3)],
        inStock: Math.random() > 0.3,
      };
      
      listFlow.addItem(newProduct);
    }
  };

  // Update a product price
  const handleUpdatePrice = (id: number) => {
    if (listFlow) {
      const newPrice = Math.floor(Math.random() * 1000) + 50;
      listFlow.updateItem(id, (product) => ({
        ...product,
        price: newPrice
      }));
    }
  };

  // Remove a product
  const handleRemoveProduct = (id: number) => {
    if (listFlow) {
      listFlow.removeItem(id);
    }
  };

  // Example of using the sort operation
  const handleSortByPrice = () => {
    if (listFlow) {
      const sorted = listFlow.sort((a, b) => a.price - b.price);
      setFilteredProducts(sorted);
    }
  };

  // Example of using the mapAndCollect operation
  const handleShowProductNames = async () => {
    if (listFlow) {
      await listFlow.mapAndCollect(
        product => product.name,
        names => {
          alert(`Product names: ${names.join(', ')}`);
        }
      );
    }
  };

  return (
    <div className="list-flow-example" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>ListFlow Enhanced Example</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Stream Operations</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={handleAddProduct} style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Add Random Product
          </button>
          <button onClick={handleSortByPrice} style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Sort by Price
          </button>
          <button onClick={handleShowProductNames} style={{ padding: '8px 16px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Show Names (mapAndCollect)
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label htmlFor="min-price">Minimum Price: </label>
            <input
              id="min-price"
              type="range"
              min="0"
              max="1000"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
              style={{ marginLeft: '10px' }}
            />
            <span style={{ marginLeft: '10px' }}>${minPrice}</span>
          </div>
          
          <div>
            <label htmlFor="category">Category: </label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Furniture">Furniture</option>
            </select>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>Total Value: ${totalValue}</h3>
          <p>Showing {filteredProducts.length} of {products.length} products</p>
        </div>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Price</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => (
            <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}>{product.id}</td>
              <td style={{ padding: '12px' }}>{product.name}</td>
              <td style={{ padding: '12px' }}>${product.price}</td>
              <td style={{ padding: '12px' }}>{product.category}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ 
                  color: product.inStock ? 'green' : 'red',
                  fontWeight: 'bold'
                }}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </td>
              <td style={{ padding: '12px' }}>
                <button 
                  onClick={() => handleUpdatePrice(product.id)}
                  style={{ marginRight: '5px', padding: '6px 12px', backgroundColor: '#FFC107', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Update Price
                </button>
                <button 
                  onClick={() => handleRemoveProduct(product.id)}
                  style={{ padding: '6px 12px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ListFlowExample;
