/**
 * A module for organizing related dependencies
 */
export declare class Module {
    private providers;
    private imports;
    /**
     * Create a new module
     * @param config The module configuration
     */
    constructor(config?: ModuleConfig);
    /**
     * Register all providers in this module and its imports with the DI container
     */
    register(): void;
}
/**
 * Configuration for a module
 */
export interface ModuleConfig {
    /**
     * Providers to register with this module
     */
    providers?: Array<Provider<any>>;
    /**
     * Other modules to import
     */
    imports?: Module[];
}
/**
 * A provider for a dependency
 */
export type Provider<T> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T>;
/**
 * A provider that uses a class constructor
 */
export interface ClassProvider<T> {
    /**
     * The token to provide
     */
    provide: string;
    /**
     * The class to instantiate
     */
    useClass: new (...args: any[]) => T;
    /**
     * Whether the provider should be a singleton
     * Default: true
     */
    singleton?: boolean;
}
/**
 * A provider that uses a factory function
 */
export interface FactoryProvider<T> {
    /**
     * The token to provide
     */
    provide: string;
    /**
     * The factory function to call
     */
    useFactory: () => T;
    /**
     * Whether the provider should be a singleton
     * Default: true
     */
    singleton?: boolean;
}
/**
 * A provider that uses a value
 */
export interface ValueProvider<T> {
    /**
     * The token to provide
     */
    provide: string;
    /**
     * The value to provide
     */
    useValue: T;
}
