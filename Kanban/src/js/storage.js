import { AUTH_STORAGE_KEY } from './config.js';

/**
 * Saves the authenticated user in localStorage.
 *
 * @param {Record<string, unknown>} user - Authenticated user object.
 * @returns {void}
 */
export function saveAuthenticatedUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Reads the authenticated user from localStorage.
 *
 * @returns {Record<string, unknown> | null} Stored user object or null.
 */
export function getAuthenticatedUser() {
  const storedValue = localStorage.getItem(AUTH_STORAGE_KEY);
  return storedValue ? JSON.parse(storedValue) : null;
}

/**
 * Removes the authenticated user from localStorage.
 *
 * @returns {void}
 */
export function clearAuthenticatedUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}