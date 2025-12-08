// config/app.js - Application configuration

const express = require('express');
const cors = require('cors');
const winston = require('winston');

/**
 * Create and configure Express application
 */
function createApp() {
    const app = express();

    // CORS configuration
    app.use(
        cors({
            origin: true, // Allow all origins for development
            methods: "GET,POST,PUT,DELETE",
            allowedHeaders: "Content-Type,Authorization"
        })
    );

    // Body parsers
    app.use(express.json()); 
    app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        transports: [
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.Console({ format: winston.format.simple() })
        ],
    });

    app.use((req, res, next) => {
        logger.info(`[${req.method}] ${req.url} - IP: ${req.ip}`);
        next();
    });

    // Global error handler
    app.use((err, req, res, next) => {
        logger.error('Unhandled Server Error:', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            body: req.body,
        });
        res.status(500).json({
            success: false,
            message: 'An unexpected internal server error occurred. Check server logs.',
        });
    });

    return app;
}

/**
 * Get server configuration
 */
function getConfig() {
    return {
        port: process.env.PORT || process.env.SERVER_PORT || 3001,
        dbUri: process.env.DB_URI,
        cors: {
            origin: true,
            methods: ["GET", "POST", "PUT", "DELETE"],
            allowedHeaders: "Content-Type,Authorization"
        }
    };
}

module.exports = {
    createApp,
    getConfig
};