import React, { useEffect, useState } from 'react';
import { CoroutineScope, createCoroutineScope, delay, withTimeout } from '../../src/Coroutines';
import { flow, flowOf, ticker, launchFlowCollection } from '../../src/Flow';

const CoroutinesExample: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [scope, setScope] = useState<CoroutineScope | null>(null);
  const [tickerActive, setTickerActive] = useState(false);
  const [tickerValue, setTickerValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Add a message to the log
  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize coroutine scope
  useEffect(() => {
    const newScope = createCoroutineScope();
    setScope(newScope);
    addMessage('CoroutineScope created');

    // Clean up scope when component unmounts
    return () => {
      newScope.cancel();
      addMessage('CoroutineScope cancelled');
    };
  }, []);

  // Example of a simple coroutine
  const runSimpleCoroutine = () => {
    if (!scope) return;
    
    addMessage('Starting simple coroutine');
    setLoading(true);
    
    scope.launch(async () => {
      addMessage('Coroutine started');
      
      // Simulate some work
      await delay(1000);
      addMessage('Step 1 completed');
      
      await delay(1000);
      addMessage('Step 2 completed');
      
      await delay(1000);
      addMessage('Coroutine completed');
      
      setLoading(false);
    });
  };

  // Example of a coroutine with timeout
  const runCoroutineWithTimeout = () => {
    if (!scope) return;
    
    addMessage('Starting coroutine with timeout');
    setLoading(true);
    
    scope.launch(async () => {
      try {
        await withTimeout(2000, async () => {
          addMessage('Timeout coroutine started');
          
          // This will take too long
          await delay(3000);
          
          addMessage('This message should not appear');
        });
      } catch (error) {
        addMessage(`Timeout error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    });
  };

  // Example of using Flow
  const runFlowExample = () => {
    if (!scope) return;
    
    addMessage('Starting Flow example');
    setLoading(true);
    
    scope.launch(async () => {
      // Create a simple flow that emits 5 values
      const simpleFlow = flow(async (collector) => {
        for (let i = 1; i <= 5; i++) {
          await delay(500);
          await collector.emit(i);
        }
      });
      
      // Transform the flow with proper type handling
      const transformedFlow = simpleFlow
        .map(value => (typeof value === 'number' ? value * 10 : 0))
        .filter(value => (typeof value === 'number' && value > 20));
      
      // Collect values from the flow
      await transformedFlow.collectValues((value: number) => {
        addMessage(`Flow emitted: ${value}`);
      });
      
      addMessage('Flow collection completed');
      setLoading(false);
    });
  };

  // Example of using flowOf
  const runFlowOfExample = () => {
    if (!scope) return;
    
    addMessage('Starting flowOf example');
    
    scope.launch(async () => {
      const flow = flowOf('Apple', 'Banana', 'Cherry', 'Date', 'Elderberry');
      
      await flow
        .map(fruit => fruit.toUpperCase())
        .filter(fruit => fruit.length > 5)
        .collectValues(fruit => {
          addMessage(`Fruit: ${fruit}`);
        });
      
      addMessage('flowOf example completed');
    });
  };

  // Example of using ticker flow
  const toggleTicker = () => {
    if (!scope) return;
    
    if (tickerActive) {
      // Stop the ticker
      scope.cancel();
      
      // Create a new scope
      const newScope = createCoroutineScope();
      setScope(newScope);
      
      setTickerActive(false);
      addMessage('Ticker stopped');
    } else {
      setTickerActive(true);
      addMessage('Starting ticker');
      
      // Create a ticker that emits every second
      const tickerFlow = ticker(1000);
      
      // Launch flow collection
      launchFlowCollection(scope, tickerFlow, (tick) => {
        setTickerValue(tick);
        addMessage(`Tick: ${tick}`);
      });
    }
  };

  // Clear the message log
  const clearLog = () => {
    setMessages([]);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Coroutines and Flow Example</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Controls</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={runSimpleCoroutine} 
            disabled={loading || !scope}
            style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Run Simple Coroutine
          </button>
          
          <button 
            onClick={runCoroutineWithTimeout} 
            disabled={loading || !scope}
            style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Run Coroutine with Timeout
          </button>
          
          <button 
            onClick={runFlowExample} 
            disabled={loading || !scope}
            style={{ padding: '8px 16px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Run Flow Example
          </button>
          
          <button 
            onClick={runFlowOfExample} 
            disabled={!scope}
            style={{ padding: '8px 16px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Run flowOf Example
          </button>
          
          <button 
            onClick={toggleTicker} 
            disabled={!scope}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: tickerActive ? '#F44336' : '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            {tickerActive ? 'Stop Ticker' : 'Start Ticker'}
          </button>
          
          <button 
            onClick={clearLog}
            style={{ padding: '8px 16px', backgroundColor: '#607D8B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear Log
          </button>
        </div>
      </div>
      
      {tickerActive && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ margin: 0 }}>Ticker Value: {tickerValue}</h2>
        </div>
      )}
      
      <div>
        <h2>Log</h2>
        <div 
          style={{ 
            height: '400px', 
            overflowY: 'auto', 
            border: '1px solid #ccc', 
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}
        >
          {messages.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>No messages yet. Run an example to see output.</p>
          ) : (
            messages.map((message, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CoroutinesExample;
