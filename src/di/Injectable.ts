import { DIContainer } from './Container';

/**
 * Decorator for classes that can be injected
 * @param options Configuration options for the injectable
 */
export function Injectable(options: InjectableOptions = {}) {
  return function<T extends new (...args: any[]) => any>(target: T) {
    const key = options.token || target.name;
    const singleton = options.singleton !== false; // Default to singleton

    // Register the class with the DI container
    DIContainer.getInstance().registerFactory(
      key,
      () => new target(),
      singleton
    );

    return target;
  };
}

/**
 * Options for the Injectable decorator
 */
export interface InjectableOptions {
  /**
   * Optional token to use instead of class name
   */
  token?: string;
  
  /**
   * Whether the injectable should be a singleton
   * Default: true
   */
  singleton?: boolean;
}

/**
 * Decorator for injecting dependencies into class properties
 * @param token The token of the dependency to inject
 */
export function Inject(token?: string) {
  return function(target: any, propertyKey: string) {
    const injectionToken = token || propertyKey;
    
    // Create a getter for the property
    Object.defineProperty(target, propertyKey, {
      get: function() {
        return DIContainer.getInstance().get(injectionToken);
      },
      enumerable: true,
      configurable: true
    });
  };
}

/**
 * Get a dependency from the container
 * @param token The token of the dependency to get
 * @returns The dependency
 */
export function inject<T>(token: string): T {
  return DIContainer.getInstance().get<T>(token);
}

/**
 * Register a dependency with the container
 * @param token The token to register the dependency under
 * @param instance The instance to register
 */
export function provide<T>(token: string, instance: T): void {
  DIContainer.getInstance().register(token, instance);
}

/**
 * Register a factory function with the container
 * @param token The token to register the factory under
 * @param factory The factory function
 * @param singleton Whether the factory should only be called once
 */
export function provideFactory<T>(token: string, factory: () => T, singleton: boolean = false): void {
  DIContainer.getInstance().registerFactory(token, factory, singleton);
}
