import React from 'react';
import { useGlobalStateFlow, StorageType } from '../src/GlobalStateFlow';
import './PersistentStateFlowExample.css';

/**
 * Example component demonstrating persistent GlobalStateFlow
 */
const PersistentStateFlowExample: React.FC = () => {
  // Create a persistent state flow with localStorage
  const [count, setCount] = useGlobalStateFlow('persistentCounter', 0, {
    enabled: true, // Enable persistence
    storageKey: 'my-app-counter', // Custom localStorage key (optional)
    storageType: StorageType.LOCAL_STORAGE, // Explicitly use localStorage
    debounceTime: 200, // Customize debounce time for better performance
  });

  // Create another persistent state flow with custom serialization
  const [user, setUser] = useGlobalStateFlow(
    'persistentUser',
    { name: 'Guest', lastLogin: new Date().toISOString() },
    {
      enabled: true,
      // Custom serialization/deserialization for handling dates
      serialize: (value) => JSON.stringify(value),
      deserialize: (stored) => {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          // Convert ISO string back to Date if needed
          lastLogin: new Date(parsed.lastLogin).toISOString()
        };
      }
    }
  );
  
  // Create a persistent state flow with IndexedDB
  const [complexData, setComplexData] = useGlobalStateFlow(
    'complexData',
    {
      items: [
        { id: 1, name: 'Item 1', completed: false },
        { id: 2, name: 'Item 2', completed: true },
      ],
      settings: {
        darkMode: false,
        notifications: true,
        lastUpdated: new Date().toISOString()
      }
    },
    {
      enabled: true,
      storageType: StorageType.INDEXED_DB, // Use IndexedDB for larger data
      dbName: 'my-app-database', // Custom database name
      storeName: 'app-state', // Custom store name
      debounceTime: 500, // Longer debounce for complex data
      // Custom serialization/deserialization
      serialize: (value) => JSON.stringify(value),
      deserialize: (stored) => {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          settings: {
            ...parsed.settings,
            lastUpdated: new Date(parsed.settings.lastUpdated).toISOString()
          }
        };
      }
    }
  );

  return (
    <div className="example-container">
      <h2>Persistent StateFlow Example</h2>
      <p>
        This example demonstrates GlobalStateFlow with both localStorage and IndexedDB persistence.
        All data will persist even if you refresh the page or close the browser.
      </p>

      <div className="counter-section">
        <h3>Persistent Counter with localStorage: {count}</h3>
        <p className="storage-info">Using localStorage with 200ms debounce</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
        <button onClick={() => setCount(count - 1)}>Decrement</button>
        <button onClick={() => setCount(0)}>Reset</button>
      </div>

      <div className="user-section">
        <h3>Persistent User with localStorage</h3>
        <p className="storage-info">Using localStorage with default settings</p>
        <p>Name: {user.name}</p>
        <p>Last Login: {new Date(user.lastLogin).toLocaleString()}</p>
        
        <input
          type="text"
          value={user.name}
          onChange={(e) => setUser({ ...user, name: e.target.value })}
          placeholder="Change username"
        />
        <button
          onClick={() => 
            setUser({ 
              ...user, 
              lastLogin: new Date().toISOString() 
            })
          }
        >
          Update Login Time
        </button>
      </div>
      
      <div className="complex-data-section">
        <h3>Complex Data with IndexedDB</h3>
        <p className="storage-info">Using IndexedDB with 500ms debounce for better performance</p>
        
        <div className="items-list">
          <h4>Items</h4>
          {complexData.items.map(item => (
            <div key={item.id} className="item">
              <input 
                type="checkbox" 
                checked={item.completed}
                onChange={() => {
                  const updatedItems = complexData.items.map(i => 
                    i.id === item.id ? { ...i, completed: !i.completed } : i
                  );
                  setComplexData({
                    ...complexData,
                    items: updatedItems,
                    settings: {
                      ...complexData.settings,
                      lastUpdated: new Date().toISOString()
                    }
                  });
                }}
              />
              <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
                {item.name}
              </span>
            </div>
          ))}
          
          <button
            onClick={() => {
              const newId = Math.max(0, ...complexData.items.map(i => i.id)) + 1;
              setComplexData({
                ...complexData,
                items: [
                  ...complexData.items,
                  { id: newId, name: `Item ${newId}`, completed: false }
                ],
                settings: {
                  ...complexData.settings,
                  lastUpdated: new Date().toISOString()
                }
              });
            }}
          >
            Add Item
          </button>
        </div>
        
        <div className="settings">
          <h4>Settings</h4>
          <label>
            <input
              type="checkbox"
              checked={complexData.settings.darkMode}
              onChange={() => {
                setComplexData({
                  ...complexData,
                  settings: {
                    ...complexData.settings,
                    darkMode: !complexData.settings.darkMode,
                    lastUpdated: new Date().toISOString()
                  }
                });
              }}
            />
            Dark Mode
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={complexData.settings.notifications}
              onChange={() => {
                setComplexData({
                  ...complexData,
                  settings: {
                    ...complexData.settings,
                    notifications: !complexData.settings.notifications,
                    lastUpdated: new Date().toISOString()
                  }
                });
              }}
            />
            Notifications
          </label>
          <p>Last Updated: {new Date(complexData.settings.lastUpdated).toLocaleString()}</p>
        </div>
      </div>

      <div className="explanation">
        <h3>How It Works</h3>
        <ol>
          <li>State is automatically loaded from storage (localStorage or IndexedDB) when the component mounts</li>
          <li>Changes to state are asynchronously saved with debouncing for optimal performance</li>
          <li>If the site goes offline, data will still be available from the browser's storage</li>
          <li>Large or complex data is stored in IndexedDB for better performance</li>
          <li>Simple data is stored in localStorage for quick access</li>
          <li>Custom serialization/deserialization can be provided for complex data types</li>
          <li>Memory and CPU usage is optimized through connection pooling and debouncing</li>
        </ol>
        
        <h4>Performance Optimizations</h4>
        <ul>
          <li><strong>Debouncing:</strong> Prevents excessive writes during rapid state changes</li>
          <li><strong>Connection Pooling:</strong> Reuses IndexedDB connections to reduce overhead</li>
          <li><strong>Cleanup:</strong> Properly closes connections to prevent memory leaks</li>
          <li><strong>Async Operations:</strong> All storage operations are non-blocking</li>
          <li><strong>Error Handling:</strong> Robust error handling prevents crashes</li>
        </ul>
      </div>
    </div>
  );
};

export default PersistentStateFlowExample;
