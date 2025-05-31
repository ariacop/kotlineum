import React, { useEffect } from 'react';
import { ViewModel, useViewModel } from '../../src';
import { Injectable, Inject, Module, useDependency, inject } from '../../src/di';

// Define service interfaces
interface ProductApi {
  fetchProducts(): Promise<Product[]>;
  addProduct(product: Product): Promise<Product>;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

// Implement API service
@Injectable()
class ProductApiService implements ProductApi {
  async fetchProducts(): Promise<Product[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      { id: 1, name: 'Laptop', price: 999 },
      { id: 2, name: 'Smartphone', price: 699 },
      { id: 3, name: 'Headphones', price: 149 }
    ];
  }
  
  async addProduct(product: Product): Promise<Product> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...product, id: Date.now() };
  }
}

// Define ViewModel state and intents
interface ProductState {
  products: Product[];
}

// Define intents for the ViewModel
type ProductIntent = 
  | { type: 'LOAD_PRODUCTS' }
  | { type: 'ADD_PRODUCT', payload: { name: string, price: number } }

// Create ViewModel that uses DI
@Injectable()
class ProductViewModel extends ViewModel<ProductState, ProductIntent, any> {
  // Use property initialization with inject function instead of decorator
  private productApi: ProductApi = inject<ProductApi>('productApi');
  
  constructor() {
    super({
      products: []
    });
  }
  
  // Implement the required processIntent method
  processIntent(intent: ProductIntent): void {
    switch (intent.type) {
      case 'LOAD_PRODUCTS':
        this.loadProducts();
        break;
      case 'ADD_PRODUCT':
        const { name, price } = intent.payload;
        this.addProduct(name, price);
        break;
    }
  }
  
  async loadProducts() {
    this.setLoading(true);
    this.setError(null);
    
    try {
      const products = await this.productApi.fetchProducts();
      this.updateData({ products });
      this.setLoading(false);
    } catch (error) {
      this.setError('Failed to load products');
      this.setLoading(false);
    }
  }
  
  async addProduct(name: string, price: number) {
    const newProduct = { id: 0, name, price };
    
    try {
      const addedProduct = await this.productApi.addProduct(newProduct);
      // Use the proper way to update data in ViewModel
      const currentProducts = this.getState()?.data?.products || [];
      this.updateData({ 
        products: [...currentProducts, addedProduct] 
      });
      return true;
    } catch (error) {
      this.setError('Failed to add product');
      return false;
    }
  }
}

// Create and register DI module
const productModule = new Module({
  providers: [
    { provide: 'productApi', useClass: ProductApiService },
    { provide: 'productViewModel', useClass: ProductViewModel }
  ]
});

productModule.register();

// React component that uses the ViewModel through DI
export function ProductListComponent() {
  // Get ViewModel from DI container
  const viewModel = useDependency<ProductViewModel>('productViewModel');
  
  // Use the ViewModel with React hooks - using type assertion to fix type compatibility
  const [viewModelState, _] = useViewModel<ProductState, any, ProductViewModel>('productViewModel', ProductViewModel as any);
  const { data, loading, error } = viewModelState;
  const { products } = data as ProductState;
  
  useEffect(() => {
    // Load products when component mounts
    viewModel.loadProducts();
  }, [viewModel]);
  
  // Form state for adding new products
  const [newProductName, setNewProductName] = React.useState('');
  const [newProductPrice, setNewProductPrice] = React.useState('');
  
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProductName && newProductPrice) {
      const price = parseFloat(newProductPrice);
      if (!isNaN(price)) {
        const success = await viewModel.addProduct(newProductName, price);
        if (success) {
          setNewProductName('');
          setNewProductPrice('');
        }
      }
    }
  };
  
  return (
    <div className="product-list">
      <h2>Products</h2>
      
      {error && <div className="error">{error}</div>}
      
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <ul>
          {products.map(product => (
            <li key={product.id}>
              {product.name} - ${product.price.toFixed(2)}
            </li>
          ))}
        </ul>
      )}
      
      <h3>Add New Product</h3>
      <form onSubmit={handleAddProduct}>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Price:
            <input
              type="number"
              value={newProductPrice}
              onChange={e => setNewProductPrice(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </label>
        </div>
        <button type="submit">Add Product</button>
      </form>
    </div>
  );
}
