/**
 * Main Application Module
 * Handles UI events and DOM manipulation
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('TaskFlow Initialized');
    initThemeToggle();
    if (document.getElementById('taskForm')) {
        initDashboard();
    }
    if (document.getElementById('contactForm')) {
        initContactForm();
    }
    if (document.getElementById('archiveTableBody')) {
        initArchive();
    }
    if (document.getElementById('activeTasksCount')) {
        initAnalytics();
    }
    if (document.getElementById('heroStats')) {
        initHomepageStats();
    }
    if (document.getElementById('faqSearchInput')) {
        initFAQ();
    }
});

/**
 * Theme Toggling Logic
 */
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggle');
    if (!themeToggleBtn) return;

    // Set initial icon based on current theme
    updateThemeToggleIcon();

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Apply theme transition class for smooth visual changes
        document.body.classList.add('theme-transition');
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('taskflow_theme', newTheme);
        
        updateThemeToggleIcon();
        
        // Remove transition class after animation finishes
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
    });
}

function updateThemeToggleIcon() {
    const themeToggleBtn = document.getElementById('themeToggle');
    if (!themeToggleBtn) return;
    
    const icon = themeToggleBtn.querySelector('i');
    if (!icon) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (currentTheme === 'dark') {
        icon.className = 'fas fa-sun';
        themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
    } else {
        icon.className = 'fas fa-moon';
        themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
    }
}

/**
 * Dashboard & Kanban Board Module
 */
let editModalInstance = null;

