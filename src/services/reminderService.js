const cron = require('node-cron');
const config = require('../config');
const databaseService = require('./databaseService');
const telegramService = require('./telegramService');

/**
 * Check for due reminders and send alerts
 */
const checkReminders = async () => {
  try {
    const pendingReminders = databaseService.getPendingReminders();
    const now = new Date();

    for (const reminder of pendingReminders) {
      const remindAt = new Date(reminder.remindAt);

      if (remindAt <= now) {
        console.log(`Sending reminder: ${reminder.title}`);

        // Send reminder message to owner
        await telegramService.sendOwnerMessage(`Reminder: ${reminder.title}`);

        // Mark reminder as sent
        databaseService.markReminderSent(reminder.id);
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error.message);
  }
};

/**
 * Start the cron job for reminder checks
 */
const startReminderScheduler = () => {
  console.log(`Starting reminder scheduler (runs every minute at ${config.reminderInterval})`);

  cron.schedule(config.reminderInterval, () => {
    checkReminders();
  });

  // Run once at startup to check for any missed reminders
  setTimeout(() => {
    checkReminders();
  }, 5000);
};

module.exports = {
  checkReminders,
  startReminderScheduler
};
