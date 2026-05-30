const config = require('../config');

/**
 * Get current time in Asia/Dubai timezone
 * @returns {Date} Current date in Dubai timezone
 */
const getDubaiTime = () => {
  return new Date().toLocaleString('en-US', { timeZone: config.timezone });
};

/**
 * Convert Dubai time to ISO string with timezone offset
 * @param {Date} date - Date object
 * @returns {string} ISO string with +04:00 timezone
 */
const toDubaiISOString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+04:00`;
};

/**
 * Parse a date string and return Dubai time
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {Date} Parsed date in Dubai timezone
 */
const parseDubaiDate = (dateInput) => {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  return new Date(dateInput);
};

/**
 * Get current Dubai time as ISO string
 * @returns {string} ISO string with +04:00 timezone
 */
const nowDubaiISO = () => {
  return toDubaiISOString(new Date());
};

module.exports = {
  getDubaiTime,
  toDubaiISOString,
  parseDubaiDate,
  nowDubaiISO
};
