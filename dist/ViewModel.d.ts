import { StateFlow } from './useStateFlow';
import { SharedFlow } from './useSharedFlow';
import { ViewModelState } from './types';
/**
 * Base ViewModel class that provides state management and event handling
 * Similar to ViewModels in Kotlin Android development
 */
export declare abstract class ViewModel<TState, TEvent = any> {
    protected stateFlow: StateFlow<ViewModelState<TState>>;
    protected eventsFlow: SharedFlow<TEvent>;
    private isDisposed;
    constructor(initialState: TState);
    /**
     * Get the current state
     */
    getState(): ViewModelState<TState>;
    /**
     * Get the current data
     */
    getData(): TState | null;
    /**
     * Subscribe to state changes
     * @param id Unique identifier for this subscription
     * @param callback Function to call when state changes
     */
    subscribeToState(id: string, callback: (state: ViewModelState<TState>) => void): () => void;
    /**
     * Subscribe to events
     * @param id Unique identifier for this subscription
     * @param callback Function to call when an event is emitted
     */
    subscribeToEvents(id: string, callback: (event: TEvent) => void): () => void;
    /**
     * Set loading state
     * @param isLoading Whether the ViewModel is in a loading state
     */
    protected setLoading(isLoading: boolean): void;
    /**
     * Set error state
     * @param error Error message or null to clear error
     */
    protected setError(error: string | null): void;
    /**
     * Update the state data
     * @param data New state data
     */
    protected updateData(data: TState | null): void;
    /**
     * Update the entire state
     * @param state New state
     */
    protected updateState(state: Partial<ViewModelState<TState>>): void;
    /**
     * Emit an event
     * @param event Event to emit
     */
    protected emitEvent(event: TEvent): void;
    /**
     * Dispose of this ViewModel and clean up resources
     */
    dispose(): void;
    /**
     * Override this method to clean up resources when the ViewModel is disposed
     */
    protected onDispose(): void;
}
