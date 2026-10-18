/**
 * TaskFlow - Main Application Controller
 * Handles application state, UI rendering, drag-and-drop, modals, and user interactions.
 */

(function () {
  'use strict';

  // ==========================================================================
  // Application State
  // ==========================================================================
  const state = {
    tasks: [],                // Single source of truth array
    currentFilter: 'all',     // 'all' | 'high' | 'medium' | 'low'
    searchQuery: '',          // Case-insensitive task title/description query
    editingTaskId: null,      // ID of task being edited, or null if creating new
    draggedTaskId: null,      // ID of task currently being dragged
    confirmAction: null       // Callback executed on modal confirmation
  };

  // Preset cover image catalog
  const IMAGE_PRESETS = {
    security: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
    code: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    design: 'https://images.unsplash.com/photo-1581291518655-9523c93269c4?w=600&auto=format&fit=crop&q=80',
    none: ''
  };

  // ==========================================================================
  // DOM Element References
  // ==========================================================================
  const elements = {
    // Top Bar & Navigation
    dateDisplay: document.getElementById('date-display-text'),
    searchInput: document.getElementById('search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileCloseBtn: document.getElementById('mobile-close-btn'),
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop'),

    // Sidebar Controls
    openCreateModalBtn: document.getElementById('open-create-modal-btn'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    clearAllBtn: document.getElementById('clear-all-btn'),

    // Sidebar Stats & Badges
    statTotal: document.getElementById('stat-total'),
    statCompleted: document.getElementById('stat-completed'),
    statOverdue: document.getElementById('stat-overdue'),
    statProgressPercent: document.getElementById('stat-progress-percent'),
    statProgressFill: document.getElementById('stat-progress-fill'),
    filterCountAll: document.getElementById('filter-count-all'),
    filterCountHigh: document.getElementById('filter-count-high'),
    filterCountMedium: document.getElementById('filter-count-medium'),
    filterCountLow: document.getElementById('filter-count-low'),

    // Kanban Columns & Lists
    columnTodo: document.getElementById('column-todo'),
    columnInprogress: document.getElementById('column-inprogress'),
    columnDone: document.getElementById('column-done'),
    listTodo: document.getElementById('todo-list'),
    listInprogress: document.getElementById('inprogress-list'),
    listDone: document.getElementById('done-list'),
    countTodo: document.getElementById('todo-count'),
    countInprogress: document.getElementById('inprogress-count'),
    countDone: document.getElementById('done-count'),

    // Task Create / Edit Modal
    taskModal: document.getElementById('task-modal'),
    taskForm: document.getElementById('task-form'),
    modalHeading: document.getElementById('modal-heading'),
    taskIdInput: document.getElementById('task-id'),
    taskTitleInput: document.getElementById('task-title'),
    titleError: document.getElementById('title-error'),
    taskDescInput: document.getElementById('task-desc'),
    taskImageInput: document.getElementById('task-image'),
    taskDeadlineInput: document.getElementById('task-deadline'),
    taskStatusSelect: document.getElementById('task-status'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalSubmitBtn: document.getElementById('modal-submit-btn'),

    // Confirmation Modal
    confirmModal: document.getElementById('confirm-modal'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmMessage: document.getElementById('confirm-message'),
    confirmActionBtn: document.getElementById('confirm-action-btn'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  /**
   * Generates a unique task identifier
   * @returns {string} Unique ID
   */
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Formats and determines visual deadline status relative to local time
   * @param {string} deadlineStr - "YYYY-MM-DD"
   * @param {string} taskStatus - 'todo' | 'inprogress' | 'done'
   * @returns {Object|null} Deadline metadata or null if no deadline set
   */
  function getDeadlineMetadata(deadlineStr, taskStatus) {
    if (!deadlineStr) return null;

    // Parse date parts to prevent local timezone discrepancies
    const parts = deadlineStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;

    const [year, month, day] = parts;
    const deadlineDate = new Date(year, month - 1, day);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${months[month - 1]} ${day}${year !== now.getFullYear() ? ', ' + year : ''}`;

    if (taskStatus === 'done') {
      return {
        type: 'done',
        text: formattedDate,
        icon: 'fa-regular fa-calendar-check',
        badgeClass: 'done'
      };
    }

    if (diffDays < 0) {
      return {
        type: 'overdue',
        text: `${formattedDate} • Overdue`,
        icon: 'fa-solid fa-triangle-exclamation',
        badgeClass: 'overdue'
      };
    } else if (diffDays === 0) {
      return {
        type: 'today',
        text: `${formattedDate} • Due today`,
        icon: 'fa-regular fa-clock',
        badgeClass: 'due-today'
      };
    } else if (diffDays <= 2) {
      return {
        type: 'soon',
        text: `${formattedDate} • Due soon`,
        icon: 'fa-regular fa-hourglass-half',
        badgeClass: 'due-soon'
      };
    }

    return {
      type: 'normal',
      text: formattedDate,
      icon: 'fa-regular fa-calendar',
      badgeClass: 'normal'
    };
  }

  /**
   * Displays an accessible floating toast notification
   * @param {string} message - Notification text
   * @param {'success'|'danger'|'info'} type - Toast type
   */
  function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    if (type === 'danger') iconClass = 'fa-solid fa-triangle-exclamation';

    const icon = document.createElement('i');
    icon.className = `${iconClass} toast-icon`;
    icon.setAttribute('aria-hidden', 'true');

    const content = document.createElement('span');
    content.className = 'toast-content';
    content.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(content);
    elements.toastContainer.appendChild(toast);

    // Auto dismiss after 2.8 seconds
    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, 2800);
  }

  // ==========================================================================
  // Card Creation & DOM Rendering
  // ==========================================================================

  /**
   * Creates a DOM element for a task card using safe textContent to prevent XSS
   * @param {Object} task - Task model
   * @returns {HTMLElement} Card element
   */
  function createCardElement(task) {
    const card = document.createElement('article');
    card.className = `task-card priority-${task.priority}`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', task.id);
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Task: ${task.title}, priority ${task.priority}`);

    // --- 0. Card Cover Image (if present) ---
    if (task.image && task.image.trim() !== '') {
      const coverWrapper = document.createElement('div');
      coverWrapper.className = 'card-cover-wrapper';

      const coverImg = document.createElement('img');
      coverImg.className = 'card-cover-img';
      coverImg.src = task.image;
      coverImg.alt = '';
      coverImg.loading = 'lazy';
      // Fallback gracefully if image fails to load
      coverImg.onerror = () => coverWrapper.remove();

      coverWrapper.appendChild(coverImg);
      card.appendChild(coverWrapper);
    }

    // --- 1. Card Header: Priority Pill + Actions (Edit/Delete) ---
    const header = document.createElement('div');
    header.className = 'card-header';

    const priorityPill = document.createElement('span');
    priorityPill.className = `priority-pill ${task.priority}`;

    let priorityIcon = 'fa-circle-check';
    if (task.priority === 'high') priorityIcon = 'fa-circle-exclamation';
    if (task.priority === 'medium') priorityIcon = 'fa-triangle-exclamation';

    priorityPill.innerHTML = `<i class="fa-solid ${priorityIcon}" aria-hidden="true"></i> ${task.priority.toUpperCase()}`;
    header.appendChild(priorityPill);

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'card-action-btn edit-btn';
    editBtn.setAttribute('data-action', 'edit');
    editBtn.setAttribute('data-id', task.id);
    editBtn.setAttribute('aria-label', `Edit task: ${task.title}`);
    editBtn.setAttribute('title', 'Edit task');
    editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>';

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'card-action-btn delete-btn';
    deleteBtn.setAttribute('data-action', 'delete');
    deleteBtn.setAttribute('data-id', task.id);
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.title}`);
    deleteBtn.setAttribute('title', 'Delete task');
    deleteBtn.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i>';

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    header.appendChild(actions);
    card.appendChild(header);

    // --- 2. Card Content: Title & Optional Description ---
    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = task.title; // Safe text insertion
    card.appendChild(title);

    if (task.description && task.description.trim() !== '') {
      const desc = document.createElement('p');
      desc.className = 'card-description';
      desc.textContent = task.description; // Safe text insertion
      card.appendChild(desc);
    }

    // --- 3. Card Footer: Deadline Badge + Assignee + Mobile Move Dropdown ---
    const footer = document.createElement('div');
    footer.className = 'card-footer';

    // Left group: Deadline representation
    const footerLeft = document.createElement('div');
    footerLeft.className = 'card-footer-left';

    const deadlineMeta = getDeadlineMetadata(task.deadline, task.status);
    if (deadlineMeta) {
      const deadlineBadge = document.createElement('span');
      deadlineBadge.className = `deadline-badge ${deadlineMeta.badgeClass}`;
      deadlineBadge.innerHTML = `<i class="${deadlineMeta.icon}" aria-hidden="true"></i> <span>${deadlineMeta.text}</span>`;
      footerLeft.appendChild(deadlineBadge);
    }
    footer.appendChild(footerLeft);

    // Right group: Assignee Avatar + Touch/Mobile fallback
    const footerRight = document.createElement('div');
    footerRight.className = 'card-footer-right';

    // Assignee Avatar Image
    if (task.assignee && task.assignee.avatar) {
      const assigneeBadge = document.createElement('div');
      assigneeBadge.className = 'card-assignee-badge';
      assigneeBadge.title = `Assigned to ${task.assignee.name}`;

      const avatarImg = document.createElement('img');
      avatarImg.className = 'assignee-avatar-img';
      avatarImg.src = task.assignee.avatar;
      avatarImg.alt = task.assignee.name;
      avatarImg.loading = 'lazy';
      avatarImg.onerror = () => assigneeBadge.remove();

      assigneeBadge.appendChild(avatarImg);
      footerRight.appendChild(assigneeBadge);
    }

    // Mobile move dropdown
    const moveWrapper = document.createElement('div');
    moveWrapper.className = 'mobile-move-wrapper';

    const moveSelect = document.createElement('select');
    moveSelect.className = 'move-select';
    moveSelect.setAttribute('aria-label', `Move task "${task.title}" to another column`);
    moveSelect.setAttribute('data-action', 'move');
    moveSelect.setAttribute('data-id', task.id);

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    defaultOpt.textContent = 'Move...';
    moveSelect.appendChild(defaultOpt);

    const statusOptions = [
      { value: 'todo', label: 'To Do' },
      { value: 'inprogress', label: 'In Progress' },
      { value: 'done', label: 'Done' }
    ];

    statusOptions.forEach(opt => {
      if (opt.value !== task.status) {
        const optionEl = document.createElement('option');
        optionEl.value = opt.value;
        optionEl.textContent = opt.label;
        moveSelect.appendChild(optionEl);
      }
    });

    moveWrapper.appendChild(moveSelect);
    footerRight.appendChild(moveWrapper);
    footer.appendChild(footerRight);

    card.appendChild(footer);

    // --- 4. Drag & Drop Event Handlers for HTML5 API ---
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
  }

  /**
   * Generates a styled empty state element when no tasks match
   * @param {string} message - Main feedback text
   * @param {string} subtext - Guidance subtext
   * @returns {HTMLElement} Empty state container
   */
  function createEmptyState(message, subtext) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.innerHTML = `
      <div class="empty-state-graphic">
        <i class="fa-solid fa-clipboard-check empty-state-icon" aria-hidden="true"></i>
      </div>
      <div class="empty-state-text">${message}</div>
      <div class="empty-state-subtext">${subtext}</div>
    `;
    return emptyDiv;
  }

  /**
   * Single Source of Truth Render Function
   * Recalculates stats, updates badges and re-renders column lists
   */
  function render() {
    const allTasks = state.tasks;

    // --- Calculate Stats ---
    const totalCount = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'done');
    const completedCount = completedTasks.length;

    const overdueCount = allTasks.filter(t => {
      const meta = getDeadlineMetadata(t.deadline, t.status);
      return meta && meta.type === 'overdue';
    }).length;

    const percentDone = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Update Sidebar Stat Elements
    if (elements.statTotal) elements.statTotal.textContent = totalCount;
    if (elements.statCompleted) elements.statCompleted.textContent = completedCount;
    if (elements.statOverdue) elements.statOverdue.textContent = overdueCount;
    if (elements.statProgressPercent) elements.statProgressPercent.textContent = `${percentDone}%`;
    if (elements.statProgressFill) elements.statProgressFill.style.width = `${percentDone}%`;

    // Priority Counts for Filter Badges
    const highCount = allTasks.filter(t => t.priority === 'high').length;
    const mediumCount = allTasks.filter(t => t.priority === 'medium').length;
    const lowCount = allTasks.filter(t => t.priority === 'low').length;

    if (elements.filterCountAll) elements.filterCountAll.textContent = totalCount;
    if (elements.filterCountHigh) elements.filterCountHigh.textContent = highCount;
    if (elements.filterCountMedium) elements.filterCountMedium.textContent = mediumCount;
    if (elements.filterCountLow) elements.filterCountLow.textContent = lowCount;

    // Update active filter button styling
    elements.filterButtons.forEach(btn => {
      const filterValue = btn.getAttribute('data-filter');
      const isActive = filterValue === state.currentFilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // --- Filter Tasks by Priority and Search Query ---
    const query = state.searchQuery.trim().toLowerCase();

    const filteredTasks = allTasks.filter(task => {
      // Priority check
      if (state.currentFilter !== 'all' && task.priority !== state.currentFilter) {
        return false;
      }
      // Search query check (title and description)
      if (query !== '') {
        const titleMatch = task.title.toLowerCase().includes(query);
        const descMatch = (task.description || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });

    // Partition tasks by status column
    const todoTasks = filteredTasks.filter(t => t.status === 'todo');
    const inprogressTasks = filteredTasks.filter(t => t.status === 'inprogress');
    const doneTasks = filteredTasks.filter(t => t.status === 'done');

    // Update Column Count Badges
    if (elements.countTodo) elements.countTodo.textContent = todoTasks.length;
    if (elements.countInprogress) elements.countInprogress.textContent = inprogressTasks.length;
    if (elements.countDone) elements.countDone.textContent = doneTasks.length;

    // Render columns
    renderColumnList(elements.listTodo, todoTasks, 'No tasks in To Do', 'Click "+ New Task" to begin.');
    renderColumnList(elements.listInprogress, inprogressTasks, 'No active tasks', 'Drag tasks here when started.');
    renderColumnList(elements.listDone, doneTasks, 'No completed tasks', 'Finished tasks will appear here.');
  }

  /**
   * Helper to render cards into a specific list container
   * @param {HTMLElement} listEl - Target column container
   * @param {Array<Object>} taskList - Filtered tasks for column
   * @param {string} emptyTitle - Empty state title
   * @param {string} emptySubtext - Empty state description
   */
  function renderColumnList(listEl, taskList, emptyTitle, emptySubtext) {
    if (!listEl) return;
    listEl.innerHTML = '';

    if (taskList.length === 0) {
      const isFiltered = state.currentFilter !== 'all' || state.searchQuery.trim() !== '';
      const message = isFiltered ? 'No matching tasks' : emptyTitle;
      const sub = isFiltered ? 'Try adjusting your filters or search' : emptySubtext;
      listEl.appendChild(createEmptyState(message, sub));
      return;
    }

    taskList.forEach(task => {
      const cardEl = createCardElement(task);
      listEl.appendChild(cardEl);
    });
  }

  // ==========================================================================
  // Drag and Drop (HTML5 Native Drag & Drop API)
  // ==========================================================================

  /**
   * Triggered when user starts dragging a task card
   * @param {DragEvent} e
   */
  function handleDragStart(e) {
    const card = e.currentTarget;
    state.draggedTaskId = card.getAttribute('data-id');
    e.dataTransfer.setData('text/plain', state.draggedTaskId);
    e.dataTransfer.effectAllowed = 'move';

    setTimeout(() => {
      card.classList.add('is-dragging');
    }, 0);
  }

  /**
   * Triggered when drag interaction concludes
   * @param {DragEvent} e
   */
  function handleDragEnd(e) {
    const card = e.currentTarget;
    card.classList.remove('is-dragging');
    state.draggedTaskId = null;

    document.querySelectorAll('.kanban-column').forEach(col => {
      col.classList.remove('drop-target-active');
    });
  }

  /**
   * Sets up drop zone listeners on each Kanban column
   */
  function setupColumnDropZones() {
    const columns = [elements.columnTodo, elements.columnInprogress, elements.columnDone];

    columns.forEach(column => {
      if (!column) return;

      column.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        column.classList.add('drop-target-active');
      });

      column.addEventListener('dragleave', e => {
        if (!column.contains(e.relatedTarget)) {
          column.classList.remove('drop-target-active');
        }
      });

      column.addEventListener('drop', e => {
        e.preventDefault();
        column.classList.remove('drop-target-active');

        const taskId = e.dataTransfer.getData('text/plain') || state.draggedTaskId;
        const targetStatus = column.getAttribute('data-status');

        if (!taskId || !targetStatus) return;

        moveTask(taskId, targetStatus);
      });
    });
  }

  /**
   * Moves a task to a designated column status and persists changes
   * @param {string} taskId
   * @param {'todo'|'inprogress'|'done'} newStatus
   */
  function moveTask(taskId, newStatus) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = state.tasks[taskIndex];
    if (task.status === newStatus) return;

    const statusNames = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
    task.status = newStatus;

    window.TaskStorage.saveTasks(state.tasks);
    render();
    showToast(`Task moved to ${statusNames[newStatus]}`, 'info');
  }

  // ==========================================================================
  // Modal Management: Create & Edit Task
  // ==========================================================================

  /**
   * Opens task modal in create mode
   * @param {'todo'|'inprogress'|'done'} presetStatus - Optional column preset
   */
  function openCreateModal(presetStatus = 'todo') {
    state.editingTaskId = null;
    elements.modalHeading.textContent = 'New Task';
    elements.modalSubmitBtn.textContent = 'Create Task';

    // Reset form fields
    elements.taskForm.reset();
    elements.taskIdInput.value = '';
    if (elements.taskImageInput) elements.taskImageInput.value = '';
    elements.taskStatusSelect.value = presetStatus;

    // Default medium priority checked
    const defaultRadio = elements.taskForm.querySelector('input[name="priority"][value="medium"]');
    if (defaultRadio) defaultRadio.checked = true;

    clearInputError();

    elements.taskModal.classList.add('active');
    setTimeout(() => elements.taskTitleInput.focus(), 150);
  }

  /**
   * Opens task modal in edit mode with populated fields
   * @param {string} taskId
   */
  function openEditModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    state.editingTaskId = taskId;
    elements.modalHeading.textContent = 'Edit Task';
    elements.modalSubmitBtn.textContent = 'Save Changes';

    // Populate form fields
    elements.taskIdInput.value = task.id;
    elements.taskTitleInput.value = task.title;
    elements.taskDescInput.value = task.description || '';
    if (elements.taskImageInput) elements.taskImageInput.value = task.image || '';
    elements.taskDeadlineInput.value = task.deadline || '';
    elements.taskStatusSelect.value = task.status;

    // Check corresponding priority radio
    const priorityRadio = elements.taskForm.querySelector(`input[name="priority"][value="${task.priority}"]`);
    if (priorityRadio) {
      priorityRadio.checked = true;
    }

    clearInputError();

    elements.taskModal.classList.add('active');
    setTimeout(() => elements.taskTitleInput.focus(), 150);
  }

  /**
   * Closes the task form modal
   */
  function closeTaskModal() {
    elements.taskModal.classList.remove('active');
    state.editingTaskId = null;
    clearInputError();
  }

  /**
   * Displays inline error message for task title input
   * @param {string} message - Validation error description
   */
  function showInputError(message) {
    elements.taskTitleInput.classList.add('has-error');
    elements.titleError.textContent = message;
    elements.titleError.classList.add('visible');
    elements.taskTitleInput.focus();
  }

  /**
   * Clears inline error message
   */
  function clearInputError() {
    elements.taskTitleInput.classList.remove('has-error');
    elements.titleError.classList.remove('visible');
  }

  /**
   * Handles submission of the task form (both Add and Edit)
   * @param {Event} e
   */
  function handleTaskFormSubmit(e) {
    e.preventDefault();

    const titleValue = elements.taskTitleInput.value.trim();
    if (!titleValue) {
      showInputError('Task title cannot be empty.');
      return;
    }

    const descValue = elements.taskDescInput.value.trim();
    const imageValue = elements.taskImageInput ? elements.taskImageInput.value.trim() : '';
    const deadlineValue = elements.taskDeadlineInput.value;
    const statusValue = elements.taskStatusSelect.value;

    const selectedPriorityInput = elements.taskForm.querySelector('input[name="priority"]:checked');
    const priorityValue = selectedPriorityInput ? selectedPriorityInput.value : 'medium';

    if (state.editingTaskId) {
      // Update existing task
      const taskIndex = state.tasks.findIndex(t => t.id === state.editingTaskId);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = {
          ...state.tasks[taskIndex],
          title: titleValue,
          description: descValue,
          image: imageValue,
          priority: priorityValue,
          deadline: deadlineValue,
          status: statusValue
        };
        window.TaskStorage.saveTasks(state.tasks);
        render();
        closeTaskModal();
        showToast('Task updated successfully', 'success');
      }
    } else {
      // Create new task
      const newTask = {
        id: generateId(),
        title: titleValue,
        description: descValue,
        image: imageValue,
        priority: priorityValue,
        deadline: deadlineValue,
        status: statusValue,
        assignee: {
          name: 'Alex Morgan',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&auto=format&fit=crop&crop=face'
        },
        createdAt: new Date().toISOString()
      };

      state.tasks.unshift(newTask);
      window.TaskStorage.saveTasks(state.tasks);
      render();
      closeTaskModal();
      showToast('Task added successfully', 'success');
    }
  }

  // ==========================================================================
  // Confirmation Modal (Delete & Clear All)
  // ==========================================================================

  /**
   * Shows an accessible confirmation modal
   * @param {string} title - Heading
   * @param {string} message - Description
   * @param {string} actionBtnText - Primary button text
   * @param {Function} onConfirm - Callback if confirmed
   */
  function showConfirmModal(title, message, actionBtnText, onConfirm) {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    elements.confirmActionBtn.textContent = actionBtnText;
    state.confirmAction = onConfirm;

    elements.confirmModal.classList.add('active');
    elements.confirmCancelBtn.focus();
  }

  /**
   * Closes confirmation modal and cleans callback
   */
  function closeConfirmModal() {
    elements.confirmModal.classList.remove('active');
    state.confirmAction = null;
  }

  // ==========================================================================
  // Event Delegation & Action Handlers
  // ==========================================================================

  /**
   * Sets up all event listeners for the application
   */
  function initEventListeners() {
    // 1. Open Create Task Modal
    if (elements.openCreateModalBtn) {
      elements.openCreateModalBtn.addEventListener('click', () => openCreateModal('todo'));
    }

    // Column quick add buttons
    document.querySelectorAll('.column-quick-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-status-preset') || 'todo';
        openCreateModal(preset);
      });
    });

    // Preset Cover Image Buttons in Modal
    document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-preset');
        if (elements.taskImageInput) {
          elements.taskImageInput.value = IMAGE_PRESETS[key] || '';
        }
      });
    });

    // 2. Modal Form Submit & Cancel
    if (elements.taskForm) {
      elements.taskForm.addEventListener('submit', handleTaskFormSubmit);
    }
    if (elements.modalCancelBtn) {
      elements.modalCancelBtn.addEventListener('click', closeTaskModal);
    }
    if (elements.modalCloseBtn) {
      elements.modalCloseBtn.addEventListener('click', closeTaskModal);
    }

    elements.taskModal.addEventListener('click', e => {
      if (e.target === elements.taskModal) {
        closeTaskModal();
      }
    });

    elements.taskTitleInput.addEventListener('input', () => {
      if (elements.taskTitleInput.value.trim() !== '') {
        clearInputError();
      }
    });

    // 3. Confirm Modal Action & Cancel
    if (elements.confirmActionBtn) {
      elements.confirmActionBtn.addEventListener('click', () => {
        if (typeof state.confirmAction === 'function') {
          state.confirmAction();
        }
        closeConfirmModal();
      });
    }
    if (elements.confirmCancelBtn) {
      elements.confirmCancelBtn.addEventListener('click', closeConfirmModal);
    }
    elements.confirmModal.addEventListener('click', e => {
      if (e.target === elements.confirmModal) {
        closeConfirmModal();
      }
    });

    // 4. Keyboard Shortcuts: Esc to close modals
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (elements.taskModal.classList.contains('active')) {
          closeTaskModal();
        }
        if (elements.confirmModal.classList.contains('active')) {
          closeConfirmModal();
        }
        closeMobileSidebar();
      }
    });

    // 5. Card Actions via Event Delegation on Board Container
    const board = document.querySelector('.board-container');
    if (board) {
      board.addEventListener('click', e => {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;

        const action = actionBtn.getAttribute('data-action');
        const taskId = actionBtn.getAttribute('data-id');

        if (action === 'edit') {
          openEditModal(taskId);
        } else if (action === 'delete') {
          const task = state.tasks.find(t => t.id === taskId);
          const title = task ? `"${task.title}"` : 'this task';
          showConfirmModal(
            'Delete Task',
            `Are you sure you want to delete ${title}? This action cannot be undone.`,
            'Delete',
            () => {
              state.tasks = state.tasks.filter(t => t.id !== taskId);
              window.TaskStorage.saveTasks(state.tasks);
              render();
              showToast('Task deleted', 'danger');
            }
          );
        }
      });

      // Mobile move dropdown change listener
      board.addEventListener('change', e => {
        if (e.target.matches('.move-select')) {
          const taskId = e.target.getAttribute('data-id');
          const newStatus = e.target.value;
          if (taskId && newStatus) {
            moveTask(taskId, newStatus);
          }
        }
      });
    }

    // 6. Priority Filter Buttons in Sidebar
    elements.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        state.currentFilter = filter;
        window.TaskStorage.saveFilter(filter);
        render();

        closeMobileSidebar();
      });
    });

    // 7. Search Input Filter
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', e => {
        state.searchQuery = e.target.value;
        if (elements.searchClearBtn) {
          elements.searchClearBtn.classList.toggle('visible', state.searchQuery.length > 0);
        }
        render();
      });
    }

    if (elements.searchClearBtn) {
      elements.searchClearBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.searchClearBtn.classList.remove('visible');
        elements.searchInput.focus();
        render();
      });
    }

    // 8. Clear All Tasks Button with Confirmation
    if (elements.clearAllBtn) {
      elements.clearAllBtn.addEventListener('click', () => {
        if (state.tasks.length === 0) {
          showToast('No tasks to clear', 'info');
          return;
        }

        showConfirmModal(
          'Clear All Tasks',
          'Are you sure you want to remove all tasks from your board? All progress will be lost.',
          'Clear All',
          () => {
            state.tasks = [];
            window.TaskStorage.clearTasks();
            render();
            showToast('All tasks cleared', 'danger');
          }
        );
      });
    }

    // 9. Mobile & Tablet Sidebar Drawer Toggle
    if (elements.mobileMenuBtn) {
      elements.mobileMenuBtn.addEventListener('click', openMobileSidebar);
    }
    if (elements.mobileCloseBtn) {
      elements.mobileCloseBtn.addEventListener('click', closeMobileSidebar);
    }
    if (elements.sidebarBackdrop) {
      elements.sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }
  }

  /**
   * Opens sidebar drawer on mobile/tablet
   */
  function openMobileSidebar() {
    if (elements.sidebar) elements.sidebar.classList.add('open');
    if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.add('active');
  }

  /**
   * Closes sidebar drawer on mobile/tablet
   */
  function closeMobileSidebar() {
    if (elements.sidebar) elements.sidebar.classList.remove('open');
    if (elements.sidebarBackdrop) elements.sidebarBackdrop.classList.remove('active');
  }

  /**
   * Updates today's date badge in the top bar
   */
  function displayCurrentDate() {
    if (!elements.dateDisplay) return;
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    elements.dateDisplay.textContent = now.toLocaleDateString('en-US', options);
  }

  // ==========================================================================
  // App Initialization
  // ==========================================================================
  function init() {
    state.tasks = window.TaskStorage.getTasks();
    state.currentFilter = window.TaskStorage.getFilter();

    displayCurrentDate();
    setupColumnDropZones();
    initEventListeners();
    render();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
