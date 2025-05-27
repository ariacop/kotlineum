# Kotlineum

[![npm version](https://img.shields.io/npm/v/kotlineum.svg)](https://www.npmjs.com/package/kotlineum)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A comprehensive React implementation of Kotlin patterns and features. Currently includes Flow patterns (SharedFlow and StateFlow) for state management in React applications, with more Kotlin features planned for future releases.

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
- ⚛️ **React Hooks**: Easy integration with React components

### Coming Soon

- 🏗️ **ViewModels**: MVVM architecture pattern implementation
- 🔄 **Coroutines**: Kotlin-inspired asynchronous programming
- 📦 **Sealed Classes**: Type-safe unions with exhaustive pattern matching
- 🧩 **Extension Functions**: Extend existing types with new functionality
- 🛡️ **Data Classes**: Immutable data containers with built-in utility functions

## Usage

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

#### `useGlobalStateFlow<T>(key: string, initialValue: T): [T, (newValue: T) => void]`
Creates or connects to a global StateFlow with the given key and initial value.

#### `StateFlow<T>(initialValue: T): StateFlow<T>`
Factory function to create a StateFlow object.

#### `GlobalStateFlow<T>(key: string, initialValue: T): StateFlow<T>`
Factory function to create or get a global StateFlow object.

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
