/**
 * Dependency Injection Container
 * A simple, lightweight DI container for managing application dependencies
 */
export declare class DIContainer {
    private static instance;
    private dependencies;
    private factories;
    private singletons;
    private constructor();
    /**
     * Get the singleton instance of the DIContainer
     * @returns The DIContainer instance
     */
    static getInstance(): DIContainer;
    /**
     * Register an instance with the container
     * @param key The key to register the instance under
     * @param instance The instance to register
     */
    register<T>(key: string, instance: T): void;
    /**
     * Register a factory function that will be called when the dependency is requested
     * @param key The key to register the factory under
     * @param factory The factory function
     * @param singleton Whether the factory should only be called once (singleton)
     */
    registerFactory<T>(key: string, factory: () => T, singleton?: boolean): void;
    /**
     * Get a dependency from the container
     * @param key The key of the dependency to get
     * @returns The dependency
     * @throws Error if the dependency is not found
     */
    get<T>(key: string): T;
    /**
     * Check if a dependency exists in the container
     * @param key The key to check
     * @returns True if the dependency exists
     */
    has(key: string): boolean;
    /**
     * Remove a dependency from the container
     * @param key The key of the dependency to remove
     */
    remove(key: string): void;
    /**
     * Clear all dependencies from the container
     */
    clear(): void;
    /**
     * Resolve a dependency by token
     * @param token The token of the dependency to resolve
     * @returns The resolved dependency
     */
    resolve<T>(token: string): T;
}
