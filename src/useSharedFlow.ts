// useSharedFlow.ts
import { useRef, useState } from 'react';
import { Callback } from './types';

/**
 * Interface for SharedFlow
 * Similar to Kotlin's SharedFlow, this provides a way to emit values to multiple subscribers
 * without maintaining a current state value
 */
export interface SharedFlow<T> {
  subscribe: (uniqueId: string, callback: Callback<T>) => () => void;
  unsubscribe: (uniqueId: string) => void;
  emit: (value: T) => void;
  getSubscriberCount: () => number;
}

/**
 * Creates a local SharedFlow instance
 * @returns A SharedFlow instance
 */
export function SharedFlow<T>(): SharedFlow<T> {
  const subscribersRef = { current: new Map<string, Callback<T>>() };
  
  const sharedFlow: SharedFlow<T> = {
    subscribe: (uniqueId: string, callback: Callback<T>): (() => void) => {
      subscribersRef.current.set(uniqueId, callback);
      return () => sharedFlow.unsubscribe(uniqueId);
    },
    
    unsubscribe: (uniqueId: string) => {
      subscribersRef.current.delete(uniqueId);
    },
    
    emit: (value: T) => {
      subscribersRef.current.forEach((callback) => callback(value));
    },
    
    getSubscriberCount: () => {
      return subscribersRef.current.size;
    }
  };
  
  return sharedFlow;
}

/**
 * React hook to use a SharedFlow within a component
 * @returns A SharedFlow instance and utility functions
 */
export function useSharedFlow<T>(): SharedFlow<T> & [(value: T) => void, (callback: Callback<T>) => () => void] {
  const subscribersRef = useRef<Map<string, Callback<T>>>(new Map());
  
  const sharedFlow: SharedFlow<T> = {
    subscribe: (uniqueId: string, callback: Callback<T>): (() => void) => {
      subscribersRef.current.set(uniqueId, callback);
      return () => sharedFlow.unsubscribe(uniqueId);
    },
    
    unsubscribe: (uniqueId: string) => {
      subscribersRef.current.delete(uniqueId);
    },
    
    emit: (value: T) => {
      subscribersRef.current.forEach((callback) => callback(value));
    },
    
    getSubscriberCount: () => {
      return subscribersRef.current.size;
    }
  };
  
  // Function to emit a value to the flow
  const emit = (value: T) => sharedFlow.emit(value);
  
  // Function to subscribe to the flow with a custom callback
  const subscribe = (callback: Callback<T>) => {
    const uniqueId = `sub-${Math.random()}`;
    return sharedFlow.subscribe(uniqueId, callback);
  };
  
  // Create a tuple-like array with the emit and subscribe functions
  const result = [emit, subscribe] as [(value: T) => void, (callback: Callback<T>) => () => void];
  
  // Add all SharedFlow properties to the result array
  Object.assign(result, sharedFlow);
  
  return result as SharedFlow<T> & [(value: T) => void, (callback: Callback<T>) => () => void];
}

/**
 * Hook to create a SharedFlow and get the latest emitted value
 * @param initialState Optional initial state
 * @returns [latestValue, emitFunction, subscribeFunction]
 */
export function useSharedFlowWithState<T>(initialState?: T): [T | undefined, (value: T) => void, (callback: Callback<T>) => () => void] {
  const [latestValue, setLatestValue] = useState<T | undefined>(initialState);
  const flow = useSharedFlow<T>();
  
  // Subscribe to our own flow to update the state
  useRef(() => {
    flow.subscribe('internal-state', (value: T) => setLatestValue(value));
  }).current();
  
  return [latestValue, flow.emit, (callback: Callback<T>) => flow.subscribe(`sub-${Math.random()}`, callback)];
}
