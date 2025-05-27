import { ViewModel } from './ViewModel';
type ViewModelConstructor<T extends ViewModel<any, any>> = new (...args: any[]) => T;
/**
 * Manages ViewModel instances and their lifecycle
 * Similar to ViewModelProvider in Android
 */
export declare class ViewModelProvider {
    private static instance;
    private viewModels;
    private constructor();
    /**
     * Get the singleton instance of ViewModelProvider
     */
    static getInstance(): ViewModelProvider;
    /**
     * Get or create a ViewModel instance
     * @param key Unique identifier for this ViewModel
     * @param ViewModelClass ViewModel class constructor
     * @param args Arguments to pass to the ViewModel constructor
     * @returns ViewModel instance
     */
    get<T extends ViewModel<any, any>>(key: string, ViewModelClass: ViewModelConstructor<T>, ...args: any[]): T;
    /**
     * Check if a ViewModel exists
     * @param key Unique identifier for the ViewModel
     * @returns Whether the ViewModel exists
     */
    has(key: string): boolean;
    /**
     * Remove a ViewModel
     * @param key Unique identifier for the ViewModel
     */
    remove(key: string): void;
    /**
     * Clear all ViewModels
     */
    clear(): void;
}
export {};
