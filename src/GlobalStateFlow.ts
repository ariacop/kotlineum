// GlobalStateFlow.ts
import { useEffect, useState } from 'react';
import { Callback } from './types';
import { StateFlow } from './useStateFlow';

/**
 * Storage type for persistence
 */
export enum StorageType {
  /** Use localStorage (default) */
  LOCAL_STORAGE = 'localStorage',
  /** Use IndexedDB */
  INDEXED_DB = 'indexedDB'
}

/**
 * Options for persistent StateFlow
 */
export interface PersistOptions {
  /** Key to use in storage */
  storageKey?: string;
  /** Whether to enable persistence */
  enabled?: boolean;
  /** Storage type to use (localStorage or indexedDB) */
  storageType?: StorageType;
  /** Database name for IndexedDB (only used with IndexedDB) */
  dbName?: string;
  /** Store name for IndexedDB (only used with IndexedDB) */
  storeName?: string;
  /** Custom serializer function */
  serialize?: (value: any) => string;
  /** Custom deserializer function */
  deserialize?: (value: string) => any;
  /** Debounce time in ms for saving to storage (default: 300) */
  debounceTime?: number;
}

/**
 * Global registry of StateFlow instances
 */
/**
 * Utility for IndexedDB operations
 */
class IndexedDBUtil {
  private static openConnections: Map<string, IDBDatabase> = new Map();
  
  /**
   * Opens a connection to IndexedDB
   */
  static openDatabase(dbName: string, storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      // Reuse existing connection if available
      if (this.openConnections.has(dbName)) {
        resolve(this.openConnections.get(dbName)!);
        return;
      }
      
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this browser'));
        return;
      }
      
      const request = indexedDB.open(dbName, 1);
      
      request.onerror = (event) => {
        reject(new Error(`IndexedDB error: ${(event.target as IDBRequest).error}`));
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest).result as IDBDatabase;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBRequest).result as IDBDatabase;
        // Store the connection for reuse
        this.openConnections.set(dbName, db);
        
        // Handle connection closing on page unload to prevent memory leaks
        window.addEventListener('beforeunload', () => {
          db.close();
          this.openConnections.delete(dbName);
        }, { once: true });
        
        resolve(db);
      };
    });
  }
  
  /**
   * Gets a value from IndexedDB
   */
  static getValue(dbName: string, storeName: string, key: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await this.openDatabase(dbName, storeName);
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Sets a value in IndexedDB
   */
  static setValue(dbName: string, storeName: string, key: string, value: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await this.openDatabase(dbName, storeName);
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value, key);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}

