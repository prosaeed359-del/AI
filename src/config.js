require('dotenv').config();

module.exports = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  ownerChatId: process.env.OWNER_CHAT_ID || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  dbPath: './db.json',
  reminderInterval: '* * * * *', // Every minute
  timezone: 'Asia/Dubai'
};
