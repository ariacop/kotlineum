// ViewModelProvider.ts
import { ViewModel } from './ViewModel';

type ViewModelConstructor<T extends ViewModel<any, any>> = new (...args: any[]) => T;

/**
 * Manages ViewModel instances and their lifecycle
 * Similar to ViewModelProvider in Android
 */
export class ViewModelProvider {
  private static instance: ViewModelProvider;
  private viewModels = new Map<string, ViewModel<any, any>>();

  private constructor() {}

  /**
   * Get the singleton instance of ViewModelProvider
   */
  public static getInstance(): ViewModelProvider {
    if (!ViewModelProvider.instance) {
      ViewModelProvider.instance = new ViewModelProvider();
    }
    return ViewModelProvider.instance;
  }

  /**
   * Get or create a ViewModel instance
   * @param key Unique identifier for this ViewModel
   * @param ViewModelClass ViewModel class constructor
   * @param args Arguments to pass to the ViewModel constructor
   * @returns ViewModel instance
   */
  public get<T extends ViewModel<any, any>>(
    key: string,
    ViewModelClass: ViewModelConstructor<T>,
    ...args: any[]
  ): T {
    if (!this.viewModels.has(key)) {
      const instance = new ViewModelClass(...args);
      this.viewModels.set(key, instance);
      return instance;
    }
    return this.viewModels.get(key) as T;
  }

  /**
   * Check if a ViewModel exists
   * @param key Unique identifier for the ViewModel
   * @returns Whether the ViewModel exists
   */
  public has(key: string): boolean {
    return this.viewModels.has(key);
  }

  /**
   * Remove a ViewModel
   * @param key Unique identifier for the ViewModel
   */
  public remove(key: string): void {
    if (this.viewModels.has(key)) {
      const viewModel = this.viewModels.get(key);
      viewModel?.dispose();
      this.viewModels.delete(key);
    }
  }

  /**
   * Clear all ViewModels
   */
  public clear(): void {
    this.viewModels.forEach(viewModel => viewModel.dispose());
    this.viewModels.clear();
  }
}
