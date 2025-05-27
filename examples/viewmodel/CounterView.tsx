import React, { useEffect, useState } from 'react';
import { useViewModel, useGlobalViewModel } from '../../src/useViewModel';
import { CounterViewModel, CounterEvent } from './CounterViewModel';
import { CounterState } from './CounterViewModel';

/**
 * Example component using a local ViewModel
 */
export const CounterView: React.FC = () => {
  // Use a local ViewModel instance
  const [state, viewModel] = useViewModel<CounterState, CounterEvent, CounterViewModel>('counter', CounterViewModel, 0, 10);
  const [events, setEvents] = useState<string[]>([]);
  
  useEffect(() => {
    // Subscribe to events
    const unsubscribe = viewModel.subscribeToEvents('counter-events', (event: CounterEvent) => {
      setEvents(prev => [...prev, event]);
    });
    
    return unsubscribe;
  }, [viewModel]);
  
  // Extract data from state
  const { data, loading, error } = state;
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;
  
  return (
    <div className="counter-view">
      <h3>Counter with ViewModel</h3>
      <p>Count: {data.count}</p>
      {data.lastUpdated && (
        <p>Last updated: {data.lastUpdated.toLocaleTimeString()}</p>
      )}
      
      <div className="controls">
        <button onClick={() => viewModel.increment()}>Increment</button>
        <button onClick={() => viewModel.decrement()}>Decrement</button>
        <button onClick={() => viewModel.reset()}>Reset</button>
        <button onClick={() => viewModel.fetchCount()}>Fetch Random</button>
      </div>
      
      <div className="events">
        <h4>Events:</h4>
        <ul>
          {events.map((event, index) => (
            <li key={index}>{event}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/**
 * Example component using a global ViewModel
 */
export const GlobalCounterView: React.FC = () => {
  // Use a global ViewModel instance that can be shared across components
  const [state, viewModel] = useGlobalViewModel<CounterState, CounterEvent, CounterViewModel>('global-counter', CounterViewModel, 0, 5);
  
  // Extract data from state
  const { data, loading, error } = state;
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;
  
  return (
    <div className="global-counter-view">
      <h3>Global Counter with ViewModel</h3>
      <p>Count: {data.count}</p>
      {data.lastUpdated && (
        <p>Last updated: {data.lastUpdated.toLocaleTimeString()}</p>
      )}
      
      <div className="controls">
        <button onClick={() => viewModel.increment()}>Increment</button>
        <button onClick={() => viewModel.decrement()}>Decrement</button>
        <button onClick={() => viewModel.reset()}>Reset</button>
      </div>
    </div>
  );
};

/**
 * Example component showing multiple components sharing the same global ViewModel
 */
export const CounterViewExample: React.FC = () => {
  return (
    <div className="counter-example">
      <h2>ViewModel Examples</h2>
      
      <div className="example-section">
        <h3>Local ViewModel Example</h3>
        <CounterView />
      </div>
      
      <div className="example-section">
        <h3>Global ViewModel Example (Shared State)</h3>
        <div className="shared-viewmodels">
          <GlobalCounterView />
          <GlobalCounterView />
        </div>
        <p className="note">
          Note: Both counters above share the same ViewModel instance.
          Changes in one will affect the other.
        </p>
      </div>
    </div>
  );
};
