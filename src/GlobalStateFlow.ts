// GlobalStateFlow.ts
import { useEffect, useState } from 'react';
import { Callback } from './types';
import { StateFlow } from './useStateFlow';

/**
 * Global registry of StateFlow instances
 */
class StateFlowRegistry {
  private static instance: StateFlowRegistry;
  private flows: Map<string, StateFlow<any>> = new Map();

  private constructor() {}

  public static getInstance(): StateFlowRegistry {
    if (!StateFlowRegistry.instance) {
      StateFlowRegistry.instance = new StateFlowRegistry();
    }
    return StateFlowRegistry.instance;
  }

  public getOrCreate<T>(key: string, initialValue: T): StateFlow<T> {
    if (!this.flows.has(key)) {
      const subscribers = new Map<string, Callback<T>>();
      let currentValue = initialValue;

      const stateFlow: StateFlow<T> = {
        getValue: () => currentValue,
        
        subscribe: (uniqueId: string, callback: Callback<T>): (() => void) => {
          subscribers.set(uniqueId, callback);
          // Immediately emit current value to new subscriber
          callback(currentValue);
          return () => stateFlow.unsubscribe(uniqueId);
        },
        
        unsubscribe: (uniqueId: string) => {
          subscribers.delete(uniqueId);
        },
        
        update: (newValue: T) => {
          currentValue = newValue;
          subscribers.forEach((callback) => callback(newValue));
        },
        
        getSubscriberCount: () => {
          return subscribers.size;
        }
      };
      
      this.flows.set(key, stateFlow);
    }
    
    return this.flows.get(key) as StateFlow<T>;
  }

  public get<T>(key: string): StateFlow<T> | undefined {
    return this.flows.get(key) as StateFlow<T> | undefined;
  }

  public has(key: string): boolean {
    return this.flows.has(key);
  }
}

/**
 * Get or create a global StateFlow instance
 * @param key Unique identifier for this StateFlow
 * @param initialValue Initial value for the StateFlow (only used if creating a new instance)
 * @returns A StateFlow instance
 */
export function GlobalStateFlow<T>(key: string, initialValue: T): StateFlow<T> {
  return StateFlowRegistry.getInstance().getOrCreate(key, initialValue);
}

/**
 * React hook to use a global StateFlow
 * @param key Unique identifier for the StateFlow
 * @param initialValue Initial value (only used if creating a new instance)
 * @returns [currentValue, updateFunction]
 */
export function useGlobalStateFlow<T>(
  key: string, 
  initialValue: T
): [T, (newValue: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const flow = GlobalStateFlow(key, initialValue);
  
  useEffect(() => {
    // Subscribe to the flow
    const unsubscribe = flow.subscribe(`hook-${key}-${Math.random()}`, (newValue) => {
      setValue(newValue);
    });
    
    // Initial value sync
    setValue(flow.getValue());
    
    // Cleanup subscription
    return unsubscribe;
  }, [key, initialValue]);
  
  // Return current value and update function
  return [value, (newValue: T) => flow.update(newValue)];
}
