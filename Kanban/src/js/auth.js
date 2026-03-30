import { getJson, postJson } from './api.js';
import { getAuthenticatedUser, saveAuthenticatedUser } from './storage.js';

const loginTabButton = document.getElementById('loginTabButton');
const registerTabButton = document.getElementById('registerTabButton');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const globalMessage = document.getElementById('globalMessage');

/**
 * Toggles between login and registration views.
 *
 * @param {'login' | 'register'} activeTab - The active tab name.
 * @returns {void}
 */
function switchAuthTab(activeTab) {
  const isLoginTab = activeTab === 'login'; 

  loginForm.classList.toggle('hidden', !isLoginTab);
  registerForm.classList.toggle('hidden', isLoginTab);

  loginTabButton.className = isLoginTab
    ? 'flex-1 rounded-lg bg-white px-4 py-3 text-sm font-semibold shadow-sm'
    : 'flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-slate-600';

  registerTabButton.className = !isLoginTab
    ? 'flex-1 rounded-lg bg-white px-4 py-3 text-sm font-semibold shadow-sm'
    : 'flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-slate-600';

  clearMessage();
}

/**
 * Displays a global feedback message above the forms.(Helper function.)
 *
 * @param {string} message - Text displayed to the user.
 * @param {'success' | 'error'} type - Visual state for the message.
 * @returns {void}
 */
function showMessage(message, type) {
  globalMessage.textContent = message;
  globalMessage.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');

  if (type === 'success') {
    globalMessage.classList.add('bg-green-100', 'text-green-700');
  } else {
    globalMessage.classList.add('bg-red-100', 'text-red-700');
  }
}

/**
 * Hides the current global feedback message.(Helper function)
 *
 * @returns {void}
 */
function clearMessage() {
  globalMessage.textContent = '';
  globalMessage.classList.add('hidden');
}

/**
 * Redirects the authenticated user according to their role.
 *
 * @param {{ role: string }} user - Authenticated user object.
 * @returns {void}
 */
function redirectUserByRole(user) {
  if (user.role === 'Admin') {
    window.location.href = './pages/admin.html';
    return;
  }

  window.location.href = './pages/board.html';
}

/**
 * Validates registration input values.
 *
 * @param {string} name - Full name.
 * @param {string} email - Email address.
 * @param {string} password - Plain-text password.
 * @param {string} role - Selected role.
 * @returns {string | null} Error message when invalid, otherwise null.
 */
function validateRegistrationInput(name, email, password, role) {
  const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  if (!name.trim()) {
    return 'Name is required.';
  }

  if (!email.trim()) {
    return 'Email is required.';
  }

  if (!strongPasswordPattern.test(password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
  }

  if (!role) {
    return 'Role selection is required.';
  }

  if (!['Admin', 'User'].includes(role)) {
    return 'Please select a valid role.';
  }

  return null;
}

/**
 * Fetches the next available user ID from the users collection.
 *
 * @returns {Promise<number>} Next user ID value.
 */
async function getNextUserId() {
  const users = await getJson('/users');
  const maxUserId = users.reduce((maximum, user) => Math.max(maximum, user.userId), 0);
  return maxUserId + 1;
}

/**
 * Handles login form submission.
 *
 * @param {SubmitEvent} event - Browser form submit event.
 * @returns {Promise<void>}
 */
async function handleLoginFormSubmit(event) {
  event.preventDefault();
  clearMessage();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  console.log(email,password);
  try {
    const matchedUsers = await getJson('/users', { email, password });

    console.log(matchedUsers);
    if (!matchedUsers.length) {
      showMessage('Invalid email or password.', 'error');
      return;
    }

    const authenticatedUser = matchedUsers[0];
    saveAuthenticatedUser(authenticatedUser);
    showMessage('Login successful. Redirecting...', 'success');

    setTimeout(() => {
      redirectUserByRole(authenticatedUser);
    }, 400);
  } catch (error) {
    showMessage(error.message || 'Unable to login at the moment.', 'error');
  }
}

/**
 * Handles register form submission.
 *
 * @param {SubmitEvent} event - Browser form submit event.
 * @returns {Promise<void>}
 */
async function handleRegisterFormSubmit(event) {
  event.preventDefault();
  clearMessage();

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const role = document.getElementById('registerRole').value.trim();

  const validationMessage = validateRegistrationInput(name, email, password, role);

  if (validationMessage) {
    showMessage(validationMessage, 'error');
    return;
  }

  try {
    const existingUsers = await getJson('/users', { email });

    if (existingUsers.length) {
      showMessage('An account with this email already exists.', 'error');
      return;
    }

    const userId = await getNextUserId();

    const createdUser = await postJson('/users', {
      userId,
      name,
      email,
      password,
      role
    });

    saveAuthenticatedUser(createdUser);
    showMessage('Registration successful. Redirecting...', 'success');

    setTimeout(() => {
      redirectUserByRole(createdUser);
    }, 400);
  } catch (error) {
    showMessage(error.message || 'Unable to register at the moment.', 'error');
  }
}

/**
 * Initializes the landing page and redirects already-authenticated users.
 *
 * @returns {void}
 */
function initializeAuthenticationPage() {
  const authenticatedUser = getAuthenticatedUser();

  if (authenticatedUser) {
    redirectUserByRole(authenticatedUser);
    return;
  }

  loginTabButton.addEventListener('click', () => switchAuthTab('login'));
  registerTabButton.addEventListener('click', () => switchAuthTab('register'));
  loginForm.addEventListener('submit', handleLoginFormSubmit);
  registerForm.addEventListener('submit', handleRegisterFormSubmit);
}

initializeAuthenticationPage();