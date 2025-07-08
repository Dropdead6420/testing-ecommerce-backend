const mongoose = require('mongoose');

let isConnected = false;

const connectToDB = async () => {
    if (isConnected) return;

    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set in environment");
        process.exit(1);
    }

    try {
        const db = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = db.connections[0].readyState;
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('DB Connection Error:', error.message);
        throw error;
    }
};

module.exports = { connectToDB };