function initDashboard() {
    const taskForm = document.getElementById('taskForm');
    const editTaskForm = document.getElementById('editTaskForm');
    
    // Initialize Bootstrap Modal
    const editModalEl = document.getElementById('editTaskModal');
    if (editModalEl) {
        editModalInstance = new bootstrap.Modal(editModalEl);
    }

    // Search and Filter Listeners
    const searchBar = document.getElementById('searchBar');
    const filterPriority = document.getElementById('filterPriority');
    const sortBy = document.getElementById('sortBy');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            if (clearSearchBtn) {
                clearSearchBtn.style.display = searchBar.value.trim() !== '' ? 'block' : 'none';
            }
            renderDashboard();
        });
    }
    if (clearSearchBtn && searchBar) {
        clearSearchBtn.addEventListener('click', () => {
            searchBar.value = '';
            clearSearchBtn.style.display = 'none';
            searchBar.focus();
            renderDashboard();
        });
    }
    if (filterPriority) {
        filterPriority.addEventListener('change', () => {
            renderDashboard();
        });
    }
    if (sortBy) {
        sortBy.addEventListener('change', () => {
            renderDashboard();
        });
    }

    // Export Backup Handler
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = {
                tasks: Storage.getTasks(),
                archive: Storage.getArchivedTasks()
            };
            const jsonStr = JSON.stringify(data, null, 4);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `taskflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Backup file exported successfully!');
        });
    }

    // Import Backup Handler
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (data && (Array.isArray(data.tasks) || Array.isArray(data.archive))) {
                        if (confirm('Valid backup file loaded. Overwrite current board and archive database with imported tasks?')) {
                            Storage.importData(data);
                            renderDashboard();
                            showToast('Data backup successfully restored!');
                        }
                    } else {
                        showToast('Invalid backup format. Backup must contain task objects.', 'danger');
                    }
                } catch (err) {
                    console.error('Error reading backup file', err);
                    showToast('Error parsing backup file. Ensure it is a valid JSON file.', 'danger');
                }
            };
            reader.readAsText(file);
            importFile.value = ''; // Reset file input
        });
    }
    
    // Task addition submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const description = document.getElementById('taskDescription').value.trim();
        
        if (!title) return;
        
        const newTask = {
            id: Date.now().toString(),
            title,
            priority,
            dueDate,
            description,
            status: 'Todo',
            createdAt: new Date().toISOString()
        };
        
        Storage.addTask(newTask);
        taskForm.reset();
        
        // Set default priority selection back to Medium
        document.getElementById('taskPriority').value = 'Medium';
        
        showToast('Task added to the board successfully!');
        renderDashboard();
    });
    
    // Task editing submission
    if (editTaskForm) {
        editTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const id = document.getElementById('editTaskId').value;
            const title = document.getElementById('editTaskTitle').value.trim();
            const priority = document.getElementById('editTaskPriority').value;
            const dueDate = document.getElementById('editTaskDueDate').value;
            const description = document.getElementById('editTaskDescription').value.trim();
            
            if (!title || !id) return;
            
            Storage.updateTask(id, {
                title,
                priority,
                dueDate,
                description
            });
            
            if (editModalInstance) {
                editModalInstance.hide();
            }
            
            showToast('Task updated successfully!');
            renderDashboard();
        });
    }
    
    // Setup Column Drop Zones
    const columns = document.querySelectorAll('.task-column');
    columns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault(); // Required to allow drop
        });
        
        col.addEventListener('dragenter', (e) => {
            e.preventDefault();
            col.classList.add('drag-over');
        });
        
        col.addEventListener('dragleave', () => {
            col.classList.remove('drag-over');
        });
        
        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('text/plain');
            const targetStatus = col.getAttribute('data-status');
            
            if (taskId && targetStatus) {
                const tasks = Storage.getTasks();
                const task = tasks.find(t => t.id === taskId);
                if (task && task.status !== targetStatus) {
                    Storage.updateTask(taskId, { status: targetStatus });
                    const statusNames = { 'Todo': 'To Do', 'InProgress': 'In Progress', 'Done': 'Done' };
                    showToast(`Task moved to "${statusNames[targetStatus] || targetStatus}"`);
                    renderDashboard();
                }
            }
        });
    });

    // Setup Card Drag Event Delegation
    document.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.task-card');
        if (card) {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
            e.dataTransfer.effectAllowed = 'move';
            
            // Add visual helper for active drop zones
            document.querySelectorAll('.task-column').forEach(col => {
                col.classList.add('drag-active');
            });
        }
    });
    
    document.addEventListener('dragend', (e) => {
        const card = e.target.closest('.task-card');
        if (card) {
            card.classList.remove('dragging');
        }
        // Remove active visual helpers from columns
        document.querySelectorAll('.task-column').forEach(col => {
            col.classList.remove('drag-active');
            col.classList.remove('drag-over');
        });
    });

    // Interactive Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input, textarea, select, or editable element
        const activeEl = document.activeElement;
        if (activeEl && (
            activeEl.tagName === 'INPUT' || 
            activeEl.tagName === 'TEXTAREA' || 
            activeEl.tagName === 'SELECT' || 
            activeEl.isContentEditable
        )) {
            return;
        }

        // 'c' or 'C' to focus task title input
        if (e.key === 'c' || e.key === 'C') {
            const taskTitleInput = document.getElementById('taskTitle');
            if (taskTitleInput) {
                e.preventDefault();
                taskTitleInput.focus();
                taskTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        // '/' to focus search bar
        if (e.key === '/') {
            const searchBar = document.getElementById('searchBar');
            if (searchBar) {
                e.preventDefault();
                searchBar.focus();
                searchBar.select();
                const clearSearchBtn = document.getElementById('clearSearchBtn');
                if (clearSearchBtn) {
                    clearSearchBtn.style.display = searchBar.value.trim() !== '' ? 'block' : 'none';
                }
            }
        }

        // 'Escape' to blur focus from active element
        if (e.key === 'Escape') {
            if (activeEl && activeEl !== document.body) {
                activeEl.blur();
            }
        }
    });

    // Render initial board
    renderDashboard();
}

function renderDashboard() {
    const todoList = document.getElementById('todoList');
    const inProgressList = document.getElementById('inProgressList');
    const doneList = document.getElementById('doneList');
    
    if (!todoList || !inProgressList || !doneList) return;
    
    // Clear list columns
    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';
    
    const tasks = Storage.getTasks();

    // Read search query, priority filter, & sort options
    const searchBar = document.getElementById('searchBar');
    const filterPriority = document.getElementById('filterPriority');
    const sortBy = document.getElementById('sortBy');
    const query = searchBar ? searchBar.value.toLowerCase().trim() : '';
    const selectedPriority = filterPriority ? filterPriority.value : 'All';
    const selectedSort = sortBy ? sortBy.value : 'default';
    
    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = !query || 
                              task.title.toLowerCase().includes(query) || 
                              task.description.toLowerCase().includes(query);
        const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;
        return matchesSearch && matchesPriority;
    });

    // Sort tasks
    if (selectedSort === 'dueDateAsc') {
        filteredTasks.sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
            const dateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
            return dateA - dateB;
        });
    } else if (selectedSort === 'dueDateDesc') {
        filteredTasks.sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate) : new Date('1970-01-01');
            const dateB = b.dueDate ? new Date(b.dueDate) : new Date('1970-01-01');
            return dateB - dateA;
        });
    } else if (selectedSort === 'priorityHigh') {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        filteredTasks.sort((a, b) => {
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });
    } else if (selectedSort === 'priorityLow') {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        filteredTasks.sort((a, b) => {
            return (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
        });
    }
    
    let todoCount = 0;
    let inProgressCount = 0;
    let doneCount = 0;
    
    filteredTasks.forEach(task => {
        const cardHTML = createTaskCardHTML(task);
        
        if (task.status === 'Todo') {
            todoList.insertAdjacentHTML('beforeend', cardHTML);
            todoCount++;
        } else if (task.status === 'InProgress') {
            inProgressList.insertAdjacentHTML('beforeend', cardHTML);
            inProgressCount++;
        } else if (task.status === 'Done') {
            doneList.insertAdjacentHTML('beforeend', cardHTML);
            doneCount++;
        }
    });
    
    // Render empty state placeholders if columns have no tasks
    if (todoCount === 0) {
        todoList.innerHTML = `
            <div class="empty-column-placeholder text-center py-4 px-2 small opacity-75">
                <i class="fas fa-clipboard-list mb-2 d-block text-muted"></i>No tasks here
            </div>
        `;
    }
    if (inProgressCount === 0) {
        inProgressList.innerHTML = `
            <div class="empty-column-placeholder text-center py-4 px-2 small opacity-75">
                <i class="fas fa-spinner mb-2 d-block text-muted"></i>No tasks here
            </div>
        `;
    }
    if (doneCount === 0) {
        doneList.innerHTML = `
            <div class="empty-column-placeholder text-center py-4 px-2 small opacity-75">
                <i class="fas fa-check-circle mb-2 d-block text-muted"></i>No tasks here
            </div>
        `;
    }
    
    // Update badge counters
    document.getElementById('todoCount').textContent = todoCount;
    document.getElementById('inProgressCount').textContent = inProgressCount;
    document.getElementById('doneCount').textContent = doneCount;
}

function createTaskCardHTML(task) {
    const nextStatus = task.status === 'Todo' ? 'InProgress' : (task.status === 'InProgress' ? 'Done' : '');
    const prevStatus = task.status === 'Done' ? 'InProgress' : (task.status === 'InProgress' ? 'Todo' : '');
    
    // Check if task is overdue (due date is in the past and status is not Done)
    let isOverdue = false;
    if (task.dueDate && task.status !== 'Done') {
        const due = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        isOverdue = due < today;
    }
    
    const overdueClass = isOverdue ? 'overdue-card' : '';
    const dateIconClass = isOverdue ? 'fas fa-exclamation-triangle text-danger' : 'far fa-calendar-alt';
    const dateTextClass = isOverdue ? 'text-danger fw-bold' : '';
    
    return `
        <div class="task-card priority-${task.priority.toLowerCase()} ${overdueClass}" draggable="true" data-id="${task.id}">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0 text-break">${escapeHTML(task.title)}</h6>
                <span class="badge ${getPriorityBadgeClass(task.priority)}">${task.priority}</span>
            </div>
            <p class="small text-muted mb-3 text-break">${escapeHTML(task.description) || 'No description provided.'}</p>
            <div class="d-flex justify-content-between align-items-center">
                <span class="small text-muted fw-semibold ${dateTextClass}">
                    <i class="${dateIconClass} me-1"></i>${task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                </span>
                <div class="d-flex gap-1">
                    <!-- Shift Navigation -->
                    ${prevStatus ? `<button class="btn btn-sm btn-outline-secondary py-0 px-1 border-0" onclick="shiftStatus('${task.id}', '${prevStatus}')" title="Move Back"><i class="fas fa-chevron-left fa-xs"></i></button>` : ''}
                    ${nextStatus ? `<button class="btn btn-sm btn-outline-secondary py-0 px-1 border-0" onclick="shiftStatus('${task.id}', '${nextStatus}')" title="Move Forward"><i class="fas fa-chevron-right fa-xs"></i></button>` : ''}
                    
                    <button class="btn btn-sm btn-outline-primary py-0 px-1 border-0 ms-1" onclick="openEditModal('${task.id}')" title="Edit Task"><i class="fas fa-edit fa-xs"></i></button>
                    <button class="btn btn-sm btn-outline-danger py-0 px-1 border-0" onclick="archiveTask('${task.id}')" title="Archive Task"><i class="fas fa-archive fa-xs"></i></button>
                </div>
            </div>
        </div>
    `;
}

// Exposure of actions on window object for inline onclick handlers
window.shiftStatus = function(taskId, newStatus) {
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    Storage.updateTask(taskId, { status: newStatus });
    if (task) {
        const statusNames = { 'Todo': 'To Do', 'InProgress': 'In Progress', 'Done': 'Done' };
        showToast(`Task moved to "${statusNames[newStatus] || newStatus}"`);
    }
    renderDashboard();
};

window.archiveTask = function(taskId) {
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (confirm('Are you sure you want to archive this task? It will be moved to the archive list.')) {
        Storage.archiveTask(taskId);
        if (task) {
            showToast(`Task "${task.title}" successfully archived!`);
        }
        renderDashboard();
    }
};

window.openEditModal = function(taskId) {
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskDueDate').value = task.dueDate || '';
    document.getElementById('editTaskDescription').value = task.description || '';
    
    if (editModalInstance) {
        editModalInstance.show();
    }
};

/**
 * Utility Helper Functions
 */
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function getPriorityBadgeClass(priority) {
    if (priority === 'High') return 'bg-danger text-white';
    if (priority === 'Medium') return 'bg-warning text-dark';
    return 'bg-info text-dark';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch (e) {
        return dateStr;
    }
}

/**
 * Toast Notification System using Bootstrap Toast
 */
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1080';
        document.body.appendChild(container);
    }
    
    const toastId = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 6);
    const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-info';
    const textClass = 'text-white';
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} ${textClass} border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="fas ${iconClass}"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = document.getElementById(toastId);
    
    const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
    bsToast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}
window.showToast = showToast;

/**
 * Contact Form Module
 */
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        // Clear existing alerts if any
        const existingAlert = contactForm.querySelector('.alert');
        if (existingAlert) existingAlert.remove();

        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showContactAlert('Please enter a valid email address.', 'danger');
            return;
        }

        // Message length validation
        if (message.length < 10) {
            showContactAlert('Please enter a message containing at least 10 characters.', 'danger');
            return;
        }

        // Simulating submission success
        showContactAlert(`Thank you, ${escapeHTML(firstName)}! Your message has been sent successfully.`, 'success');
        contactForm.reset();
    });
}

function showContactAlert(msg, type) {
    const contactForm = document.getElementById('contactForm');
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show mt-3 shadow-sm" role="alert">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
            ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    contactForm.insertAdjacentHTML('beforeend', alertHTML);
}

/**
 * Archive Module
 */
function initArchive() {
    const clearArchiveBtn = document.getElementById('clearArchiveBtn');
    
    if (clearArchiveBtn) {
        clearArchiveBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to permanently delete all archived tasks? This action cannot be undone.')) {
                Storage.clearArchive();
                showToast('All archived tasks permanently cleared.', 'danger');
                renderArchive();
            }
        });
    }

    renderArchive();
}

function renderArchive() {
    const archiveTableBody = document.getElementById('archiveTableBody');
    const archiveTableContainer = document.getElementById('archiveTableContainer');
    const emptyArchiveState = document.getElementById('emptyArchiveState');
    const clearArchiveBtn = document.getElementById('clearArchiveBtn');

    if (!archiveTableBody) return;

    const archivedTasks = Storage.getArchivedTasks();

    if (archivedTasks.length === 0) {
        if (archiveTableContainer) archiveTableContainer.classList.add('d-none');
        if (emptyArchiveState) emptyArchiveState.classList.remove('d-none');
        if (clearArchiveBtn) clearArchiveBtn.disabled = true;
        archiveTableBody.innerHTML = '';
        return;
    }

    if (archiveTableContainer) archiveTableContainer.classList.remove('d-none');
    if (emptyArchiveState) emptyArchiveState.classList.add('d-none');
    if (clearArchiveBtn) clearArchiveBtn.disabled = false;

    archiveTableBody.innerHTML = '';

    archivedTasks.forEach(task => {
        const rowHTML = `
            <tr>
                <td class="fw-semibold">${escapeHTML(task.title)}</td>
                <td><span class="badge ${getPriorityBadgeClass(task.priority)}">${task.priority}</span></td>
                <td class="text-muted"><i class="far fa-calendar-check me-1"></i>${task.archivedAt || 'Unknown Date'}</td>
                <td><span class="badge bg-success"><i class="fas fa-check me-1"></i>Completed</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger border-0 py-0" onclick="deleteArchivedTask('${task.id}')" title="Delete Permanently">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
        archiveTableBody.insertAdjacentHTML('beforeend', rowHTML);
    });
}

