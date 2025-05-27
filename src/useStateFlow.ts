// useStateFlow.ts
import { useRef, useState } from 'react';
import { Callback } from './types';

/**
 * Interface for StateFlow
 */
export interface StateFlow<T> {
  getValue: () => T;
  subscribe: (uniqueId: string, callback: Callback<T>) => () => void;
  unsubscribe: (uniqueId: string) => void;
  update: (newValue: T) => void;
  getSubscriberCount: () => number;
}

/**
 * Creates a local StateFlow instance
 * @param initialValue Initial value for the StateFlow
 * @returns A StateFlow instance
 */
export function StateFlow<T>(initialValue: T): StateFlow<T> {
  const subscribersRef = { current: new Map<string, Callback<T>>() };
  let currentValue = initialValue;
  
  const stateFlow: StateFlow<T> = {
    getValue: () => currentValue,
    
    subscribe: (uniqueId: string, callback: Callback<T>): (() => void) => {
      subscribersRef.current.set(uniqueId, callback);
      // Immediately emit current value to new subscriber
      callback(currentValue);
      return () => stateFlow.unsubscribe(uniqueId);
    },
    
    unsubscribe: (uniqueId: string) => {
      subscribersRef.current.delete(uniqueId);
    },
    
    update: (newValue: T) => {
      currentValue = newValue;
      subscribersRef.current.forEach((callback) => callback(newValue));
    },
    
    getSubscriberCount: () => {
      return subscribersRef.current.size;
    }
  };
  
  return stateFlow;
}

/**
 * React hook to use a StateFlow within a component
 * @param initialValue Initial value for the StateFlow
 * @returns [currentValue, updateFunction] and StateFlow methods
 */
export function useStateFlow<T>(initialValue: T): StateFlow<T> & [T, (newValue: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const subscribersRef = useRef<Map<string, Callback<T>>>(new Map());
  
  const stateFlow: StateFlow<T> = {
    getValue: () => state,
    
    subscribe: (uniqueId: string, callback: Callback<T>): (() => void) => {
      subscribersRef.current.set(uniqueId, callback);
      // Immediately emit current value to new subscriber
      callback(state);
      return () => stateFlow.unsubscribe(uniqueId);
    },
    
    unsubscribe: (uniqueId: string) => {
      subscribersRef.current.delete(uniqueId);
    },
    
    update: (newValue: T) => {
      setState(newValue);
      subscribersRef.current.forEach((callback) => callback(newValue));
    },
    
    getSubscriberCount: () => {
      return subscribersRef.current.size;
    }
  };
  
  // Create a tuple-like array with the state and update function
  const result = [state, stateFlow.update] as [T, (newValue: T) => void];
  
  // Add all StateFlow properties to the result array
  Object.assign(result, stateFlow);
  
  return result as StateFlow<T> & [T, (newValue: T) => void];
}
