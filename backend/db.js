const { MongoClient } = require('mongodb');

async function connectToDatabase() {
  const client = await MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  return client.db('travcen');
}

module.exports = { connectToDatabase };
