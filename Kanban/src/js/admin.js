import { getJson, postJson, patchJson, deleteJson } from './api.js';
import { protectRoute } from './route-guard.js';
import { clearAuthenticatedUser } from './storage.js';

const adminWelcomeMessage = document.getElementById('adminWelcomeMessage');
const logoutButton = document.getElementById('logoutButton');
const openUserModalButton = document.getElementById('openUserModalButton');
const adminMessage = document.getElementById('adminMessage');

const userSearchInput = document.getElementById('userSearchInput');
const roleFilter = document.getElementById('roleFilter');
const userCount = document.getElementById('userCount');
const userTableBody = document.getElementById('userTableBody');
const emptyState = document.getElementById('emptyState');

const userModalOverlay = document.getElementById('userModalOverlay');
const userModalTitle = document.getElementById('userModalTitle');
const closeUserModalButton = document.getElementById('closeUserModalButton');
const cancelUserModalButton = document.getElementById('cancelUserModalButton');
const userForm = document.getElementById('userForm');

const userIdInput = document.getElementById('userIdInput');
const userNameInput = document.getElementById('userNameInput');
const userEmailInput = document.getElementById('userEmailInput');
const userPasswordInput = document.getElementById('userPasswordInput');
const userRoleInput = document.getElementById('userRoleInput');

let authenticatedUser = null;
let allUsers = [];

function showAdminMessage(message, type) {
  adminMessage.textContent = message;
  adminMessage.classList.remove(
    'hidden',
    'bg-red-100',
    'text-red-700',
    'bg-green-100',
    'text-green-700'
  );

  adminMessage.classList.add(
    type === 'success' ? 'bg-green-100' : 'bg-red-100',
    type === 'success' ? 'text-green-700' : 'text-red-700'
  );

  clearTimeout(showAdminMessage.timeoutId);
  showAdminMessage.timeoutId = setTimeout(() => {
    adminMessage.classList.add('hidden');
  }, 2500);
}

function getFilteredUsers() {
  const search = userSearchInput.value.trim().toLowerCase();
  const role = roleFilter.value;

  return allUsers.filter((user) => {
    return (
      (!search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)) &&
      (!role || user.role === role)
    );
  });
}

function renderUsers() {
  const users = getFilteredUsers();
  userTableBody.innerHTML = '';
  userCount.textContent = users.length;

  if (!users.length) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  users.forEach((user) => {
    const row = document.createElement('tr');
    row.className = 'bg-slate-50';

    row.innerHTML = `
      <td class="px-4 py-4">${user.id}</td>
      <td class="px-4 py-4">${user.name}</td>
      <td class="px-4 py-4">${user.email}</td>
      <td class="px-4 py-4">
        <span>${user.role}</span>
      </td>
      <td class="px-4 py-4">
        <button data-action="edit" data-id="${user.id}" class="bg-blue-600 px-3 py-2">Edit</button>
        <button data-action="delete" data-id="${user.id}" class="bg-red-600 px-3 py-2">Delete</button>
      </td>
    `;

    userTableBody.appendChild(row);
  });
}

function openCreateUserModal() {
  userModalTitle.textContent = 'Create User';
  userForm.reset();
  userIdInput.value = '';
  userModalOverlay.classList.remove('hidden');
  userModalOverlay.classList.add('flex');
}

function openEditUserModal(user) {
  userModalTitle.textContent = 'Edit User';
  userIdInput.value = user.id;
  userNameInput.value = user.name;
  userEmailInput.value = user.email;
  userPasswordInput.value = user.password;
  userRoleInput.value = user.role;

  userModalOverlay.classList.remove('hidden');
  userModalOverlay.classList.add('flex');
}

function closeUserModal() {
  userForm.reset();
  userIdInput.value = '';
  userModalOverlay.classList.add('hidden');
  userModalOverlay.classList.remove('flex');
}

function validateUserInput(name, email, password, role) {
  const pattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  if (!name) return 'User name is required.';
  if (!email) return 'Email is required.';
  if (!pattern.test(password))
    return 'Password must be strong.';
  if (!['Admin', 'User'].includes(role))
    return 'Invalid role.';

  return null;
}

/* api's */
async function loadUsers() {
  allUsers = await getJson('/users', {}, true);
}

async function refreshUsers() {
  await loadUsers();
  renderUsers();
}

async function getNextUserId() {
  const users = await getJson('/users', {}, true);
  return (
    Math.max(...users.map((u) => Number(u.id) || 0), 0) + 1
  );
}

async function handleUserFormSubmit(e) {
  e.preventDefault();

  const id = userIdInput.value.trim();
  const name = userNameInput.value.trim();
  const email = userEmailInput.value.trim();
  const password = userPasswordInput.value.trim();
  const role = userRoleInput.value.trim();

  const error = validateUserInput(name, email, password, role);
  if (error) return showAdminMessage(error, 'error');

  try {
    const existing = await getJson('/users', { email }, true);
    const conflict = existing.find(
      (u) => String(u.id) !== String(id)
    );

    if (conflict) {
      return showAdminMessage(
        'Email already exists.',
        'error'
      );
    }

    if (id) {
      await patchJson(`/users/${id}`, {
        name,
        email,
        password,
        role,
      });
      showAdminMessage('User updated.', 'success');
    } else {
      const newId = await getNextUserId();
      await postJson('/users', {
        // id: newId,
        name,
        email,
        password,
        role,
      });
      showAdminMessage('User created.', 'success');
    }

    closeUserModal();
    refreshUsers();
  } catch (err) {
    showAdminMessage(err.message, 'error');
  }
}

async function handleUserTableClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = btn.dataset.id;
  const user = allUsers.find(
    (u) => String(u.id) === id
  );

  if (!user) return showAdminMessage('User not found', 'error');

  if (btn.dataset.action === 'edit') {    
    return openEditUserModal(user);
  }

  if (id == authenticatedUser.id) {
    return showAdminMessage(
      'Cannot delete yourself',
      'error'
    );
  }

  if (!confirm(`Delete ${user.name}?`)) return;

  try {
    await deleteJson(`/users/${id}`); //fix
    showAdminMessage('User deleted', 'success');
    refreshUsers();
  } catch (err) {
    showAdminMessage(err.message, 'error');
  }
}

function bindEvents() {
  logoutButton.onclick = () => {
    clearAuthenticatedUser();
    location.href = '../index.html';
  };

  openUserModalButton.onclick = openCreateUserModal;
  closeUserModalButton.onclick = closeUserModal;
  cancelUserModalButton.onclick = closeUserModal;

  userModalOverlay.onclick = (e) => {
    if (e.target === userModalOverlay) closeUserModal();
  };

  userForm.onsubmit = handleUserFormSubmit;
  userSearchInput.oninput = renderUsers;
  roleFilter.onchange = renderUsers;
  userTableBody.onclick = handleUserTableClick;
}

async function init() {
  authenticatedUser = protectRoute(['Admin']);
  adminWelcomeMessage.textContent = `Welcome, ${authenticatedUser.name}`;

  bindEvents();
  await refreshUsers();
}

init();