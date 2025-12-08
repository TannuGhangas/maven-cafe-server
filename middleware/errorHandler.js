// middleware/errorHandler.js - Global error handler middleware

const logger = require('winston');

/**
 * Global error handler middleware
 * Catches all unhandled errors and returns a consistent response
 */
const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled Server Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
    });
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error occurred.',
            details: err.message
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid data format.',
            details: err.message
        });
    }
    
    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: 'Duplicate entry found.',
            details: 'A record with this data already exists.'
        });
    }
    
    // Default server error
    res.status(500).json({
        success: false,
        message: 'An unexpected internal server error occurred. Check server logs.',
    });
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`,
    });
};

/**
 * Async error wrapper to catch async errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler
};