window.deleteArchivedTask = function(taskId) {
    if (confirm('Are you sure you want to permanently delete this task from the archive? This action cannot be undone.')) {
        Storage.deleteArchivedTask(taskId);
        showToast('Task permanently deleted from the archive.', 'danger');
        renderArchive();
    }
};

/**
 * Analytics Module
 */
function initAnalytics() {
    renderAnalytics();
}

function renderAnalytics() {
    const activeTasksCountEl = document.getElementById('activeTasksCount');
    const completedTasksCountEl = document.getElementById('completedTasksCount');
    const archivedTasksCountEl = document.getElementById('archivedTasksCount');
    const completionRateValueEl = document.getElementById('completionRateValue');
    
    const todoProgressBar = document.getElementById('todoProgressBar');
    const inprogressProgressBar = document.getElementById('inprogressProgressBar');
    const doneProgressBar = document.getElementById('doneProgressBar');
    
    const highPriorityCountEl = document.getElementById('highPriorityCount');
    const mediumPriorityCountEl = document.getElementById('mediumPriorityCount');
    const lowPriorityCountEl = document.getElementById('lowPriorityCount');

    if (!activeTasksCountEl) return;

    const tasks = Storage.getTasks();
    const archivedTasks = Storage.getArchivedTasks();

    const activeTasksCount = tasks.length;
    const completedActive = tasks.filter(t => t.status === 'Done').length;
    const archivedTasksCount = archivedTasks.length;

    const totalCompleted = completedActive + archivedTasksCount;
    const totalCreated = activeTasksCount + archivedTasksCount;
    const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

    // Render basic counter metrics
    activeTasksCountEl.textContent = activeTasksCount;
    completedTasksCountEl.textContent = completedActive;
    archivedTasksCountEl.textContent = archivedTasksCount;
    completionRateValueEl.textContent = completionRate + '%';

    const completionRateMessageEl = document.getElementById('completionRateMessage');
    if (completionRateMessageEl) {
        let msg = '';
        if (totalCreated === 0) {
            msg = 'No tasks created yet.';
        } else if (completionRate === 0) {
            msg = 'No tasks completed yet.';
        } else if (completionRate < 35) {
            msg = 'Getting started! Keep taking action.';
        } else if (completionRate < 70) {
            msg = 'Good progress! You are on track.';
        } else if (completionRate < 100) {
            msg = 'Excellent productivity! Almost done.';
        } else {
            msg = 'Perfect score! All tasks completed.';
        }
        completionRateMessageEl.textContent = msg;
    }

    // Calculate Column Distribution Percentages (Avoid division by zero)
    const todoCount = tasks.filter(t => t.status === 'Todo').length;
    const inProgressCount = tasks.filter(t => t.status === 'InProgress').length;
    const doneCount = completedActive;

    const todoPct = activeTasksCount > 0 ? Math.round((todoCount / activeTasksCount) * 100) : 0;
    const inProgressPct = activeTasksCount > 0 ? Math.round((inProgressCount / activeTasksCount) * 100) : 0;
    const donePct = activeTasksCount > 0 ? Math.round((doneCount / activeTasksCount) * 100) : 0;

    // Apply to Progress Bars
    if (todoProgressBar) {
        todoProgressBar.style.width = todoPct + '%';
        todoProgressBar.textContent = todoPct + '%';
        todoProgressBar.setAttribute('aria-valuenow', todoPct);
    }
    if (inprogressProgressBar) {
        inprogressProgressBar.style.width = inProgressPct + '%';
        inprogressProgressBar.textContent = inProgressPct + '%';
        inprogressProgressBar.setAttribute('aria-valuenow', inProgressPct);
    }
    if (doneProgressBar) {
        doneProgressBar.style.width = donePct + '%';
        doneProgressBar.textContent = donePct + '%';
        doneProgressBar.setAttribute('aria-valuenow', donePct);
    }

    // Priority Breakdown (Active + Archived tasks to reflect historic productivity)
    const highCount = tasks.filter(t => t.priority === 'High').length + archivedTasks.filter(t => t.priority === 'High').length;
    const mediumCount = tasks.filter(t => t.priority === 'Medium').length + archivedTasks.filter(t => t.priority === 'Medium').length;
    const lowCount = tasks.filter(t => t.priority === 'Low').length + archivedTasks.filter(t => t.priority === 'Low').length;

    if (highPriorityCountEl) highPriorityCountEl.textContent = highCount;
    if (mediumPriorityCountEl) mediumPriorityCountEl.textContent = mediumCount;
    if (lowPriorityCountEl) lowPriorityCountEl.textContent = lowCount;
}

