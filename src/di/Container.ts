/**
 * Dependency Injection Container
 * A simple, lightweight DI container for managing application dependencies
 */
export class DIContainer {
  private static instance: DIContainer;
  private dependencies = new Map<string, any>();
  private factories = new Map<string, () => any>();
  private singletons = new Set<string>();

  private constructor() {}

  /**
   * Get the singleton instance of the DIContainer
   * @returns The DIContainer instance
   */
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Register an instance with the container
   * @param key The key to register the instance under
   * @param instance The instance to register
   */
  register<T>(key: string, instance: T): void {
    this.dependencies.set(key, instance);
  }

  /**
   * Register a factory function that will be called when the dependency is requested
   * @param key The key to register the factory under
   * @param factory The factory function
   * @param singleton Whether the factory should only be called once (singleton)
   */
  registerFactory<T>(key: string, factory: () => T, singleton: boolean = false): void {
    this.factories.set(key, factory);
    if (singleton) {
      this.singletons.add(key);
    }
  }

  /**
   * Get a dependency from the container
   * @param key The key of the dependency to get
   * @returns The dependency
   * @throws Error if the dependency is not found
   */
  get<T>(key: string): T {
    // Check for direct instance
    if (this.dependencies.has(key)) {
      return this.dependencies.get(key) as T;
    }

    // Check for factory
    if (this.factories.has(key)) {
      const factory = this.factories.get(key)!;
      const instance = factory();

      // If singleton, store the instance for future requests
      if (this.singletons.has(key)) {
        this.dependencies.set(key, instance);
        this.factories.delete(key);
      }

      return instance as T;
    }

    throw new Error(`Dependency ${key} not found`);
  }

  /**
   * Check if a dependency exists in the container
   * @param key The key to check
   * @returns True if the dependency exists
   */
  has(key: string): boolean {
    return this.dependencies.has(key) || this.factories.has(key);
  }

  /**
   * Remove a dependency from the container
   * @param key The key of the dependency to remove
   */
  remove(key: string): void {
    this.dependencies.delete(key);
    this.factories.delete(key);
    this.singletons.delete(key);
  }

  /**
   * Clear all dependencies from the container
   */
  clear(): void {
    this.dependencies.clear();
    this.factories.clear();
    this.singletons.clear();
  }
}
