const fs = require('fs');
const path = require('path');
const config = require('../config');
const { generateId } = require('../utils/idUtils');
const { nowDubaiISO } = require('../utils/dateUtils');

const dbPath = path.resolve(config.dbPath);

// Default database structure
const defaultDb = {
  tasks: [],
  reminders: [],
  notes: [],
  logs: [],
  messages: []
};

/**
 * Ensure database file exists, create if not
 */
const ensureDbExists = () => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
  }
};

/**
 * Read the entire database
 * @returns {Object} Database object
 */
const readDb = () => {
  ensureDbExists();
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
};

/**
 * Write data to database file
 * @param {Object} data - Data to write
 */
const writeDb = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

/**
 * Save a message to the messages array
 * @param {string} content - Message content
 * @param {string} chatId - Chat ID
 * @returns {Object} Saved message
 */
const saveMessage = (content, chatId) => {
  const db = readDb();
  const message = {
    id: generateId(),
    content,
    chatId,
    createdAt: nowDubaiISO()
  };
  db.messages.push(message);
  writeDb(db);
  return message;
};

/**
 * Create a new task
 * @param {Object} taskData - Task data from OpenAI
 * @returns {Object} Created task
 */
const createTask = (taskData) => {
  const db = readDb();
  const now = nowDubaiISO();
  const task = {
    id: generateId(),
    title: taskData.title || 'Untitled Task',
    description: taskData.description || '',
    priority: taskData.priority || 'medium',
    status: taskData.status || 'pending',
    createdAt: now,
    updatedAt: now
  };
  db.tasks.push(task);
  writeDb(db);
  return task;
};

/**
 * Create a new reminder
 * @param {Object} reminderData - Reminder data from OpenAI
 * @returns {Object} Created reminder
 */
const createReminder = (reminderData) => {
  const db = readDb();
  const now = nowDubaiISO();
  const reminder = {
    id: generateId(),
    title: reminderData.title || 'Untitled Reminder',
    description: reminderData.description || '',
    priority: reminderData.priority || 'medium',
    remindAt: reminderData.remindAt,
    recurring: reminderData.recurring || null, // "daily", "weekly", or null
    status: reminderData.status || 'pending',
    sent: false,
    createdAt: now,
    updatedAt: now
  };
  db.reminders.push(reminder);
  writeDb(db);
  return reminder;
};

/**
 * Save a note
 * @param {Object} noteData - Note data from OpenAI
 * @returns {Object} Saved note
 */
const saveNote = (noteData) => {
  const db = readDb();
  const now = nowDubaiISO();
  const note = {
    id: generateId(),
    title: noteData.title || 'Untitled Note',
    content: noteData.content || noteData.description || '',
    status: 'saved',
    createdAt: now,
    updatedAt: now
  };
  db.notes.push(note);
  writeDb(db);
  return note;
};

/**
 * Save a progress log
 * @param {Object} logData - Log data from OpenAI
 * @returns {Object} Saved log
 */
const saveLog = (logData) => {
  const db = readDb();
  const now = nowDubaiISO();
  const log = {
    id: generateId(),
    title: logData.title || 'Untitled Log',
    description: logData.description || '',
    status: logData.status || 'logged',
    createdAt: now,
    updatedAt: now
  };
  db.logs.push(log);
  writeDb(db);
  return log;
};

/**
 * Complete a task by title (find and update)
 * @param {string} title - Task title to find
 * @returns {Object|null} Updated task or null if not found
 */
const completeTask = (title) => {
  const db = readDb();
  const now = nowDubaiISO();
  const taskIndex = db.tasks.findIndex(
    t => t.title.toLowerCase().includes(title.toLowerCase()) && t.status !== 'completed'
  );

  if (taskIndex !== -1) {
    db.tasks[taskIndex].status = 'completed';
    db.tasks[taskIndex].updatedAt = now;
    writeDb(db);
    return db.tasks[taskIndex];
  }

  // If no matching task found, save as log
  return saveLog({ title, description: 'Marked as completed', status: 'completed' });
};

