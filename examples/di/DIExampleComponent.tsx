import React, { useEffect, useState } from 'react';
import { useDependency, useProvider, DIContainer, Module } from '../../src/di';

// Define service interfaces
interface DataService {
  fetchData(): Promise<string[]>;
}

interface NotificationService {
  notify(message: string): void;
}

// Implement services
class ApiDataService implements DataService {
  async fetchData(): Promise<string[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return ['Item 1', 'Item 2', 'Item 3'];
  }
}

class ToastNotificationService implements NotificationService {
  notify(message: string): void {
    console.log(`NOTIFICATION: ${message}`);
    // In a real app, this would show a toast notification
  }
}

// Create and register module
const serviceModule = new Module({
  providers: [
    { provide: 'dataService', useClass: ApiDataService },
    { provide: 'notificationService', useClass: ToastNotificationService }
  ]
});

serviceModule.register();

// React component that uses DI
export function DataComponent() {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use dependency injection to get services
  const dataService = useDependency<DataService>('dataService');
  const notificationService = useDependency<NotificationService>('notificationService');
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await dataService.fetchData();
        setData(result);
        notificationService.notify('Data loaded successfully');
      } catch (error) {
        notificationService.notify('Error loading data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [dataService, notificationService]);
  
  return (
    <div className="data-component">
      <h2>Data Component</h2>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <ul>
          {data.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Example of providing a scoped service with useProvider
export function ConfiguredDataComponent() {
  // Create and provide a custom configuration
  const config = useProvider('componentConfig', () => ({
    refreshInterval: 5000,
    maxItems: 10
  }));
  
  // Use the DataComponent which will have access to the provided config
  return (
    <div>
      <h2>Configured Component</h2>
      <p>Refresh interval: {config.refreshInterval}ms</p>
      <DataComponent />
    </div>
  );
}
