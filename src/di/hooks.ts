import { useEffect, useState } from 'react';
import { DIContainer } from './Container';

/**
 * React hook for using a dependency from the DI container
 * @param token The token of the dependency to use
 * @returns The dependency
 */
export function useDependency<T>(token: string): T {
  const [dependency, setDependency] = useState<T>(() => {
    return DIContainer.getInstance().get<T>(token);
  });

  // This effect ensures that if the dependency changes in the container,
  // the component will re-render with the new dependency
  useEffect(() => {
    const container = DIContainer.getInstance();
    const currentDep = container.get<T>(token);
    
    if (currentDep !== dependency) {
      setDependency(currentDep);
    }
  }, [token, dependency]);

  return dependency;
}

/**
 * React hook for providing a dependency to the DI container
 * @param token The token to register the dependency under
 * @param factory Factory function that creates the dependency
 * @param deps Dependencies array for the factory function
 * @returns The created dependency
 */
export function useProvider<T>(
  token: string, 
  factory: () => T, 
  deps: React.DependencyList = []
): T {
  const [instance, setInstance] = useState<T>(() => {
    const newInstance = factory();
    DIContainer.getInstance().register(token, newInstance);
    return newInstance;
  });

  useEffect(() => {
    const newInstance = factory();
    DIContainer.getInstance().register(token, newInstance);
    setInstance(newInstance);
    
    // Clean up when the component unmounts or deps change
    return () => {
      DIContainer.getInstance().remove(token);
    };
  }, deps);

  return instance;
}
