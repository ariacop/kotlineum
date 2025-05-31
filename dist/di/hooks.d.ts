/// <reference types="react" />
/**
 * React hook for using a dependency from the DI container
 * @param token The token of the dependency to use
 * @returns The dependency
 */
export declare function useDependency<T>(token: string): T;
/**
 * React hook for providing a dependency to the DI container
 * @param token The token to register the dependency under
 * @param factory Factory function that creates the dependency
 * @param deps Dependencies array for the factory function
 * @returns The created dependency
 */
export declare function useProvider<T>(token: string, factory: () => T, deps?: React.DependencyList): T;
