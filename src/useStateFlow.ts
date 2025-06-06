// useStateFlow.ts
import { useRef, useState } from 'react';
import { Callback } from './types';
import Logger from './logger';
import { StateFlowEvent, StateFlowEventType } from './GlobalStateFlow';

/**
 * Interface for StateFlow event subscriber
 */
export type StateFlowEventCallback<T> = (event: StateFlowEvent<T>) => void;

/**
 * Interface for StateFlow
 */
export interface StateFlow<T> {
  getValue: () => T;
  subscribe: (uniqueId: string, callback: Callback<T>) => () => void;
  unsubscribe: (uniqueId: string) => void;
  update: (newValue: T) => void;
  getSubscriberCount: () => number;
  dispose: () => void;
  subscribeToEvents?: (uniqueId: string, callback: StateFlowEventCallback<T>) => () => void;
  emitEvent?: (event: StateFlowEvent<T>) => void;
}

/**
 * Creates a local StateFlow instance
 * @param initialValue Initial value for the StateFlow
 * @returns A StateFlow instance
 */
export function StateFlow<T>(initialValue: T, options?: { emitEvents?: boolean }): StateFlow<T> {
  const subscribersRef = { current: new Map<string, Callback<T>>() };
  const eventSubscribersRef = { current: new Map<string, StateFlowEventCallback<T>>() };
  let currentValue = initialValue;
  const emitEvents = options?.emitEvents !== false;
  
  const stateFlow: StateFlow<T> = {
    getValue: () => currentValue,
    
    subscribe: (uniqueId: string, callback: Callback<T>): (() => void) => {
      subscribersRef.current.set(uniqueId, callback);
      // Immediately emit current value to new subscriber
      callback(currentValue);
      
      // Log subscription
      Logger.debug(`New subscription to StateFlow with ID: ${uniqueId}`);
      
      return () => stateFlow.unsubscribe(uniqueId);
    },
    
    unsubscribe: (uniqueId: string) => {
      subscribersRef.current.delete(uniqueId);
      Logger.debug(`Unsubscribed from StateFlow with ID: ${uniqueId}`);
    },
    
    update: (newValue: T) => {
      const oldValue = currentValue;
      currentValue = newValue;
      
      // Notify all subscribers
      subscribersRef.current.forEach((callback) => {
        try {
          callback(newValue);
        } catch (e) {
          Logger.error('Error in StateFlow subscriber:', e);
        }
      });
      
      // Emit value updated event
      if (emitEvents && stateFlow.emitEvent) {
        stateFlow.emitEvent({
          type: StateFlowEventType.VALUE_UPDATED,
          key: 'stateflow',
          value: newValue,
          timestamp: Date.now()
        });
      }
    },
    
    getSubscriberCount: () => {
      return subscribersRef.current.size;
    },
    
    dispose: () => {
      // Clear all subscribers
      subscribersRef.current.clear();
      
      // Clear event subscribers
      eventSubscribersRef.current.clear();
      
      Logger.debug('StateFlow disposed');
    },
    
    subscribeToEvents: (uniqueId: string, callback: StateFlowEventCallback<T>): (() => void) => {
      eventSubscribersRef.current.set(uniqueId, callback);
      Logger.debug(`New event subscription to StateFlow with ID: ${uniqueId}`);
      
      return () => {
        eventSubscribersRef.current.delete(uniqueId);
        Logger.debug(`Unsubscribed from StateFlow events with ID: ${uniqueId}`);
      };
    },
    
    emitEvent: (event: StateFlowEvent<T>): void => {
      eventSubscribersRef.current.forEach(callback => {
        try {
          callback(event);
        } catch (e) {
          Logger.error('Error in StateFlow event subscriber:', e);
        }
      });
    }
  };
  
  return stateFlow;
}

/**
 * React hook to use a StateFlow within a component
 * @param initialValue Initial value for the StateFlow
 * @returns [currentValue, updateFunction] and StateFlow methods
 */
export function useStateFlow<T>(initialValue: T, options?: { emitEvents?: boolean }): StateFlow<T> & [T, (newValue: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const subscribersRef = useRef<Map<string, Callback<T>>>(new Map());
  const eventSubscribersRef = useRef<Map<string, StateFlowEventCallback<T>>>(new Map());
  const emitEvents = options?.emitEvents !== false;
  
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
      Logger.debug(`Unsubscribed from StateFlow hook with ID: ${uniqueId}`);
    },
    
    update: (newValue: T) => {
      setState(newValue);
      
      // Notify all subscribers
      subscribersRef.current.forEach((callback) => {
        try {
          callback(newValue);
        } catch (e) {
          Logger.error('Error in StateFlow subscriber:', e);
        }
      });
      
      // Emit value updated event
      if (emitEvents && stateFlow.emitEvent) {
        stateFlow.emitEvent({
          type: StateFlowEventType.VALUE_UPDATED,
          key: 'stateflow-hook',
          value: newValue,
          timestamp: Date.now()
        });
      }
    },
    
    getSubscriberCount: () => {
      return subscribersRef.current.size;
    },
    
    dispose: () => {
      // Clear all subscribers
      subscribersRef.current.clear();
      
      // Clear event subscribers
      eventSubscribersRef.current.clear();
      
      Logger.debug('StateFlow hook disposed');
    },
    
    subscribeToEvents: (uniqueId: string, callback: StateFlowEventCallback<T>): (() => void) => {
      eventSubscribersRef.current.set(uniqueId, callback);
      Logger.debug(`New event subscription to StateFlow hook with ID: ${uniqueId}`);
      
      return () => {
        eventSubscribersRef.current.delete(uniqueId);
        Logger.debug(`Unsubscribed from StateFlow hook events with ID: ${uniqueId}`);
      };
    },
    
    emitEvent: (event: StateFlowEvent<T>): void => {
      eventSubscribersRef.current.forEach(callback => {
        try {
          callback(event);
        } catch (e) {
          Logger.error('Error in StateFlow hook event subscriber:', e);
        }
      });
    }
  };
  
  // Create a tuple-like array with the state and update function
  const result = [state, stateFlow.update] as [T, (newValue: T) => void];
  
  // Add all StateFlow properties to the result array
  Object.assign(result, stateFlow);
  
  return result as StateFlow<T> & [T, (newValue: T) => void];
}
