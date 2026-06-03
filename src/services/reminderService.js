const cron = require('node-cron');
const config = require('../config');
const databaseService = require('./databaseService');
const telegramService = require('./telegramService');

/**
 * Generate a warm and supportive reminder message
 * @param {Object} reminder - The reminder object
 * @returns {string} Warm reminder message
 */
const generateWarmReminderMessage = (reminder) => {
  const { title, description } = reminder;

  // Encouraging phrases to randomly rotate
  const encouragements = [
    "You've got this! 💪",
    "Take a moment to tackle this - you've been doing great!",
    "A gentle nudge for you! You're capable of amazing things.",
    "Remember: every small step counts. You've got this!",
    "Time to check this off your list - you're making progress!",
    "Here's your friendly reminder - you're on the right track!",
    "Sending you positive vibes as you work through this! 🌟"
  ];

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  // Build the warm message with enhanced formatting
  let warmMessage = `🌻 Hey there, love!\n\n`;
  warmMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
  warmMessage += `📋 ${title}\n`;
  warmMessage += `━━━━━━━━━━━━━━━━━━━━\n`;

  if (description && description.trim()) {
    warmMessage += `\n${description}\n`;
  }

  warmMessage += `\n✨ ${randomEncouragement}`;

  return warmMessage;
};

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

        // Send warm and supporting reminder message to owner
        const warmMessage = generateWarmReminderMessage(reminder);
        await telegramService.sendOwnerMessage(warmMessage);

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
