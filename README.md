# Kotlineum

[![npm version](https://img.shields.io/npm/v/kotlineum.svg)](https://www.npmjs.com/package/kotlineum)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A comprehensive React implementation of Kotlin patterns and features. Includes Flow patterns (SharedFlow and StateFlow) for state management and MVVM architecture with ViewModels for React applications, with more Kotlin features planned for future releases.

## Installation

```bash
npm install kotlineum
# or
yarn add kotlineum
```

## Features

### Current Features

- 🔄 **StateFlow**: A state holder observable flow that emits the current and new state updates to its collectors
- 📡 **SharedFlow**: A hot flow that emits values to all collectors
- 🌐 **Global Flows**: Create application-wide flows accessible from any component
- 💾 **Persistent State**: Automatically save and recover state with localStorage or IndexedDB
- 💪 **Performance Optimized**: Debouncing, connection pooling, and memory leak prevention
- 📂 **ListStateFlow**: Efficiently manage large lists with individual item updates
- 🏗️ **ViewModels**: MVVM architecture pattern implementation
- ⚛️ **React Hooks**: Easy integration with React components

### Coming Soon
- 🔄 **Coroutines**: Kotlin-inspired asynchronous programming
- 📦 **Sealed Classes**: Type-safe unions with exhaustive pattern matching
- 🧩 **Extension Functions**: Extend existing types with new functionality
- 🛡️ **Data Classes**: Immutable data containers with built-in utility functions

## Usage

### ViewModels

ViewModels provide a clean way to implement MVVM architecture in React applications, similar to how they're used in Kotlin Android development.

#### Creating a ViewModel

```tsx
import { ViewModel } from 'kotlineum';

// Define your state type
export interface CounterState {
  count: number;
  lastUpdated: Date | null;
}

// Define event types (optional)
export enum CounterEvent {
  INCREMENTED = 'INCREMENTED',
  RESET = 'RESET'
}

// Create your ViewModel class
export class CounterViewModel extends ViewModel<CounterState, CounterEvent> {
  constructor(initialCount: number = 0) {
    // Initialize with default state
    super({ count: initialCount, lastUpdated: null });
  }
  
  // Add methods for business logic
  increment(): void {
    const currentState = this.getData();
    if (!currentState) return;
    
    // Update state
    this.updateData({
      count: currentState.count + 1,
      lastUpdated: new Date()
    });
    
    // Emit event
    this.emitEvent(CounterEvent.INCREMENTED);
  }
  
  reset(): void {
    this.updateData({
      count: 0,
      lastUpdated: new Date()
    });
    
    this.emitEvent(CounterEvent.RESET);
  }
  
  // Async operations
  async fetchCount(): Promise<void> {
    this.setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const randomCount = Math.floor(Math.random() * 100);
      
      this.updateData({
        count: randomCount,
        lastUpdated: new Date()
      });
      
      this.setLoading(false);
    } catch (error) {
      this.setError('Failed to fetch count');
      this.setLoading(false);
    }
  }
}
```

#### Using a ViewModel in a Component

```tsx
import React, { useEffect } from 'react';
import { useViewModel } from 'kotlineum';
import { CounterViewModel, CounterEvent } from './CounterViewModel';

function CounterView() {
  // Use a local ViewModel instance
  const [state, viewModel] = useViewModel('counter', CounterViewModel, 0);
  
  // Extract data from state
  const { data, loading, error } = state;
  
  useEffect(() => {
    // Subscribe to events from the ViewModel
    const unsubscribe = viewModel.subscribeToEvents('counter-events', (event) => {
      console.log('Event received:', event);
    });
    
    return unsubscribe;
  }, [viewModel]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;
  
  return (
    <div>
      <h3>Counter with ViewModel</h3>
      <p>Count: {data.count}</p>
      {data.lastUpdated && (
        <p>Last updated: {data.lastUpdated.toLocaleTimeString()}</p>
      )}
      
      <button onClick={() => viewModel.increment()}>Increment</button>
      <button onClick={() => viewModel.reset()}>Reset</button>
      <button onClick={() => viewModel.fetchCount()}>Fetch Random</button>
    </div>
  );
}
```

#### Sharing ViewModels Between Components

```tsx
import { useGlobalViewModel } from 'kotlineum';

// In any component
function ComponentA() {
  // Connect to a global ViewModel
  const [state, viewModel] = useGlobalViewModel('shared-counter', CounterViewModel, 0);
  // Use the ViewModel...
}

// In another component, even in a different part of your app
function ComponentB() {
  // Connect to the same global ViewModel
  const [state, viewModel] = useGlobalViewModel('shared-counter', CounterViewModel, 0);
  // Changes made in ComponentA will be reflected here
}
```

### StateFlow

StateFlow is a state-holder observable flow that emits the current and new state updates to its collectors.

#### Local StateFlow

```tsx
import { useStateFlow } from 'kotlineum';

function Counter() {
  // Create a local StateFlow with initial value 0
  const [count, setCount] = useStateFlow(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

#### Global StateFlow

```tsx
import { useGlobalStateFlow } from 'kotlineum';

// In any component
function CounterDisplay() {
  // Connect to a global StateFlow with key 'counter' and initial value 0
  const [count, setCount] = useGlobalStateFlow('counter', 0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// In another component, even in a different part of your app
function CounterControls() {
  // Connect to the same global StateFlow
  const [count, setCount] = useGlobalStateFlow('counter', 0);
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}
```

#### Persistent Global StateFlow

You can make your GlobalStateFlow persist to localStorage or IndexedDB, which will automatically save state changes asynchronously and recover state when the application loads, even if offline:

```tsx
import { useGlobalStateFlow, StorageType } from 'kotlineum';

function PersistentCounter() {
  // Create a persistent global StateFlow with localStorage
  const [count, setCount] = useGlobalStateFlow('counter', 0, {
    enabled: true, // Enable persistence
    storageType: StorageType.LOCAL_STORAGE, // Default, can be omitted
    storageKey: 'my-app-counter', // Custom localStorage key (optional)
    debounceTime: 300, // Debounce time in ms (default: 300)
  });
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>This counter will persist even if you refresh the page!</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

For larger or more complex data, you can use IndexedDB for better performance:

```tsx
// Store complex data in IndexedDB
const [userData, setUserData] = useGlobalStateFlow(
  'userData',
  { 
    profile: { name: 'Guest', email: '' },
    preferences: { theme: 'light', notifications: true },
    history: [] 
  },
  {
    enabled: true,
    storageType: StorageType.INDEXED_DB, // Use IndexedDB instead of localStorage
    dbName: 'my-app-database', // Custom database name
    storeName: 'user-store', // Custom store name
    debounceTime: 500, // Longer debounce for complex data
    // Custom serialization/deserialization
    serialize: (value) => JSON.stringify(value),
    deserialize: (stored) => JSON.parse(stored)
  }
);
```

For any storage type, you can provide custom serialization/deserialization functions:

```tsx
const [user, setUser] = useGlobalStateFlow(
  'user',
  { name: 'Guest', lastLogin: new Date().toISOString() },
  {
    enabled: true,
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
```

### Storage Types

Choose between localStorage and IndexedDB for persistence:

```typescript
enum StorageType {
  /** Use localStorage (default) */
  LOCAL_STORAGE = 'localStorage',
  /** Use IndexedDB */
  INDEXED_DB = 'indexedDB'
}
```

### PersistOptions

Options for configuring persistence with GlobalStateFlow:

```typescript
interface PersistOptions {
  /** Key to use in storage (defaults to 'kotlineum_state_[key]') */
  storageKey?: string;
  /** Whether to enable persistence (must be true to enable persistence) */
  enabled?: boolean;
  /** Storage type to use (localStorage or indexedDB) */
  storageType?: StorageType;
  /** Database name for IndexedDB (only used with IndexedDB, defaults to 'kotlineum_db') */
  dbName?: string;
  /** Store name for IndexedDB (only used with IndexedDB, defaults to 'kotlineum_store') */
  storeName?: string;
  /** Debounce time in ms for saving to storage (default: 300) */
  debounceTime?: number;
  /** Custom serializer function (defaults to JSON.stringify) */
  serialize?: (value: any) => string;
  /** Custom deserializer function (defaults to JSON.parse) */
  deserialize?: (value: string) => any;
}
```

### Performance Optimizations

The persistence implementation includes several performance optimizations:

1. **Debouncing**: Prevents excessive writes during rapid state changes
2. **Connection Pooling**: Reuses IndexedDB connections to reduce overhead
3. **Async Operations**: All storage operations are non-blocking
4. **Memory Leak Prevention**: Properly closes connections and cleans up resources
5. **Error Handling**: Robust error handling prevents crashes

### ListStateFlow

ListStateFlow is a specialized flow for efficiently managing large lists with individual item updates, similar to how Kotlin handles collections.

```tsx
import { useGlobalListStateFlow, useListItem } from 'kotlineum';

// Create a ListStateFlow for a large collection
const [records, listFlow] = useGlobalListStateFlow<Record>(
  'recordsList',
  initialRecords,
  {
    idField: 'id', // Specify which field is the unique identifier
    persistOptions: {
      enabled: true,
      storageType: StorageType.INDEXED_DB
    }
  }
);

// In a child component, subscribe to just one item
const RecordItem = ({ recordId }) => {
  // Only subscribe to changes for this specific record
  const [record, updateRecord] = useListItem(listFlow, recordId);
  
  if (!record) return null;
  
  return (
    <div>
      <h3>{record.name}</h3>
      <p>Status: {record.status}</p>
      
      {/* Update only this record */}
      <button onClick={() => {
        updateRecord(r => ({
          ...r,
          status: r.status === 'active' ? 'inactive' : 'active'
        }));
      }}>
        Toggle Status
      </button>
    </div>
  );
};
```

#### ListStateFlow Methods

```typescript
// Get all items
const items = listFlow.getItems();

// Get a specific item
const item = listFlow.getItem(id);

// Update a specific item
listFlow.updateItem(id, item => ({ ...item, status: 'active' }));

// Add a new item
listFlow.addItem({ id: 123, name: 'New Item', status: 'active' });

// Remove an item
listFlow.removeItem(id);

// Batch update multiple items at once
listFlow.batchUpdate([
  { id: 1, update: item => ({ ...item, status: 'active' }) },
  { id: 2, update: item => ({ ...item, status: 'inactive' }) }
]);

// Filter items (doesn't modify the original list)
const activeItems = listFlow.filter(item => item.status === 'active');

// Map items (doesn't modify the original list)
const names = listFlow.map(item => item.name);
```

#### ListStateFlow Options

```typescript
interface ListStateFlowOptions<T> {
  /** Custom ID field for list items (default: 'id') */
  idField?: keyof T;
  /** Persistence options */
  persistOptions?: PersistOptions;
}
```

### SharedFlow

SharedFlow is a hot flow that emits values to all collectors without maintaining state.

#### Local SharedFlow

```tsx
import { useSharedFlow, useSharedFlowWithState } from 'kotlineum';

function EventEmitter() {
  // Create a local SharedFlow
  const [emit, subscribe] = useSharedFlow();
  
  return (
    <div>
      <button onClick={() => emit('Button clicked!')}>
        Emit Event
      </button>
    </div>
  );
}

function EventListener() {
  // Create a SharedFlow with state to track the latest emitted value
  const [latestEvent, emit, subscribe] = useSharedFlowWithState();
  
  useEffect(() => {
    // Subscribe to events from another component
    const unsubscribe = otherComponentFlow.subscribe((event) => {
      console.log('Received event:', event);
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <div>
      {latestEvent && <p>Latest event: {latestEvent}</p>}
    </div>
  );
}
```

#### Global SharedFlow

```tsx
import { useGlobalSharedFlow, useGlobalSharedFlowWithState } from 'kotlineum';

// In any component
function NotificationSender() {
  // Connect to a global SharedFlow with key 'notifications'
  const [emitNotification] = useGlobalSharedFlow('notifications');
  
  return (
    <button onClick={() => emitNotification({ 
      id: Date.now(), 
      message: 'New notification!' 
    })}>
      Send Notification
    </button>
  );
}

// In another component, even in a different part of your app
function NotificationReceiver() {
  // Connect to the same global SharedFlow and track the latest value
  const [latestNotification, emitNotification] = useGlobalSharedFlowWithState('notifications');
  
  return (
    <div>
      {latestNotification && (
        <div className="notification">
          {latestNotification.message}
        </div>
      )}
    </div>
  );
}
```

## Advanced Usage

### Direct Access to Flow Objects

You can directly access the flow objects for more control:

```tsx
import { GlobalStateFlow, GlobalSharedFlow } from 'kotlineum';

// Get a reference to a global StateFlow
const counterFlow = GlobalStateFlow('counter', 0);

// Get the current value
const currentCount = counterFlow.getValue();

// Update the value
counterFlow.update(currentCount + 1);

// Get a reference to a global SharedFlow
const notificationFlow = GlobalSharedFlow('notifications');

// Emit a value
notificationFlow.emit({ id: Date.now(), message: 'Hello!' });

// Subscribe manually
const unsubscribe = notificationFlow.subscribe('my-subscriber', (notification) => {
  console.log('Received notification:', notification);
});

// Later, unsubscribe
unsubscribe();
```

### Using with TypeScript

All flows are fully typed:

```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

// Typed StateFlow
const [user, setUser] = useStateFlow<User>({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
});

// Typed SharedFlow
const [emitUser, subscribeToUser] = useSharedFlow<User>();
```

## API Reference

### StateFlow

#### `useStateFlow<T>(initialValue: T): [T, (newValue: T) => void]`
Creates a local StateFlow with the given initial value.

#### `useGlobalStateFlow<T>(key: string, initialValue: T, persistOptions?: PersistOptions): [T, (newValue: T) => void]`
Creates or connects to a global StateFlow with the given key and initial value. Optionally configure persistence to localStorage.

#### `StateFlow<T>(initialValue: T): StateFlow<T>`
Factory function to create a StateFlow object.

#### `GlobalStateFlow<T>(key: string, initialValue: T, persistOptions?: PersistOptions): StateFlow<T>`
Factory function to create or get a global StateFlow object. Optionally configure persistence to localStorage.

### SharedFlow

#### `useSharedFlow<T>(): [(value: T) => void, (callback: Callback<T>) => () => void]`
Creates a local SharedFlow.

#### `useSharedFlowWithState<T>(initialState?: T): [T | undefined, (value: T) => void, (callback: Callback<T>) => () => void]`
Creates a local SharedFlow that tracks the latest emitted value.

#### `useGlobalSharedFlow<T>(key: string, initialCallback?: Callback<T>): [(value: T) => void, (callback: Callback<T>) => () => void]`
Creates or connects to a global SharedFlow with the given key.

#### `useGlobalSharedFlowWithState<T>(key: string, initialState?: T): [T | undefined, (value: T) => void]`
Creates or connects to a global SharedFlow with the given key and tracks the latest emitted value.

#### `SharedFlow<T>(): SharedFlow<T>`
Factory function to create a SharedFlow object.

#### `GlobalSharedFlow<T>(key: string): SharedFlow<T>`
Factory function to create or get a global SharedFlow object.

## License

MIT
