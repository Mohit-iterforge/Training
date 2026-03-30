import { getJson, postJson, patchJson, deleteJson } from './api.js';
import { protectRoute } from './route-guard.js';
import { clearAuthenticatedUser } from './storage.js';

const boardWelcomeMessage = document.getElementById('boardWelcomeMessage');
const logoutButton = document.getElementById('logoutButton');
const boardMessage = document.getElementById('boardMessage');

const projectFilter = document.getElementById('projectFilter');
const assignedUserFilter = document.getElementById('assignedUserFilter');
const statusFilter = document.getElementById('statusFilter');
const taskSearchInput = document.getElementById('taskSearchInput');

const todoColumn = document.getElementById('todoColumn');
const inProgressColumn = document.getElementById('inProgressColumn');
const doneColumn = document.getElementById('doneColumn');

const todoCount = document.getElementById('todoCount');
const inProgressCount = document.getElementById('inProgressCount');
const doneCount = document.getElementById('doneCount');

const openTaskModalButton = document.getElementById('openTaskModalButton');
const closeTaskModalButton = document.getElementById('closeTaskModalButton');
const cancelTaskModalButton = document.getElementById('cancelTaskModalButton');
const taskModalOverlay = document.getElementById('taskModalOverlay');
const taskModalTitle = document.getElementById('taskModalTitle');
const taskForm = document.getElementById('taskForm');

const taskIdInput = document.getElementById('taskIdInput');
const taskTitleInput = document.getElementById('taskTitleInput');
const taskDescriptionInput = document.getElementById('taskDescriptionInput');
const taskAssignedToInput = document.getElementById('taskAssignedToInput');
const taskProjectIdInput = document.getElementById('taskProjectIdInput');
const taskStatusInput = document.getElementById('taskStatusInput');

let authenticatedUser = null;
let allTasks = [];
let allUsers = [];
let allProjects = [];

/**
 * Displays a board-level feedback message.
 *
 * @param {string} message - Text displayed to the user.
 * @param {'success' | 'error'} type - Visual state for the message.
 * @returns {void}
 */
function showBoardMessage(message, type) {
  boardMessage.textContent = message;
  boardMessage.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');

  if (type === 'success') {
    boardMessage.classList.add('bg-green-100', 'text-green-700');
  } else {
    boardMessage.classList.add('bg-red-100', 'text-red-700');
  }

  window.clearTimeout(showBoardMessage.timeoutId);
  showBoardMessage.timeoutId = window.setTimeout(() => {
    boardMessage.classList.add('hidden');
  }, 2500);
}

/**
 * Returns the display label for a task status value.
 *
 * @param {string} status - Task status.
 * @returns {string} Human-readable status label.
 */
function getStatusLabel(status) {
  if (status === 'inProgress') {
    return 'In Progress';
  }

  if (status === 'done') {
    return 'Done';
  }

  return 'To Do';
}

/**
 * Returns the user name for a given user ID.
 *
 * @param {number} userId - Assigned user ID.
 * @returns {string} User name or fallback text.
 */
function getUserNameById(userId) {
  const matchedUser = allUsers.find((user) => Number(user.userId) === Number(userId));
  return matchedUser ? matchedUser.name : 'Unassigned';
}

/**
 * Returns the project name for a given project ID.
 *
 * @param {number} projectId - Project ID.
 * @returns {string} Project name or fallback text.
 */
function getProjectNameById(projectId) {
  const matchedProject = allProjects.find((project) => Number(project.projectId) === Number(projectId));
  return matchedProject ? matchedProject.name : 'No Project';
}

/**
 * Clears all task columns before re-rendering.
 *
 * @returns {void}
 */
function clearTaskColumns() {
  todoColumn.innerHTML = '';
  inProgressColumn.innerHTML = '';
  doneColumn.innerHTML = '';
}

/**
 * Updates the visible task counters for each board column.
 *
 * @param {Array<Record<string, unknown>>} tasks - Task list currently rendered on the board.
 * @returns {void}
 */
