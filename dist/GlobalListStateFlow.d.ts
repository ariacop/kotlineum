import { ListStateFlow, ListStateFlowOptions } from './ListStateFlow';
/**
 * Create a global ListStateFlow instance
 * @param key Unique identifier for this ListStateFlow
 * @param initialItems Initial items for the ListStateFlow (only used if creating a new instance)
 * @param options Configuration options for the ListStateFlow
 * @returns A ListStateFlow instance
 */
export declare function GlobalListStateFlow<T extends Record<string | number | symbol, any>>(key: string, initialItems?: T[], options?: ListStateFlowOptions<T>): ListStateFlow<T>;
