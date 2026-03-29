import { getAuthenticatedUser } from './storage.js';

/**
 * Protects a page so only authenticated users with allowed roles can access it.
 *
 * @param {string[]} allowedRoles - Roles allowed to access the page.
 * @returns {Record<string, unknown>} Authenticated user object.
 */
export function protectRoute(allowedRoles) {
  const authenticatedUser = getAuthenticatedUser();

  if (!authenticatedUser) {
    window.location.href = '../index.html';
    throw new Error('Unauthenticated access blocked.');
  }

  if (!allowedRoles.includes(authenticatedUser.role)) {
    window.location.href = '../index.html';
    throw new Error('Unauthorized access blocked.');
  }

  return authenticatedUser;
}