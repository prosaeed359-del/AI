const { Telegraf } = require('telegraf');
const config = require('../config');
const openaiService = require('./openaiService');
const databaseService = require('./databaseService');

// Initialize Telegraf bot
const bot = new Telegraf(config.telegramBotToken);

/**
 * Start the Telegram bot and set up message handlers
 */
const startBot = () => {
  // Handle /start command
  bot.command('start', (ctx) => {
    ctx.reply('Hello! I am your personal AI assistant. Send me a message and I will help you manage tasks, reminders, notes, and more!');
  });

  // Handle all text messages
  bot.on('text', async (ctx) => {
    const message = ctx.message.text;
    const chatId = ctx.chat.id.toString();

    console.log(`Received message from ${chatId}: ${message}`);

    try {
      // Save the incoming message to database
      databaseService.saveMessage(message, chatId);

      // Process message through OpenAI
      const aiResult = await openaiService.processMessage(message);

      // Handle the result (save to appropriate collection)
      const handledResult = openaiService.handleAiResult(aiResult);

      // Reply to user
      await ctx.reply(handledResult.reply);
    } catch (error) {
      console.error('Error processing message:', error.message);
      // Send error reply
      await ctx.reply('Sorry, I could not process that message.');
    }
  });

  // Handle errors
  bot.catch((err) => {
    console.error('Telegram Bot Error:', err.message);
  });

  // Start the bot
  bot.launch().then(() => {
    console.log('Telegram bot started successfully');
  }).catch((err) => {
    console.error('Failed to start Telegram bot:', err.message);
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

/**
 * Send a message directly to the owner
 * @param {string} message - Message to send
 * @returns {Promise<void>}
 */
const sendOwnerMessage = async (message) => {
  if (!config.ownerChatId) {
    console.error('OWNER_CHAT_ID not configured');
    return;
  }

  try {
    await bot.telegram.sendMessage(config.ownerChatId, message);
    console.log(`Sent message to owner: ${message}`);
  } catch (error) {
    console.error('Failed to send message to owner:', error.message);
  }
};

module.exports = {
  startBot,
  sendOwnerMessage
};
