import React, { useState } from 'react';
import { useStateFlow, useGlobalStateFlow } from '../src';

// Example of a component using local StateFlow
export const Counter: React.FC = () => {
  // Create a local StateFlow with initial value 0
  const [count, setCount] = useStateFlow(0);
  
  return (
    <div className="counter">
      <h3>Local StateFlow Counter</h3>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
};

// Example of components using global StateFlow
export const CounterDisplay: React.FC = () => {
  // Connect to a global StateFlow with key 'counter' and initial value 0
  const [count] = useGlobalStateFlow('counter', 0);
  
  return (
    <div className="counter-display">
      <h3>Counter Display</h3>
      <p>Global Count: {count}</p>
    </div>
  );
};

export const CounterControls: React.FC = () => {
  // Connect to the same global StateFlow
  const [count, setCount] = useGlobalStateFlow('counter', 0);
  
  return (
    <div className="counter-controls">
      <h3>Counter Controls</h3>
      <div>
        <button onClick={() => setCount(count + 1)}>+</button>
        <button onClick={() => setCount(count - 1)}>-</button>
        <button onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  );
};

// Example of a more complex state using StateFlow
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export const TodoApp: React.FC = () => {
  // Create a local StateFlow with initial todo list
  const [todos, setTodos] = useStateFlow<TodoItem[]>([
    { id: 1, text: 'Learn Kotlineum', completed: false },
    { id: 2, text: 'Build an app with StateFlow', completed: false }
  ]);
  const [newTodoText, setNewTodoText] = useState('');
  
  const addTodo = () => {
    if (newTodoText.trim()) {
      setTodos([
        ...todos,
        {
          id: Date.now(),
          text: newTodoText,
          completed: false
        }
      ]);
      setNewTodoText('');
    }
  };
  
  const toggleTodo = (id: number) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };
  
  const removeTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  return (
    <div className="todo-app">
      <h3>Todo App with StateFlow</h3>
      <div className="add-todo">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Add a new todo"
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => removeTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <div className="todo-stats">
        <p>Total: {todos.length}</p>
        <p>Completed: {todos.filter(todo => todo.completed).length}</p>
      </div>
    </div>
  );
};

// Complete example showing how to use StateFlow
export const StateFlowExample: React.FC = () => {
  return (
    <div className="state-flow-example">
      <h2>StateFlow Examples</h2>
      
      <div className="example-section">
        <h3>Local StateFlow Example</h3>
        <Counter />
      </div>
      
      <div className="example-section">
        <h3>Global StateFlow Example</h3>
        <div className="example-container">
          <CounterDisplay />
          <CounterControls />
        </div>
      </div>
      
      <div className="example-section">
        <h3>Complex State Example</h3>
        <TodoApp />
      </div>
    </div>
  );
};
