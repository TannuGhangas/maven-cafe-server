// services/socket.js - Socket.IO configuration and handling

const { Server } = require('socket.io');
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ],
});

/**
 * Initialize Socket.IO server
 */
function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: true,
            methods: ["GET", "POST", "PUT", "DELETE"]
        }
    });

    // Store chef calls reference (will be set by routes/chef-calls.js)
    let chefCalls = [];
    
    // Method to set chef calls reference (called from routes/chef-calls.js)
    io.setChefCalls = (calls) => {
        chefCalls = calls;
        console.log('🔗 Chef calls reference synced with routes/chef-calls.js');
    };

    io.on('connection', (socket) => {
        console.log('🔌 Client connected:', socket.id);
        
        // Join room based on role
        socket.on('join', (data) => {
            if (data.role === 'kitchen' || data.role === 'admin') {
                socket.join('kitchen');
                console.log(`👨‍🍳 Kitchen/Admin joined: ${socket.id} (userId: ${data.userId})`);
            } else if (data.role === 'user') {
                socket.join(`user_${data.userId}`);
                console.log(`👤 User ${data.userId} joined: ${socket.id}`);
            }
        });
        
        // Handle new order notifications from orders route
        socket.on('new-order', (orderData) => {
            console.log('📦 New order event received in socket service:', orderData._id);
            // Broadcast to all kitchen clients
            io.to('kitchen').emit('new-order', orderData);
            console.log('📢 New order broadcasted to kitchen room');
        });
        
        // Handle order status updates
        socket.on('order-updated', (orderData) => {
            console.log('📝 Order updated event received in socket service:', orderData._id);
            // Broadcast to all kitchen clients
            io.to('kitchen').emit('order-updated', orderData);
            console.log('📢 Order update broadcasted to kitchen room');
        });
        
        // Handle order deletion notifications
        socket.on('order-deleted', (orderData) => {
            console.log('🗑️ Order deleted event received in socket service:', orderData.orderId);
            // Broadcast to all kitchen clients
            io.to('kitchen').emit('order-deleted', orderData);
            console.log('📢 Order deletion broadcasted to kitchen room');
        });
        
        // Handle chef call from user
        socket.on('call-chef', (data) => {
            const newCall = {
                id: Date.now().toString(),
                userId: data.userId,
                userName: data.userName,
                seatNumber: data.seatNumber,
                timestamp: new Date().toISOString(),
                status: 'pending',
                chefResponse: null,
                responseTime: null
            };
            
            chefCalls.push(newCall);
            console.log(`📞 Chef called by ${data.userName} at ${data.seatNumber}`);
            
            // Emit to all kitchen clients instantly
            io.to('kitchen').emit('chef-call', newCall);
            
            // Confirm to user
            socket.emit('call-sent', { success: true, call: newCall });
        });
        
        // Handle chef response
        socket.on('chef-response', (data) => {
            const callIndex = chefCalls.findIndex(call => call.id === data.callId);
            
            if (callIndex !== -1) {
                chefCalls[callIndex].chefResponse = data.response;
                chefCalls[callIndex].responseTime = new Date().toISOString();
                chefCalls[callIndex].status = data.response === 'dismiss' ? 'dismissed' : 'responded';
                
                const call = chefCalls[callIndex];
                console.log(`✅ Chef responded to call ${data.callId}: ${data.response}`);
                
                // Emit response to the specific user instantly
                io.to(`user_${call.userId}`).emit('chef-response', {
                    callId: call.id,
                    response: data.response,
                    responseTime: call.responseTime
                });
            }
        });
        
        socket.on('disconnect', () => {
            console.log('🔌 Client disconnected:', socket.id);
        });
    });

    return io;
}

module.exports = {
    initializeSocket
};