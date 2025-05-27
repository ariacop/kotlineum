// CounterViewModel.ts
import { ViewModel } from '../../src/ViewModel';

// Define the state type
export interface CounterState {
  count: number;
  lastUpdated: Date | null;
}

// Define event types
export enum CounterEvent {
  INCREMENTED = 'INCREMENTED',
  DECREMENTED = 'DECREMENTED',
  RESET = 'RESET',
  THRESHOLD_REACHED = 'THRESHOLD_REACHED'
}

/**
 * Example ViewModel for a counter
 */
export class CounterViewModel extends ViewModel<CounterState, CounterEvent> {
  private threshold: number;

  constructor(initialCount: number = 0, threshold: number = 10) {
    super({ count: initialCount, lastUpdated: null });
    this.threshold = threshold;
  }

  /**
   * Increment the counter
   */
  increment(): void {
    // Get current data
    const currentState = this.getData();
    if (!currentState) return;

    // Update data
    const newCount = currentState.count + 1;
    this.updateData({
      count: newCount,
      lastUpdated: new Date()
    });

    // Emit events
    this.emitEvent(CounterEvent.INCREMENTED);
    
    // Check if threshold reached
    if (newCount === this.threshold) {
      this.emitEvent(CounterEvent.THRESHOLD_REACHED);
    }
  }

  /**
   * Decrement the counter
   */
  decrement(): void {
    // Get current data
    const currentState = this.getData();
    if (!currentState) return;

    // Update data
    this.updateData({
      count: currentState.count - 1,
      lastUpdated: new Date()
    });

    // Emit event
    this.emitEvent(CounterEvent.DECREMENTED);
  }

  /**
   * Reset the counter
   */
  reset(): void {
    this.updateData({
      count: 0,
      lastUpdated: new Date()
    });

    // Emit event
    this.emitEvent(CounterEvent.RESET);
  }

  /**
   * Simulate an async operation
   */
  async fetchCount(): Promise<void> {
    this.setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate random count from API
      const randomCount = Math.floor(Math.random() * 100);
      
      this.updateData({
        count: randomCount,
        lastUpdated: new Date()
      });
      
      this.setLoading(false);
    } catch (error) {
      this.setError('Failed to fetch count');
      this.setLoading(false);
    }
  }
}
