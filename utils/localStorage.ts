/**
 * Safe localStorage utilities with JSON parsing and fallback defaults
 */

// ============================================================================
// Types
// ============================================================================

type StorageValue = string | number | boolean | object | null;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if we're running in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Safely parse JSON with fallback
 */
function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely stringify value for storage
 */
function safeJsonStringify(value: StorageValue): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Load a value from localStorage
 * 
 * @param key - The storage key
 * @param defaultValue - Fallback value if key doesn't exist or parsing fails
 * @returns The stored value or default
 * 
 * @example
 * const user = load('user', { name: 'Guest' });
 * const count = load('count', 0);
 * const isEnabled = load('feature-flag', false);
 */
export function load<T extends StorageValue>(key: string, defaultValue: T): T {
  if (!isBrowser()) {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    
    if (item === null) {
      return defaultValue;
    }

    // Handle primitive string values that weren't JSON stringified
    if (typeof defaultValue === "string") {
      // Check if it looks like JSON
      if (item.startsWith('"') || item.startsWith("{") || item.startsWith("[")) {
        return safeJsonParse(item, defaultValue);
      }
      return item as T;
    }

    return safeJsonParse(item, defaultValue);
  } catch (error) {
    console.warn(`[localStorage] Error loading key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Save a value to localStorage
 * 
 * @param key - The storage key
 * @param value - The value to store (will be JSON stringified)
 * @returns true if successful, false otherwise
 * 
 * @example
 * save('user', { name: 'John', id: 123 });
 * save('count', 42);
 * save('theme', 'dark');
 */
export function save<T extends StorageValue>(key: string, value: T): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const serialized = safeJsonStringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`[localStorage] Error saving key "${key}":`, error);
    
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("[localStorage] Storage quota exceeded");
    }
    
    return false;
  }
}

/**
 * Remove a value from localStorage
 * 
 * @param key - The storage key to remove
 * @returns true if successful, false otherwise
 * 
 * @example
 * remove('user');
 */
export function remove(key: string): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[localStorage] Error removing key "${key}":`, error);
    return false;
  }
}

/**
 * Check if a key exists in localStorage
 * 
 * @param key - The storage key to check
 * @returns true if key exists, false otherwise
 * 
 * @example
 * if (exists('user')) {
 *   // Load user data
 * }
 */
export function exists(key: string): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    return window.localStorage.getItem(key) !== null;
  } catch (error) {
    console.warn(`[localStorage] Error checking key "${key}":`, error);
    return false;
  }
}

// ============================================================================
// Extended Functions
// ============================================================================

/**
 * Load a value, and if it doesn't exist, save and return the default
 * 
 * @param key - The storage key
 * @param defaultValue - Value to save if key doesn't exist
 * @returns The stored or default value
 * 
 * @example
 * const settings = loadOrCreate('settings', { volume: 50, muted: false });
 */
export function loadOrCreate<T extends StorageValue>(key: string, defaultValue: T): T {
  if (exists(key)) {
    return load(key, defaultValue);
  }
  
  save(key, defaultValue);
  return defaultValue;
}

/**
 * Update a stored object by merging with new values
 * 
 * @param key - The storage key
 * @param updates - Partial object to merge
 * @param defaultValue - Default if key doesn't exist
 * @returns The updated object
 * 
 * @example
 * update('settings', { volume: 75 }, { volume: 50, muted: false });
 */
export function update<T extends object>(
  key: string,
  updates: Partial<T>,
  defaultValue: T
): T {
  const current = load(key, defaultValue);
  const updated = { ...current, ...updates };
  save(key, updated);
  return updated;
}

/**
 * Clear all localStorage data
 * 
 * @returns true if successful, false otherwise
 */
export function clearAll(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.clear();
    return true;
  } catch (error) {
    console.warn("[localStorage] Error clearing storage:", error);
    return false;
  }
}

/**
 * Get all keys in localStorage
 * 
 * @returns Array of keys
 */
export function getAllKeys(): string[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key !== null) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    console.warn("[localStorage] Error getting keys:", error);
    return [];
  }
}

/**
 * Get the approximate size of localStorage usage in bytes
 * 
 * @returns Size in bytes, or -1 if unable to calculate
 */
export function getStorageSize(): number {
  if (!isBrowser()) {
    return -1;
  }

  try {
    let total = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key !== null) {
        const value = window.localStorage.getItem(key);
        if (value !== null) {
          // Each character is 2 bytes in JavaScript (UTF-16)
          total += (key.length + value.length) * 2;
        }
      }
    }
    return total;
  } catch (error) {
    console.warn("[localStorage] Error calculating size:", error);
    return -1;
  }
}

// ============================================================================
// Typed Storage Factory
// ============================================================================

/**
 * Create a typed storage accessor for a specific key
 * 
 * @param key - The storage key
 * @param defaultValue - Default value
 * @returns Object with get, set, remove, and exists methods
 * 
 * @example
 * const userStorage = createStorage('user', { name: '', email: '' });
 * userStorage.set({ name: 'John', email: 'john@example.com' });
 * const user = userStorage.get();
 * userStorage.remove();
 */
export function createStorage<T extends StorageValue>(key: string, defaultValue: T) {
  return {
    get: () => load(key, defaultValue),
    set: (value: T) => save(key, value),
    remove: () => remove(key),
    exists: () => exists(key),
    update: (updates: T extends object ? Partial<T> : never) =>
      update(key, updates as Partial<T & object>, defaultValue as T & object),
  };
}

