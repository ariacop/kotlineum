/**
 * Decorator for classes that can be injected
 * @param options Configuration options for the injectable
 */
export declare function Injectable(options?: InjectableOptions): <T extends new (...args: any[]) => any>(target: T) => T;
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
export declare function Inject(token?: string): (target: any, propertyKey: string) => void;
/**
 * Get a dependency from the container
 * @param token The token of the dependency to get
 * @returns The dependency
 */
export declare function inject<T>(token: string): T;
/**
 * Register a dependency with the container
 * @param token The token to register the dependency under
 * @param instance The instance to register
 */
export declare function provide<T>(token: string, instance: T): void;
/**
 * Register a factory function with the container
 * @param token The token to register the factory under
 * @param factory The factory function
 * @param singleton Whether the factory should only be called once
 */
export declare function provideFactory<T>(token: string, factory: () => T, singleton?: boolean): void;
