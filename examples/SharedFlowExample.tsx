import React, { useEffect, useState } from 'react';
import { useSharedFlow, useSharedFlowWithState, useGlobalSharedFlow } from '../src';

// Example of a component that emits events using a local SharedFlow
export const EventEmitter: React.FC = () => {
  // Create a local SharedFlow
  const [emit, subscribe] = useSharedFlow<string>();
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    const newCount = count + 1;
    setCount(newCount);
    emit(`Button clicked ${newCount} times!`);
  };
  
  return (
    <div className="event-emitter">
      <h3>Event Emitter</h3>
      <button onClick={handleClick}>
        Emit Event
      </button>
      <p>Click count: {count}</p>
    </div>
  );
};

// Example of a component that listens to events using a local SharedFlow
export const EventListener: React.FC<{ sharedFlow: any }> = ({ sharedFlow }) => {
  // Create a SharedFlow with state to track the latest emitted value
  const [events, setEvents] = useState<string[]>([]);
  
  useEffect(() => {
    // Subscribe to events from another component
    const unsubscribe = sharedFlow.subscribe((event: string) => {
      setEvents(prev => [...prev, event]);
    });
    
    return unsubscribe;
  }, [sharedFlow]);
  
  return (
    <div className="event-listener">
      <h3>Event Listener</h3>
      <h4>Events received:</h4>
      <ul>
        {events.map((event, index) => (
          <li key={index}>{event}</li>
        ))}
      </ul>
    </div>
  );
};

// Example of components using global SharedFlow
export const NotificationSender: React.FC = () => {
  // Connect to a global SharedFlow with key 'notifications'
  const [emitNotification] = useGlobalSharedFlow<{ id: number; message: string }>('notifications');
  const [messageText, setMessageText] = useState('');
  
  const handleSend = () => {
    if (messageText.trim()) {
      emitNotification({ 
        id: Date.now(), 
        message: messageText 
      });
      setMessageText('');
    }
  };
  
  return (
    <div className="notification-sender">
      <h3>Notification Sender</h3>
      <div>
        <input 
          type="text" 
          value={messageText} 
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Enter notification message"
        />
        <button onClick={handleSend}>Send Notification</button>
      </div>
    </div>
  );
};

export const NotificationReceiver: React.FC = () => {
  // Connect to the same global SharedFlow and track the latest value
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string }>>([]);
  
  // Use global shared flow
  const [, emitNotification] = useGlobalSharedFlow<{ id: number; message: string }>(
    'notifications',
    (notification) => {
      setNotifications(prev => [...prev, notification]);
    }
  );
  
  return (
    <div className="notification-receiver">
      <h3>Notification Receiver</h3>
      <div>
        {notifications.length === 0 ? (
          <p>No notifications yet</p>
        ) : (
          <ul>
            {notifications.map(notification => (
              <li key={notification.id} className="notification">
                {notification.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Complete example showing how to connect components
export const SharedFlowExample: React.FC = () => {
  // Create a shared flow to connect the emitter and listener
  const sharedFlow = useSharedFlow<string>();
  
  return (
    <div className="shared-flow-example">
      <h2>SharedFlow Examples</h2>
      
      <div className="example-section">
        <h3>Local SharedFlow Example</h3>
        <div className="example-container">
          <EventEmitter />
          <EventListener sharedFlow={sharedFlow} />
        </div>
      </div>
      
      <div className="example-section">
        <h3>Global SharedFlow Example</h3>
        <div className="example-container">
          <NotificationSender />
          <NotificationReceiver />
        </div>
      </div>
    </div>
  );
};
