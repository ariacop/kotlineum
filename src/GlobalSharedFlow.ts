// GlobalSharedFlow.ts
import { useEffect, useState } from 'react';
import { Callback } from './types';
import { SharedFlow } from './useSharedFlow';

/**
 * Global registry of SharedFlow instances
 */
class SharedFlowRegistry {
  private static instance: SharedFlowRegistry;
  private flows: Map<string, SharedFlow<any>> = new Map();

  private constructor() {}

  public static getInstance(): SharedFlowRegistry {
    if (!SharedFlowRegistry.instance) {
      SharedFlowRegistry.instance = new SharedFlowRegistry();
    }
    return SharedFlowRegistry.instance;
  }

  public getOrCreate<T>(key: string): SharedFlow<T> {
    if (!this.flows.has(key)) {
      const subscribers = new Map<string, Callback<T>>();

      const sharedFlow: SharedFlow<T> = {
        subscribe: (uniqueId: string, callback: Callback<T>): (() => void) => {
          subscribers.set(uniqueId, callback);
          return () => sharedFlow.unsubscribe(uniqueId);
        },
        
        unsubscribe: (uniqueId: string) => {
          subscribers.delete(uniqueId);
        },
        
        emit: (value: T) => {
          subscribers.forEach((callback) => callback(value));
        },
        
        getSubscriberCount: () => {
          return subscribers.size;
        }
      };
      
      this.flows.set(key, sharedFlow);
    }
    
    return this.flows.get(key) as SharedFlow<T>;
  }

  public get<T>(key: string): SharedFlow<T> | undefined {
    return this.flows.get(key) as SharedFlow<T> | undefined;
  }

  public has(key: string): boolean {
    return this.flows.has(key);
  }
}

/**
 * Get or create a global SharedFlow instance
 * @param key Unique identifier for this SharedFlow
 * @returns A SharedFlow instance
 */
export function GlobalSharedFlow<T>(key: string): SharedFlow<T> {
  return SharedFlowRegistry.getInstance().getOrCreate(key);
}

/**
 * React hook to use a global SharedFlow
 * @param key Unique identifier for the SharedFlow
 * @param initialCallback Optional callback function to be called when a value is emitted
 * @returns [emitFunction, subscribeFunction]
 */
export function useGlobalSharedFlow<T>(
  key: string,
  initialCallback?: Callback<T>
): [(value: T) => void, (callback: Callback<T>) => () => void] {
  const flow = GlobalSharedFlow<T>(key);
  
  useEffect(() => {
    // If initial callback is provided, subscribe to the flow
    let unsubscribe: (() => void) | undefined;
    
    if (initialCallback) {
      unsubscribe = flow.subscribe(`hook-${key}-${Math.random()}`, initialCallback);
    }
    
    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [key, initialCallback]);
  
  // Function to emit a value to the flow
  const emit = (value: T) => flow.emit(value);
  
  // Function to subscribe to the flow with a custom callback
  const subscribe = (callback: Callback<T>) => {
    return flow.subscribe(`sub-${key}-${Math.random()}`, callback);
  };
  
  return [emit, subscribe];
}

/**
 * Hook to subscribe to a global shared flow and get the latest emitted value
 * @param key Unique identifier for the SharedFlow
 * @param initialState Optional initial state
 * @returns [latestValue, emitFunction]
 */
export function useGlobalSharedFlowWithState<T>(
  key: string,
  initialState?: T
): [T | undefined, (value: T) => void] {
  const [latestValue, setLatestValue] = useState<T | undefined>(initialState);
  const flow = GlobalSharedFlow<T>(key);
  
  useEffect(() => {
    // Subscribe to the flow
    const unsubscribe = flow.subscribe(
      `state-${key}-${Math.random()}`,
      (value) => setLatestValue(value)
    );
    
    // Cleanup subscription
    return unsubscribe;
  }, [key]);
  
  return [latestValue, (value: T) => flow.emit(value)];
}
