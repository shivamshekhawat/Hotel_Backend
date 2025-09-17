const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Simple logger utility
 */
class Logger {
  constructor() {
    this.logFile = path.join(logsDir, 'app.log');
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  writeToFile(message) {
    fs.appendFileSync(this.logFile, message + '\n');
  }

  info(message, meta = {}) {
    const formattedMessage = this.formatMessage('info', message, meta);
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  error(message, meta = {}) {
    const formattedMessage = this.formatMessage('error', message, meta);
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage('warn', message, meta);
    console.warn(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('debug', message, meta);
      console.debug(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }
}

module.exports = new Logger();
