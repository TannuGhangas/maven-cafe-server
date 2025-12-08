// middleware/auth.js - Authorization middleware

const User = require('../models/User');
const logger = require('winston');

/**
 * Authorization middleware factory
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} Express middleware function
 */
const authorize = (allowedRoles) => async (req, res, next) => {
    let userId; 
    let clientRole; 

    // Extract authorization data
    if (req.method === 'GET') {
        userId = parseInt(req.query.userId); 
        clientRole = req.query.userRole; 
    } else {
        // For POST/PUT/DELETE, check req.body (parsed by express.json())
        userId = req.body.userId;
        clientRole = req.body.userRole; 
    }
    
    // Improved Check: Handle missing authentication data
    if (!userId || !clientRole) {
        let missingField = !userId ? 'User ID' : 'User Role';
        return res.status(401).json({ success: false, message: `Authentication required: ${missingField} missing in request body/query.` });
    }
    // Ensure userId is treated as a number
    userId = parseInt(userId);

    try {
        const user = await User.findOne({ id: userId }); 

        if (!user) {
            return res.status(403).json({ success: false, message: 'Access denied: User not found in database.' });
        }
        
        if (user.role !== clientRole) {
            return res.status(403).json({ success: false, message: 'Access denied: Role mismatch with server data.' });
        }

        if (!user.enabled) {
            return res.status(403).json({ success: false, message: 'Access denied: Your account has been disabled.' });
        }
        
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ success: false, message: `Role '${user.role}' not authorized for this action.` });
        }
        
        req.currentUser = user; 
        next();
    } catch (error) {
        logger.error('Authorization Error:', error);
        return res.status(500).json({ success: false, message: 'Internal authorization error.' });
    }
};

module.exports = { authorize };