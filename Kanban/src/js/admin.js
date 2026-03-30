import { protectRoute } from './route-guard.js';
import { clearAuthenticatedUser } from './storage.js';

/**
 * Initializes the admin dashboard page.
 *
 * @returns {void}
 */
function initializeAdminPage() {
  const authenticatedUser = protectRoute(['Admin']);
  const adminWelcomeMessage = document.getElementById('adminWelcomeMessage');
  const logoutButton = document.getElementById('logoutButton');

  adminWelcomeMessage.textContent = `Welcome, ${authenticatedUser.name}.`;

  logoutButton.addEventListener('click', () => {
    clearAuthenticatedUser();
    window.location.href = '../index.html';
  });
}

initializeAdminPage();