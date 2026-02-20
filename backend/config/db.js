const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        isConnected = true;
    } catch (error) {
        console.error(`MongoDB Warning: ${error.message}`);
        console.log('🟡 Backend running in DEMO MODE (In-Memory Storage)');
        isConnected = false;
    }
};

const getIsConnected = () => isConnected;

module.exports = connectDB;
module.exports.getIsConnected = getIsConnected;
