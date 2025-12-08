// config/database.js - Database configuration

/**
 * Database configuration object
 */
const databaseConfig = {
    // Connection settings
    uri: process.env.DB_URI,
    
    // Connection options
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        
        // Connection pool settings
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
        minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
        maxIdleTimeMS: 30000,
        
        // Server selection settings
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
        heartbeatFrequencyMS: 10000,
        
        // Retry settings
        retryWrites: true,
        w: 'majority',
        retryReads: true,
        
        // Buffering settings
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable command buffering
        
        // Authentication
        authSource: process.env.DB_AUTH_SOURCE || 'admin',
        
        // SSL settings (for production)
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
        } : false,
        
        // Connection events
        autoIndex: process.env.NODE_ENV !== 'production', // Don't build indexes in production
        family: 4 // Use IPv4, skip trying IPv6
    },
    
    // Index settings
    indexes: {
        autoIndex: process.env.NODE_ENV !== 'production',
        caseInsensitive: true
    },
    
    // Logging settings
    logging: {
        debug: process.env.NODE_ENV === 'development' && process.env.DB_DEBUG === 'true',
        logger: process.env.DB_LOGGER || 'console'
    },
    
    // Cache settings
    cache: {
        enabled: process.env.DB_CACHE_ENABLED === 'true',
        ttl: parseInt(process.env.DB_CACHE_TTL) || 300, // 5 minutes
        maxKeys: parseInt(process.env.DB_CACHE_MAX_KEYS) || 1000
    },
    
    // Backup settings
    backup: {
        enabled: process.env.DB_BACKUP_ENABLED === 'true',
        interval: process.env.DB_BACKUP_INTERVAL || 'daily',
        retention: parseInt(process.env.DB_BACKUP_RETENTION) || 30 // days
    }
};

/**
 * Validate database configuration
 */
const validateDatabaseConfig = () => {
    if (!databaseConfig.uri) {
        throw new Error('Database URI is required in DB_URI environment variable');
    }
    
    // Validate URI format
    if (!databaseConfig.uri.startsWith('mongodb://') && !databaseConfig.uri.startsWith('mongodb+srv://')) {
        throw new Error('Invalid database URI format. Must start with mongodb:// or mongodb+srv://');
    }
    
    return true;
};

/**
 * Get MongoDB connection string with options
 */
const getConnectionString = () => {
    return databaseConfig.uri;
};

/**
 * Get connection options
 */
const getConnectionOptions = () => {
    return databaseConfig.options;
};

/**
 * Test database connection
 */
const testConnection = async (mongoose) => {
    try {
        await mongoose.connect(databaseConfig.uri, databaseConfig.options);
        return { success: true, message: 'Database connection successful' };
    } catch (error) {
        return { success: false, message: `Database connection failed: ${error.message}` };
    }
};

module.exports = {
    databaseConfig,
    validateDatabaseConfig,
    getConnectionString,
    getConnectionOptions,
    testConnection
};