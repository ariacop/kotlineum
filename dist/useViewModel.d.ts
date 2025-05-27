import { ViewModel } from './ViewModel';
import { ViewModelState } from './types';
type ViewModelConstructor<T extends ViewModel<any, any>> = new (...args: any[]) => T;
/**
 * React hook to use a ViewModel
 * @param key Unique identifier for this ViewModel
 * @param ViewModelClass ViewModel class constructor
 * @param args Arguments to pass to the ViewModel constructor
 * @returns [state, viewModel]
 */
export declare function useViewModel<TState, TEvent, T extends ViewModel<TState, TEvent>>(key: string, ViewModelClass: ViewModelConstructor<T>, ...args: any[]): [ViewModelState<TState>, T];
/**
 * React hook to use a global ViewModel
 * @param key Unique identifier for this ViewModel
 * @param ViewModelClass ViewModel class constructor
 * @param args Arguments to pass to the ViewModel constructor
 * @returns [state, viewModel]
 */
export declare function useGlobalViewModel<TState, TEvent, T extends ViewModel<TState, TEvent>>(key: string, ViewModelClass: ViewModelConstructor<T>, ...args: any[]): [ViewModelState<TState>, T];
export {};
