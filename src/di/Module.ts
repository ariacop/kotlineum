import { DIContainer } from './Container';

/**
 * A module for organizing related dependencies
 */
export class Module {
  private providers: Array<Provider<any>> = [];
  private imports: Module[] = [];

  /**
   * Create a new module
   * @param config The module configuration
   */
  constructor(config: ModuleConfig = {}) {
    if (config.providers) {
      this.providers = config.providers;
    }
    
    if (config.imports) {
      this.imports = config.imports;
    }
  }

  /**
   * Register all providers in this module and its imports with the DI container
   */
  register(): void {
    const container = DIContainer.getInstance();
    
    // Register imported modules first
    for (const importedModule of this.imports) {
      importedModule.register();
    }
    
    // Then register this module's providers
    for (const provider of this.providers) {
      if ('useClass' in provider) {
        container.registerFactory(
          provider.provide,
          () => new provider.useClass(),
          provider.singleton !== false
        );
      } else if ('useFactory' in provider) {
        container.registerFactory(
          provider.provide,
          provider.useFactory,
          provider.singleton !== false
        );
      } else if ('useValue' in provider) {
        container.register(provider.provide, provider.useValue);
      }
    }
  }
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