function updateTaskCounts(tasks) {
  todoCount.textContent = String(tasks.filter((task) => task.status === 'todo').length);
  inProgressCount.textContent = String(tasks.filter((task) => task.status === 'inProgress').length);
  doneCount.textContent = String(tasks.filter((task) => task.status === 'done').length);
}

/**
 * Builds a single task card element.
 *
 * @param {Record<string, unknown>} task - Task object.
 * @returns {HTMLDivElement} Rendered task card.
 */
function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm';

  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <h3 class="text-base font-bold text-slate-900">${task.title}</h3>
      <span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
        ${getStatusLabel(task.status)}
      </span>
    </div>

    <p class="mt-3 text-sm leading-6 text-slate-600">${task.description}</p>

    <div class="mt-4 space-y-2 text-xs text-slate-500">
      <p><span class="font-semibold text-slate-700">Assigned To:</span> ${getUserNameById(task.assignedTo)}</p>
      <p><span class="font-semibold text-slate-700">Project:</span> ${getProjectNameById(task.projectId)}</p>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        data-action="edit"
        data-task-id="${task.id}"
        class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
      >
        Edit
      </button>

      <button
        type="button"
        data-action="delete"
        data-task-id="${task.id}"
        class="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
      >
        Delete
      </button>
    </div>
  `;

  return card;
}

/**
 * Renders all visible tasks into their respective status columns.
 *
 * @param {Array<Record<string, unknown>>} tasks - Task list to render.
 * @returns {void}
 */
function renderTasks(tasks) {
  clearTaskColumns();
  updateTaskCounts(tasks);

  tasks.forEach((task) => {
    const card = createTaskCard(task);

    if (task.status === 'inProgress') {
      inProgressColumn.appendChild(card);
      return;
    }

    if (task.status === 'done') {
      doneColumn.appendChild(card);
      return;
    }

    todoColumn.appendChild(card);
  });

  [todoColumn, inProgressColumn, doneColumn].forEach((columnElement) => {
    if (!columnElement.children.length) {
      columnElement.innerHTML = `
        <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No tasks found.
        </div>
      `;
    }
  });
}

/**
 * Returns the currently filtered task list based on selected controls.
 *
 * @returns {Array<Record<string, unknown>>} Filtered task list.
 */
function getFilteredTasks() {
  const selectedProjectId = projectFilter.value;
  const selectedAssignedUser = assignedUserFilter.value;
  const selectedStatus = statusFilter.value;
  const searchKeyword = taskSearchInput.value.trim().toLowerCase();

  return allTasks.filter((task) => {
    const matchesProject = !selectedProjectId || Number(task.projectId) === Number(selectedProjectId);
    const matchesAssignedUser = !selectedAssignedUser || Number(task.assignedTo) === Number(selectedAssignedUser);
    const matchesStatus = !selectedStatus || task.status === selectedStatus;
    const matchesSearch = !searchKeyword || task.title.toLowerCase().includes(searchKeyword);

    return matchesProject && matchesAssignedUser && matchesStatus && matchesSearch;
  });
}

/**
 * Re-renders the board using current filter values.
 *
 * @returns {void}
 */
function applyFiltersAndRenderBoard() {
  const filteredTasks = getFilteredTasks();
  renderTasks(filteredTasks);
}

/**
 * Populates project dropdown controls.
 *
 * @returns {void}
 */
function populateProjectOptions() {
  const filterOptions = ['<option value="">All Projects</option>'];
  const modalOptions = ['<option value="">Select project</option>'];

  allProjects.forEach((project) => {
    filterOptions.push(`<option value="${project.projectId}">${project.name}</option>`);
    modalOptions.push(`<option value="${project.projectId}">${project.name}</option>`);
  });

  projectFilter.innerHTML = filterOptions.join('');
  taskProjectIdInput.innerHTML = modalOptions.join('');
}

/**
 * Populates user dropdown controls.
 *
 * @returns {void}
 */
function populateUserOptions() {
  const filterOptions = ['<option value="">All Users</option>'];
  const modalOptions = ['<option value="">Select user</option>'];

  allUsers.forEach((user) => {
    filterOptions.push(`<option value="${user.userId}">${user.name}</option>`);
    modalOptions.push(`<option value="${user.userId}">${user.name}</option>`);
  });

  assignedUserFilter.innerHTML = filterOptions.join('');
  taskAssignedToInput.innerHTML = modalOptions.join('');
}

/**
 * Opens the task modal in create mode.
 *
 * @returns {void}
 */
function openCreateTaskModal() {
  taskModalTitle.textContent = 'Create Task';
  taskForm.reset();
  taskIdInput.value = '';
  taskStatusInput.value = 'todo';
  taskModalOverlay.classList.remove('hidden');
  taskModalOverlay.classList.add('flex');
}

/**
 * Opens the task modal in edit mode with task details populated.
 *
 * @param {Record<string, unknown>} task - Task object to edit.
 * @returns {void}
 */
function openEditTaskModal(task) {
  taskModalTitle.textContent = 'Edit Task';
  taskIdInput.value = task.id;
  taskTitleInput.value = task.title;
  taskDescriptionInput.value = task.description;
  taskAssignedToInput.value = String(task.assignedTo);
  taskProjectIdInput.value = String(task.projectId);
  taskStatusInput.value = task.status;
  taskModalOverlay.classList.remove('hidden');
  taskModalOverlay.classList.add('flex');
}

/**
 * Closes the task modal and resets form state.
 *
 * @returns {void}
 */
function closeTaskModal() {
  taskForm.reset();
  taskIdInput.value = '';
  taskModalOverlay.classList.add('hidden');
  taskModalOverlay.classList.remove('flex');
}

/**
 * Fetches the next available task ID from the tasks collection.
 *
 * @returns {Promise<number>} Next task ID value.
 */
async function getNextTaskId() {
  const tasks = await getJson('/tasks', {}, true);
  const maxTaskId = tasks.reduce((maximum, task) => Math.max(maximum, Number(task.taskId || 0)), 0);
  return maxTaskId + 1;
}

/**
 * Loads users, projects, and tasks required for the board.
 *
 * @returns {Promise<void>}
 */
async function loadBoardData() {
  const [users, projects, tasks] = await Promise.all([
    getJson('/users'),
    getJson('/projects'),
    getJson('/tasks', {}, true)
  ]);

  allUsers = users;
  allProjects = projects;
  allTasks = tasks;
}

/**
 * Validates task form input values.
 *
 * @param {string} title - Task title.
 * @param {string} description - Task description.
 * @param {string} assignedTo - Assigned user ID.
 * @param {string} projectId - Project ID.
 * @param {string} status - Task status.
 * @returns {string | null} Validation message when invalid, otherwise null.
 */
function validateTaskInput(title, description, assignedTo, projectId, status) {
  if (!title.trim()) {
    return 'Task title is required.';
  }

  if (!description.trim()) {
    return 'Task description is required.';
  }

  if (!assignedTo) {
    return 'Please select an assigned user.';
  }

  if (!projectId) {
    return 'Please select a project.';
  }

  if (!['todo', 'inProgress', 'done'].includes(status)) {
    return 'Please select a valid status.';
  }

  return null;
}

/**
 * Handles task form submission for both create and edit actions.
 *
 * @param {SubmitEvent} event - Browser form submit event.
 * @returns {Promise<void>}
 */
async function handleTaskFormSubmit(event) {
  event.preventDefault();

  const taskRecordId = taskIdInput.value.trim();
  const title = taskTitleInput.value.trim();
  const description = taskDescriptionInput.value.trim();
  const assignedTo = taskAssignedToInput.value.trim();
  const projectId = taskProjectIdInput.value.trim();
  const status = taskStatusInput.value.trim();

  const validationMessage = validateTaskInput(title, description, assignedTo, projectId, status);

  if (validationMessage) {
    showBoardMessage(validationMessage, 'error');
    return;
  }

  try {
    if (taskRecordId) {
      await patchJson(`/tasks/${taskRecordId}`, {
        title,
        description,
        assignedTo: Number(assignedTo),
        projectId: Number(projectId),
        status,
        updatedAt: new Date().toISOString()
      });

      showBoardMessage('Task updated successfully.', 'success');
    } else {
      const nextTaskId = await getNextTaskId();

      await postJson('/tasks', {
        id: nextTaskId,
        taskId: nextTaskId,
        title,
        description,
        assignedTo: Number(assignedTo),
        projectId: Number(projectId),
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      showBoardMessage('Task created successfully.', 'success');
    }

    closeTaskModal();
    await refreshBoard();
  } catch (error) {
    showBoardMessage(error.message || 'Unable to save task.', 'error');
  }
}

/**
 * Handles click actions from task cards such as edit and delete.
 *
 * @param {MouseEvent} event - Browser click event.
 * @returns {Promise<void>}
 */
async function handleBoardClick(event) {
  const clickedButton = event.target.closest('button[data-action]');

  if (!clickedButton) {
    return;
  }

  const action = clickedButton.dataset.action;
  const taskId = clickedButton.dataset.taskId;
  const selectedTask = allTasks.find((task) => String(task.id) === String(taskId));

  if (!selectedTask) {
    showBoardMessage('Task not found.', 'error');
    return;
  }

  if (action === 'edit') {
    openEditTaskModal(selectedTask);
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm(`Delete task "${selectedTask.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteJson(`/tasks/${selectedTask.id}`);
      showBoardMessage('Task deleted successfully.', 'success');
      await refreshBoard();
    } catch (error) {
      showBoardMessage(error.message || 'Unable to delete task.', 'error');
    }
  }
}

