/**
 * Generate a unique ID using timestamp and random string
 * @returns {string} Unique ID
 */
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
};

module.exports = { generateId };