/**
 * Get all pending reminders that haven't been sent
 * @returns {Array} Array of pending reminders
 */
const getPendingReminders = () => {
  const db = readDb();
  return db.reminders.filter(r => !r.sent && r.status === 'pending');
};

/**
 * Mark a reminder as sent and completed
 * For recurring reminders, reschedule to next occurrence
 * @param {string} id - Reminder ID
 * @returns {Object|null} Updated reminder or null if not found
 */
const markReminderSent = (id) => {
  const db = readDb();
  const reminderIndex = db.reminders.findIndex(r => r.id === id);

  if (reminderIndex !== -1) {
    const reminder = db.reminders[reminderIndex];

    if (reminder.recurring === 'daily') {
      // Reschedule to next day at same time
      const currentTime = new Date(reminder.remindAt);
      currentTime.setDate(currentTime.getDate() + 1);
      db.reminders[reminderIndex].remindAt = currentTime.toISOString();
      db.reminders[reminderIndex].sent = false;
      db.reminders[reminderIndex].status = 'pending';
      db.reminders[reminderIndex].updatedAt = nowDubaiISO();
    } else {
      // One-time reminder - mark as done
      db.reminders[reminderIndex].sent = true;
      db.reminders[reminderIndex].status = 'done';
      db.reminders[reminderIndex].updatedAt = nowDubaiISO();
    }
    writeDb(db);
    return db.reminders[reminderIndex];
  }
  return null;
};

/**
 * Get database context for OpenAI
 * @returns {string} Stringified context
 */
const getContext = () => {
  const db = readDb();
  const context = {
    tasks: db.tasks.slice(-10), // Last 10 tasks
    reminders: db.reminders, // ALL reminders (for answering about history)
    notes: db.notes.slice(-5), // Last 5 notes
    logs: db.logs.slice(-5), // Last 5 logs
    messages: db.messages.slice(-5) // Last 5 messages
  };
  return JSON.stringify(context, null, 2);
};

/**
 * Delete an item by collection name and ID
 * @param {string} collection - 'messages', 'tasks', 'reminders', 'notes', 'logs'
 * @param {string} id - Item ID
 * @returns {Object|null} Deleted item or null if not found
 */
const deleteById = (collection, id) => {
  const db = readDb();
  if (!db[collection]) return null;

  const index = db[collection].findIndex(item => item.id === id);
  if (index !== -1) {
    const deleted = db[collection].splice(index, 1)[0];
    writeDb(db);
    return deleted;
  }
  return null;
};

/**
 * Delete items by title (partial match)
 * @param {string} collection - Collection name
 * @param {string} title - Title to match
 * @returns {Object|null} Deleted item or null
 */
const deleteByTitle = (collection, title) => {
  const db = readDb();
  if (!db[collection]) return null;

  const index = db[collection].findIndex(item =>
    item.title && item.title.toLowerCase().includes(title.toLowerCase())
  );
  if (index !== -1) {
    const deleted = db[collection].splice(index, 1)[0];
    writeDb(db);
    return deleted;
  }
  return null;
};

/**
 * Update an item by collection and ID
 * @param {string} collection - Collection name
 * @param {string} id - Item ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated item or null
 */
const updateById = (collection, id, updates) => {
  const db = readDb();
  if (!db[collection]) return null;

  const index = db[collection].findIndex(item => item.id === id);
  if (index !== -1) {
    db[collection][index] = {
      ...db[collection][index],
      ...updates,
      updatedAt: nowDubaiISO()
    };
    writeDb(db);
    return db[collection][index];
  }
  return null;
};

/**
 * Get all items from a collection
 * @param {string} collection - Collection name
 * @returns {Array} Array of items
 */
const getAll = (collection) => {
  const db = readDb();
  return db[collection] || [];
};

module.exports = {
  ensureDbExists,
  readDb,
  writeDb,
  saveMessage,
  createTask,
  createReminder,
  saveNote,
  saveLog,
  completeTask,
  getPendingReminders,
  markReminderSent,
  getContext,
  deleteById,
  deleteByTitle,
  updateById,
  getAll
};
