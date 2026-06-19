/**
 * Storage Module
 * Handles interactions with Browser LocalStorage
 */

const STORAGE_KEY = 'taskflow_tasks';
const ARCHIVE_KEY = 'taskflow_archive';

const Storage = {
    /**
     * Get all active tasks
     * @returns {Array} Array of task objects
     */
    getTasks() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading tasks from LocalStorage', e);
            return [];
        }
    },

    /**
     * Save active tasks
     * @param {Array} tasks Array of task objects
     */
    saveTasks(tasks) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error('Error saving tasks to LocalStorage', e);
        }
    },

    /**
     * Add a new task
     * @param {Object} task Task object
     */
    addTask(task) {
        const tasks = this.getTasks();
        tasks.push(task);
        this.saveTasks(tasks);
    },

    /**
     * Update an existing task
     * @param {String} taskId Unique task ID
     * @param {Object} updatedData Updated fields
     */
    updateTask(taskId, updatedData) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updatedData };
            this.saveTasks(tasks);
            return true;
        }
        return false;
    },

    /**
     * Delete an active task
     * @param {String} taskId Unique task ID
     */
    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        this.saveTasks(filteredTasks);
    },

    /**
     * Archive an active task
     * @param {String} taskId Unique task ID
     */
    archiveTask(taskId) {
        const tasks = this.getTasks();
        const taskToArchive = tasks.find(t => t.id === taskId);
        if (taskToArchive) {
            // Remove from active tasks
            this.deleteTask(taskId);
            
            // Add to archive
            const archivedTasks = this.getArchivedTasks();
            const archiveItem = {
                ...taskToArchive,
                archivedAt: new Date().toLocaleDateString()
            };
            archivedTasks.push(archiveItem);
            this.saveArchivedTasks(archivedTasks);
            return true;
        }
        return false;
    },

    /**
     * Get all archived tasks
     * @returns {Array} Array of archived task objects
     */
    getArchivedTasks() {
        try {
            const data = localStorage.getItem(ARCHIVE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading archived tasks from LocalStorage', e);
            return [];
        }
    },

    /**
     * Save archived tasks
     * @param {Array} archivedTasks Array of archived task objects
     */
    saveArchivedTasks(archivedTasks) {
        try {
            localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedTasks));
        } catch (e) {
            console.error('Error saving archived tasks to LocalStorage', e);
        }
    },

    /**
     * Clear all archived tasks
     */
    clearArchive() {
        try {
            localStorage.removeItem(ARCHIVE_KEY);
        } catch (e) {
            console.error('Error clearing archive', e);
        }
    }
};

