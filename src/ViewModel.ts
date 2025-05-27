// ViewModel.ts
import { StateFlow } from './useStateFlow';
import { SharedFlow } from './useSharedFlow';
import { ViewModelState } from './types';

/**
 * Base ViewModel class that provides state management and event handling
 * Similar to ViewModels in Kotlin Android development
 */
export abstract class ViewModel<TState, TEvent = any> {
  protected stateFlow: StateFlow<ViewModelState<TState>>;
  protected eventsFlow: SharedFlow<TEvent>;
  private isDisposed = false;

  constructor(initialState: TState) {
    // Initialize with loading=false and error=null
    this.stateFlow = StateFlow<ViewModelState<TState>>({
      data: initialState,
      loading: false,
      error: null
    });
    
    this.eventsFlow = SharedFlow<TEvent>();
  }

  /**
   * Get the current state
   */
  getState(): ViewModelState<TState> {
    return this.stateFlow.getValue();
  }

  /**
   * Get the current data
   */
  getData(): TState | null {
    return this.stateFlow.getValue().data;
  }

  /**
   * Subscribe to state changes
   * @param id Unique identifier for this subscription
   * @param callback Function to call when state changes
   */
  subscribeToState(id: string, callback: (state: ViewModelState<TState>) => void): () => void {
    return this.stateFlow.subscribe(id, callback);
  }

  /**
   * Subscribe to events
   * @param id Unique identifier for this subscription
   * @param callback Function to call when an event is emitted
   */
  subscribeToEvents(id: string, callback: (event: TEvent) => void): () => void {
    return this.eventsFlow.subscribe(id, callback);
  }

  /**
   * Set loading state
   * @param isLoading Whether the ViewModel is in a loading state
   */
  protected setLoading(isLoading: boolean): void {
    this.stateFlow.update({
      ...this.stateFlow.getValue(),
      loading: isLoading
    });
  }

  /**
   * Set error state
   * @param error Error message or null to clear error
   */
  protected setError(error: string | null): void {
    this.stateFlow.update({
      ...this.stateFlow.getValue(),
      error
    });
  }

  /**
   * Update the state data
   * @param data New state data
   */
  protected updateData(data: TState | null): void {
    this.stateFlow.update({
      ...this.stateFlow.getValue(),
      data
    });
  }

  /**
   * Update the entire state
   * @param state New state
   */
  protected updateState(state: Partial<ViewModelState<TState>>): void {
    this.stateFlow.update({
      ...this.stateFlow.getValue(),
      ...state
    });
  }

  /**
   * Emit an event
   * @param event Event to emit
   */
  protected emitEvent(event: TEvent): void {
    this.eventsFlow.emit(event);
  }

  /**
   * Dispose of this ViewModel and clean up resources
   */
  dispose(): void {
    if (!this.isDisposed) {
      this.onDispose();
      this.isDisposed = true;
    }
  }

  /**
   * Override this method to clean up resources when the ViewModel is disposed
   */
  protected onDispose(): void {
    // To be overridden by subclasses
  }
}
