// middleware/logger.js - Logging middleware

const winston = require('winston');

/**
 * Initialize Winston logger
 */
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ],
});

/**
 * Request logging middleware
 * Logs all incoming HTTP requests
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request details
    logger.info(`[${req.method}] ${req.url} - IP: ${req.ip}`);
    
    // Log response when request finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
        
        logger.log(logLevel, `[${req.method}] ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
};

/**
 * Error logging middleware
 * Specifically logs errors with additional context
 */
const errorLogger = (err, req, res, next) => {
    logger.error('Request Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.currentUser ? `User ID: ${req.currentUser.id}, Role: ${req.currentUser.role}` : 'Anonymous'
    });
    
    next(err); // Pass error to error handler
};

module.exports = {
    logger,
    requestLogger,
    errorLogger
};