/**
 * Homepage Module
 */
function initHomepageStats() {
    const heroStats = document.getElementById('heroStats');
    const heroTaskCount = document.getElementById('heroTaskCount');
    if (!heroStats || !heroTaskCount) return;

    // Safety check in case Storage module is not loaded on this page
    if (typeof Storage === 'undefined' || typeof Storage.getTasks !== 'function') {
        console.warn('Storage module is not loaded.');
        return;
    }

    try {
        const tasks = Storage.getTasks();
        if (tasks && tasks.length > 0) {
            heroTaskCount.textContent = tasks.length;
            heroStats.style.display = 'block';
        }
    } catch (e) {
        console.error('Error fetching homepage task counts', e);
    }
}

/**
 * FAQ Search Module
 */
function initFAQ() {
    const faqSearchInput = document.getElementById('faqSearchInput');
    if (!faqSearchInput) return;
    
    faqSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const items = document.querySelectorAll('#faqAccordion .accordion-item');
        
        items.forEach(item => {
            const buttonText = item.querySelector('.accordion-button').textContent.toLowerCase();
            const bodyText = item.querySelector('.accordion-body').textContent.toLowerCase();
            
            if (buttonText.includes(query) || bodyText.includes(query)) {
                item.classList.remove('d-none');
            } else {
                item.classList.add('d-none');
            }
        });
    });
}
