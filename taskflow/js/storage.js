/**
 * TaskFlow - LocalStorage Management Module
 * Handles safe serialization, retrieval, and seeding of task data with cover images and assignees.
 */

const STORAGE_KEY = 'taskflow_tasks';
const FILTER_KEY = 'taskflow_filter';

/**
 * Format date to YYYY-MM-DD relative to today
 * @param {number} daysOffset - Days to add or subtract from today
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getRelativeDateString(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Provides initial seed tasks with realistic imagery and team assignees
 * @returns {Array<Object>} List of sample task objects
 */
function getSeedTasks() {
  return [
    {
      id: 'task-seed-1',
      title: 'Conduct Q4 Security Audit & Pen-testing',
      description: 'Review JWT token expiration, CORS headers, and audit third-party dependency vulnerabilities.',
      priority: 'high',
      deadline: getRelativeDateString(-2), // Overdue
      status: 'todo',
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=80',
      assignee: {
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&auto=format&fit=crop&crop=face'
      },
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'task-seed-2',
      title: 'Prepare Sprint Retrospective Presentation',
      description: 'Compile velocity metrics, feedback surveys, and key blocker analysis for team sync.',
      priority: 'medium',
      deadline: getRelativeDateString(0), // Due today
      status: 'todo',
      image: '',
      assignee: {
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&auto=format&fit=crop&crop=face'
      },
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'task-seed-3',
      title: 'Implement Dark Mode & Theme Variables',
      description: 'Refactor CSS custom properties and test color contrast ratios against WCAG 2.1 AA standards.',
      priority: 'high',
      deadline: getRelativeDateString(1), // Due soon (tomorrow)
      status: 'inprogress',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      assignee: {
        name: 'David Park',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&auto=format&fit=crop&crop=face'
      },
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'task-seed-4',
      title: 'Update REST API Documentation in Swagger',
      description: 'Document newly added webhooks, rate limiting guidelines, and payload error schemas.',
      priority: 'low',
      deadline: getRelativeDateString(4), // Future
      status: 'inprogress',
      image: '',
      assignee: {
        name: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&auto=format&fit=crop&crop=face'
      },
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 'task-seed-5',
      title: 'Design Kanban Card Interaction Prototypes',
      description: 'Produce high-fidelity micro-interactions for drag-and-drop states and mobile touch gestures.',
      priority: 'medium',
      deadline: getRelativeDateString(-1), // Completed before deadline
      status: 'done',
      image: 'https://images.unsplash.com/photo-1581291518655-9523c93269c4?w=600&auto=format&fit=crop&q=80',
      assignee: {
        name: 'Alex Morgan',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&auto=format&fit=crop&crop=face'
      },
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ];
}

/**
 * TaskStorage API Object
 */
window.TaskStorage = {
  /**
   * Safely load tasks from LocalStorage
   * @returns {Array<Object>} Array of tasks, or seeded default tasks on initial load
   */
  getTasks() {
    try {
      const rawData = localStorage.getItem(STORAGE_KEY);
      if (!rawData) {
        // Initial first-time launch: seed default tasks
        const initialTasks = getSeedTasks();
        this.saveTasks(initialTasks);
        return initialTasks;
      }
      const parsed = JSON.parse(rawData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade any existing sample tasks that might lack image or assignee
        let updated = false;
        const seedMap = new Map(getSeedTasks().map(t => [t.id, t]));
        parsed.forEach(t => {
          if (seedMap.has(t.id)) {
            const seed = seedMap.get(t.id);
            if (!t.image && seed.image) {
              t.image = seed.image;
              updated = true;
            }
            if (!t.assignee && seed.assignee) {
              t.assignee = seed.assignee;
              updated = true;
            }
          }
        });
        if (updated) {
          this.saveTasks(parsed);
        }
        return parsed;
      }
      return getSeedTasks();
    } catch (error) {
      console.error('TaskStorage: Failed to retrieve tasks from localStorage:', error);
      return getSeedTasks();
    }
  },

  /**
   * Safely save tasks to LocalStorage
   * @param {Array<Object>} tasks - Array of task objects to persist
   * @returns {boolean} True if successfully saved, false otherwise
   */
  saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('TaskStorage: Failed to save tasks to localStorage:', error);
      return false;
    }
  },

  /**
   * Retrieve the active priority filter
   * @returns {string} Active filter ('all'|'high'|'medium'|'low')
   */
  getFilter() {
    try {
      const filter = localStorage.getItem(FILTER_KEY);
      if (['all', 'high', 'medium', 'low'].includes(filter)) {
        return filter;
      }
      return 'all';
    } catch (error) {
      console.error('TaskStorage: Failed to get filter preference:', error);
      return 'all';
    }
  },

  /**
   * Persist the active priority filter
   * @param {string} filter - Priority filter value
   */
  saveFilter(filter) {
    try {
      localStorage.setItem(FILTER_KEY, filter);
    } catch (error) {
      console.error('TaskStorage: Failed to save filter preference:', error);
    }
  },

  /**
   * Clear all tasks from storage
   * @returns {boolean} True if cleared
   */
  clearTasks() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('TaskStorage: Failed to clear tasks:', error);
      return false;
    }
  },

  /**
   * Force re-seed default sample tasks
   * @returns {Array<Object>} Seeded tasks
   */
  resetToSampleTasks() {
    const seed = getSeedTasks();
    this.saveTasks(seed);
    return seed;
  }
};
