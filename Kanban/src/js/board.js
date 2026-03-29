import { protectRoute } from './route-guard.js';
import { clearAuthenticatedUser } from './storage.js';

/**
 * Initializes the Kanban board page.
 *
 * @returns {void}
 */
function initializeBoardPage() {
  const authenticatedUser = protectRoute(['Admin', 'User']);
  const boardWelcomeMessage = document.getElementById('boardWelcomeMessage');
  const logoutButton = document.getElementById('logoutButton');

  boardWelcomeMessage.textContent = `Welcome, ${authenticatedUser.name}.`;

  logoutButton.addEventListener('click', () => {
    clearAuthenticatedUser();
    window.location.href = '../index.html';
  });
}

initializeBoardPage();  