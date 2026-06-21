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
        }
    });
    
    document.addEventListener('dragend', (e) => {
        const card = e.target.closest('.task-card');
        if (card) {
            card.classList.remove('dragging');
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
    
    let todoCount = 0;
    let inProgressCount = 0;
    let doneCount = 0;
    
    tasks.forEach(task => {
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
    
    // Update badge counters
    document.getElementById('todoCount').textContent = todoCount;
    document.getElementById('inProgressCount').textContent = inProgressCount;
    document.getElementById('doneCount').textContent = doneCount;
}

function createTaskCardHTML(task) {
    const nextStatus = task.status === 'Todo' ? 'InProgress' : (task.status === 'InProgress' ? 'Done' : '');
    const prevStatus = task.status === 'Done' ? 'InProgress' : (task.status === 'InProgress' ? 'Todo' : '');
    
    return `
        <div class="task-card priority-${task.priority.toLowerCase()}" draggable="true" data-id="${task.id}">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold mb-0 text-break">${escapeHTML(task.title)}</h6>
                <span class="badge ${getPriorityBadgeClass(task.priority)}">${task.priority}</span>
            </div>
            <p class="small text-muted mb-3 text-break">${escapeHTML(task.description) || 'No description provided.'}</p>
            <div class="d-flex justify-content-between align-items-center">
                <span class="small text-muted fw-semibold">
                    <i class="far fa-calendar-alt me-1"></i>${task.dueDate ? formatDate(task.dueDate) : 'No due date'}
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
    Storage.updateTask(taskId, { status: newStatus });
    renderDashboard();
};

window.archiveTask = function(taskId) {
    if (confirm('Are you sure you want to archive this task? It will be moved to the archive list.')) {
        Storage.archiveTask(taskId);
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
