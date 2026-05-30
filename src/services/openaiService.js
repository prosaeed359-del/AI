const OpenAI = require('openai');
const config = require('../config');
const { getClassifierPrompt } = require('../prompts/classifierPrompt');
const databaseService = require('./databaseService');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey
});

/**
 * Process a user message and get AI classification
 * @param {string} message - User's message
 * @returns {Object} Parsed AI response
 */
const processMessage = async (message) => {
  try {
    // Get database context for better classification
    const context = databaseService.getContext();
    const prompt = getClassifierPrompt(context);

    const response = await openai.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Try to parse the JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      // Try to repair invalid JSON
      result = tryRepairJson(content);
      if (!result) {
        throw new Error('Failed to parse JSON response');
      }
    }

    // Validate the result structure
    if (!result.intent || !result.reply) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return result;
  } catch (error) {
    console.error('OpenAI Service Error:', error.message);
    throw error;
  }
};

/**
 * Try to repair invalid JSON by extracting JSON object
 * @param {string} text - Text potentially containing JSON
 * @returns {Object|null} Parsed object or null if failed
 */
const tryRepairJson = (text) => {
  try {
    // Try to find JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Handle AI result by saving to appropriate database collection
 * @param {Object} aiResult - AI classification result
 * @returns {Object} The processed result with saved entity info
 */
const handleAiResult = (aiResult) => {
  let savedEntity = null;

  switch (aiResult.intent) {
    case 'create_task':
      savedEntity = databaseService.createTask(aiResult.data || {});
      break;

    case 'create_reminder':
      savedEntity = databaseService.createReminder(aiResult.data || {});
      break;

    case 'save_note':
      savedEntity = databaseService.saveNote(aiResult.data || {});
      break;

    case 'progress_log':
      savedEntity = databaseService.saveLog(aiResult.data || {});
      break;

    case 'complete_task':
      savedEntity = databaseService.completeTask(aiResult.data?.title || '');
      break;

    case 'delete_item':
      if (aiResult.data?.title) {
        savedEntity = databaseService.deleteByTitle(aiResult.data.collection || 'tasks', aiResult.data.title);
      } else if (aiResult.data?.id) {
        savedEntity = databaseService.deleteById(aiResult.data.collection || 'tasks', aiResult.data.id);
      }
      break;

    case 'update_item':
      if (aiResult.data?.id) {
        savedEntity = databaseService.updateById(aiResult.data.collection || 'tasks', aiResult.data.id, aiResult.data.updates || {});
      }
      break;

    case 'ask_question':
      // Just save the message, no entity created
      break;

    case 'unknown':
    default:
      // Save as log if there's data
      if (aiResult.data && aiResult.data.title) {
        savedEntity = databaseService.saveLog(aiResult.data);
      }
      break;
  }

  return {
    ...aiResult,
    savedEntity
  };
};

module.exports = {
  processMessage,
  handleAiResult
};
