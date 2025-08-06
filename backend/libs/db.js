import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Konfigūracija (ATNAUJINTA: NĖRA LOCALHOST FALLBACK)
const DB_CONFIG = {
  URI: process.env.MONGODB_URI, // ❗ Tik iš .env failo
  NAME: 'travcen',
  OPTIONS: {
    maxPoolSize: 50,
    wtimeoutMS: 2500,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    retryReads: true
  }
};

// Globalus ryšio objektas (liko nepakeistas)
let cachedClient = null;
let cachedDb = null;
let mongooseConnection = null;

// MongoDB Native Driver ryšys (liko nepakeistas)
export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return {
      client: cachedClient,
      db: cachedDb
    };
  }

  try {
    const client = await MongoClient.connect(DB_CONFIG.URI, DB_CONFIG.OPTIONS);
    const db = client.db(DB_CONFIG.NAME);
    
    cachedClient = client;
    cachedDb = db;

    logger.info('✅ MongoDB Native connection established');
    
    return { client, db };
  } catch (err) {
    logger.error('❌ MongoDB Native connection failed:', err);
    throw err;
  }
}

// Mongoose ryšys (liko nepakeistas)
export async function connectMongoose() {
  if (mongooseConnection) {
    return mongooseConnection;
  }

  try {
    mongooseConnection = await mongoose.connect(
      `${DB_CONFIG.URI}/${DB_CONFIG.NAME}`,
      {
        ...DB_CONFIG.OPTIONS,
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );

    logger.info('✅ Mongoose connection established');
    return mongooseConnection;
  } catch (err) {
    logger.error('❌ Mongoose connection failed:', err);
    throw err;
  }
}

// Ryšio uždarymo funkcija (liko nepakeista)
export async function closeConnections() {
  try {
    if (cachedClient) {
      await cachedClient.close();
      cachedClient = null;
      cachedDb = null;
    }
    
    if (mongooseConnection) {
      await mongoose.disconnect();
      mongooseConnection = null;
    }
    
    logger.info('📴 Database connections closed');
  } catch (err) {
    logger.error('Error closing connections:', err);
  }
}

// Automatinis ryšio tvarkymas (liko nepakeistas)
process.on('SIGINT', async () => {
  await closeConnections();
  process.exit(0);
});

export default {
  connectToDatabase,
  connectMongoose,
  closeConnections
};
