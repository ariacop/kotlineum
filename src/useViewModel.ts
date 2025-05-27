// useViewModel.ts
import { useState, useEffect, useRef } from 'react';
import { ViewModel } from './ViewModel';
import { ViewModelProvider } from './ViewModelProvider';
import { ViewModelState } from './types';

type ViewModelConstructor<T extends ViewModel<any, any>> = new (...args: any[]) => T;

/**
 * React hook to use a ViewModel
 * @param key Unique identifier for this ViewModel
 * @param ViewModelClass ViewModel class constructor
 * @param args Arguments to pass to the ViewModel constructor
 * @returns [state, viewModel]
 */
export function useViewModel<TState, TEvent, T extends ViewModel<TState, TEvent>>(
  key: string,
  ViewModelClass: ViewModelConstructor<T>,
  ...args: any[]
): [ViewModelState<TState>, T] {
  // Get or create the ViewModel instance
  const provider = ViewModelProvider.getInstance();
  const viewModel = provider.get<T>(key, ViewModelClass, ...args);
  
  // Track the current state
  const [state, setState] = useState<ViewModelState<TState>>(viewModel.getState());
  
  // Generate a unique ID for this component instance
  const idRef = useRef(`vm-${key}-${Math.random()}`);
  
  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = viewModel.subscribeToState(idRef.current, setState);
    
    // Cleanup subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [viewModel]);
  
  return [state, viewModel as T];
}

/**
 * React hook to use a global ViewModel
 * @param key Unique identifier for this ViewModel
 * @param ViewModelClass ViewModel class constructor
 * @param args Arguments to pass to the ViewModel constructor
 * @returns [state, viewModel]
 */
export function useGlobalViewModel<TState, TEvent, T extends ViewModel<TState, TEvent>>(
  key: string,
  ViewModelClass: ViewModelConstructor<T>,
  ...args: any[]
): [ViewModelState<TState>, T] {
  // Use a global key for the ViewModel
  const globalKey = `global-${key}`;
  return useViewModel<TState, TEvent, T>(globalKey, ViewModelClass, ...args);
}
