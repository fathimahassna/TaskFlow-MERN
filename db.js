const mongoose = require('mongoose');

let memoryServer = null;
let dbMode = 'uninitialized';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to configured MongoDB...');
      await mongoose.connect(uri);
      dbMode = uri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB';
      console.log(`[TaskFlow DB] Connected successfully to ${dbMode}`);
      return;
    } catch (err) {
      console.warn(`[TaskFlow DB] Failed to connect to ${uri}: ${err.message}`);
      console.warn('[TaskFlow DB] Falling back to embedded MongoDB Memory Server...');
    }
  }

  // Fallback to in-memory MongoDB for local evaluation/testing if no URI configured
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    dbMode = 'In-Memory MongoDB (Zero-Config Mode)';
    console.log(`[TaskFlow DB] Connected to In-Memory MongoDB at ${memUri}`);
    console.log('[TaskFlow DB] NOTE: This provides an instant out-of-the-box demo environment without external credentials.');
  } catch (memErr) {
    console.error('[TaskFlow DB] Failed to start in-memory MongoDB:', memErr.message);
    throw memErr;
  }
};

const getDbStatus = () => {
  const stateNames = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: stateNames[mongoose.connection.readyState] || 'unknown',
    mode: dbMode,
    host: mongoose.connection.host || 'localhost',
    name: mongoose.connection.name || 'taskflow'
  };
};

module.exports = { connectDB, getDbStatus };