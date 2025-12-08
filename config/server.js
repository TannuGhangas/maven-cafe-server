// config/server.js - Server configuration

require('dotenv').config();

/**
 * Server configuration object
 */
const serverConfig = {
    // Server settings
    port: process.env.PORT || process.env.SERVER_PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
    
    // CORS settings
    cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: "Content-Type,Authorization",
        credentials: true
    },
    
    // Request limits
    limits: {
        bodyParser: {
            json: { limit: '10mb' },
            urlencoded: { limit: '10mb', extended: true }
        }
    },
    
    // Security settings
    security: {
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // limit each IP to 1000 requests per windowMs
            message: 'Too many requests from this IP, please try again later.'
        }
    },
    
    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableConsole: true,
        enableFile: true,
        errorLogFile: 'logs/error.log',
        combinedLogFile: 'logs/combined.log'
    },
    
    // Socket.IO configuration
    socket: {
        cors: {
            origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
            methods: ["GET", "POST"]
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
    }
};

/**
 * Validate required environment variables
 */
const validateConfig = () => {
    const requiredVars = [
        'DB_URI'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
};

/**
 * Get server URL
 */
const getServerUrl = () => {
    const protocol = serverConfig.isDevelopment ? 'http' : 'https';
    return `${protocol}://${serverConfig.host}:${serverConfig.port}`;
};

/**
 * Get database connection string
 */
const getDatabaseUrl = () => {
    return process.env.DB_URI;
};

module.exports = {
    serverConfig,
    validateConfig,
    getServerUrl,
    getDatabaseUrl
};