/**
 * Refreshes board data and re-renders the interface.
 *
 * @returns {Promise<void>}
 */
async function refreshBoard() {
  await loadBoardData();
  populateProjectOptions();
  populateUserOptions();
  applyFiltersAndRenderBoard();
}

/**
 * Attaches all UI event listeners used by the board page.
 *
 * @returns {void}
 */
function bindBoardEventListeners() {
  logoutButton.addEventListener('click', () => {
    clearAuthenticatedUser();
    window.location.href = '../index.html';
  });

  openTaskModalButton.addEventListener('click', openCreateTaskModal);
  closeTaskModalButton.addEventListener('click', closeTaskModal);
  cancelTaskModalButton.addEventListener('click', closeTaskModal);

  taskModalOverlay.addEventListener('click', (event) => {
    if (event.target === taskModalOverlay) {
      closeTaskModal();
    }
  });

  taskForm.addEventListener('submit', handleTaskFormSubmit);

  projectFilter.addEventListener('change', applyFiltersAndRenderBoard);
  assignedUserFilter.addEventListener('change', applyFiltersAndRenderBoard);
  statusFilter.addEventListener('change', applyFiltersAndRenderBoard);
  taskSearchInput.addEventListener('input', applyFiltersAndRenderBoard);

  todoColumn.addEventListener('click', handleBoardClick);
  inProgressColumn.addEventListener('click', handleBoardClick);
  doneColumn.addEventListener('click', handleBoardClick);
}

/**
 * Initializes the board page.
 *
 * @returns {Promise<void>}
 */
async function initializeBoardPage() {
  authenticatedUser = protectRoute(['Admin', 'User']);
  boardWelcomeMessage.textContent = `Welcome, ${authenticatedUser.name}. Manage your tasks here.`;

  bindBoardEventListeners();

  try {
    await refreshBoard();
  } catch (error) {
    showBoardMessage(error.message || 'Unable to load board data.', 'error');
  }
}

initializeBoardPage();