/**
 * Debounce function for performance optimization
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

class StateFlowRegistry {
  private static instance: StateFlowRegistry;
  private flows: Map<string, StateFlow<any>> = new Map();
  private persistOptions: Map<string, PersistOptions> = new Map();
  private debouncedSaveFunctions: Map<string, Function> = new Map();

  private constructor() {}

  public static getInstance(): StateFlowRegistry {
    if (!StateFlowRegistry.instance) {
      StateFlowRegistry.instance = new StateFlowRegistry();
    }
    return StateFlowRegistry.instance;
  }

  public getOrCreate<T>(key: string, initialValue: T, persistOptions?: PersistOptions): StateFlow<T> {
    if (!this.flows.has(key)) {
      const subscribers = new Map<string, Callback<T>>();
      
      // Set up persistence options with defaults
      if (persistOptions?.enabled) {
        const storageKey = persistOptions.storageKey || `kotlineum_state_${key}`;
        const storageType = persistOptions.storageType || StorageType.LOCAL_STORAGE;
        const dbName = persistOptions.dbName || 'kotlineum_db';
        const storeName = persistOptions.storeName || 'kotlineum_store';
        const debounceTime = persistOptions.debounceTime || 300;
        
        this.persistOptions.set(key, {
          storageKey,
          enabled: true,
          storageType,
          dbName,
          storeName,
          debounceTime,
          serialize: persistOptions.serialize || JSON.stringify,
          deserialize: persistOptions.deserialize || JSON.parse
        });
        
        // Create debounced save function for this key
        this.debouncedSaveFunctions.set(
          key,
          debounce((value: T, options: PersistOptions) => this.saveToStorage(key, value, options), debounceTime)
        );
      }
      
      // Try to load initial value from storage if persistence is enabled
      let currentValue = initialValue;
      const options = this.persistOptions.get(key);
      
      if (options?.enabled && typeof window !== 'undefined') {
        this.loadFromStorage<T>(key, options).then(loadedValue => {
          if (loadedValue !== undefined && this.flows.has(key)) {
            const flow = this.flows.get(key) as StateFlow<T>;
            flow.update(loadedValue);
          }
        }).catch(error => {
          console.warn(`Failed to load state from storage for key ${key}:`, error);
        });
      }

      const stateFlow: StateFlow<T> = {
        getValue: () => currentValue,
        
        subscribe: (uniqueId: string, callback: Callback<T>): (() => void) => {
          subscribers.set(uniqueId, callback);
          // Immediately emit current value to new subscriber
          callback(currentValue);
          return () => stateFlow.unsubscribe(uniqueId);
        },
        
        unsubscribe: (uniqueId: string) => {
          subscribers.delete(uniqueId);
        },
        
        update: (newValue: T) => {
          currentValue = newValue;
          subscribers.forEach((callback) => callback(newValue));
          
          // Persist to storage if enabled
          const options = StateFlowRegistry.getInstance().persistOptions.get(key);
          if (options?.enabled && typeof window !== 'undefined') {
            // Use debounced save function for better performance
            const debouncedSave = StateFlowRegistry.getInstance().debouncedSaveFunctions.get(key);
            if (debouncedSave) {
              debouncedSave(newValue, options);
            }
          }
        },
        
        getSubscriberCount: () => {
          return subscribers.size;
        }
      };
      
      this.flows.set(key, stateFlow);
    }
    
    return this.flows.get(key) as StateFlow<T>;
  }

  public get<T>(key: string): StateFlow<T> | undefined {
    return this.flows.get(key) as StateFlow<T> | undefined;
  }

  public has(key: string): boolean {
    return this.flows.has(key);
  }
  
  /**
   * Save state to the appropriate storage
   */
  private saveToStorage<T>(key: string, value: T, options: PersistOptions): void {
    try {
      if (options.storageType === StorageType.INDEXED_DB) {
        // Save to IndexedDB
        const serialized = options.serialize!(value);
        IndexedDBUtil.setValue(options.dbName!, options.storeName!, options.storageKey!, serialized)
          .catch(error => {
            console.warn(`Failed to persist state to IndexedDB for key ${key}:`, error);
          });
      } else {
        // Save to localStorage (default)
        const serialized = options.serialize!(value);
        localStorage.setItem(options.storageKey!, serialized);
      }
    } catch (error) {
      console.warn(`Failed to persist state to storage for key ${key}:`, error);
    }
  }
  
  /**
   * Load state from the appropriate storage
   */
  private async loadFromStorage<T>(key: string, options: PersistOptions): Promise<T | undefined> {
    try {
      if (options.storageType === StorageType.INDEXED_DB) {
        // Load from IndexedDB
        const value = await IndexedDBUtil.getValue(options.dbName!, options.storeName!, options.storageKey!);
        if (value) {
          return options.deserialize!(value);
        }
      } else {
        // Load from localStorage (default)
        const storedValue = localStorage.getItem(options.storageKey!);
        if (storedValue) {
          return options.deserialize!(storedValue);
        }
      }
    } catch (error) {
      throw error;
    }
    return undefined;
  }
}

/**
 * Get or create a global StateFlow instance
 * @param key Unique identifier for this StateFlow
 * @param initialValue Initial value for the StateFlow (only used if creating a new instance)
 * @param persistOptions Options for persisting the state to localStorage
 * @returns A StateFlow instance
 */
export function GlobalStateFlow<T>(key: string, initialValue: T, persistOptions?: PersistOptions): StateFlow<T> {
  return StateFlowRegistry.getInstance().getOrCreate(key, initialValue, persistOptions);
}

/**
 * React hook to use a global StateFlow
 * @param key Unique identifier for the StateFlow
 * @param initialValue Initial value (only used if creating a new instance)
 * @param persistOptions Options for persisting the state to localStorage
 * @returns [currentValue, updateFunction]
 */
export function useGlobalStateFlow<T>(
  key: string, 
  initialValue: T,
  persistOptions?: PersistOptions
): [T, (newValue: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const flow = GlobalStateFlow(key, initialValue, persistOptions);
  
  useEffect(() => {
    // Subscribe to the flow
    const unsubscribe = flow.subscribe(`hook-${key}-${Math.random()}`, (newValue) => {
      setValue(newValue);
    });
    
    // Initial value sync
    setValue(flow.getValue());
    
    // Cleanup subscription
    return unsubscribe;
  }, [key, initialValue]);
  
  // Return current value and update function
  return [value, (newValue: T) => flow.update(newValue)];
}
