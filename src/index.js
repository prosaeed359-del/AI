require('dotenv').config();

const config = require('./config');
const databaseService = require('./services/databaseService');
const telegramService = require('./services/telegramService');
const reminderService = require('./services/reminderService');

/**
 * Main application entry point
 */
const main = async () => {
  console.log('Starting Personal AI Agent...');

  // Validate required environment variables
  if (!config.telegramBotToken) {
    console.error('Error: TELEGRAM_BOT_TOKEN is not set in .env');
    process.exit(1);
  }

  if (!config.openaiApiKey) {
    console.error('Error: OPENAI_API_KEY is not set in .env');
    process.exit(1);
  }

  if (!config.ownerChatId) {
    console.warn('Warning: OWNER_CHAT_ID is not set. Reminders will not be sent to any chat.');
  }

  // Initialize database
  console.log('Initializing database...');
  databaseService.ensureDbExists();
  console.log('Database initialized successfully');

  // Start the reminder scheduler (cron runs every minute)
  reminderService.startReminderScheduler();

  // Start the Telegram bot
  console.log('Starting Telegram bot...');
  telegramService.startBot();

  console.log('Personal AI Agent is running!');
  console.log(`Timezone: ${config.timezone}`);
  console.log(`OpenAI Model: ${config.openaiModel}`);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the application
main();
