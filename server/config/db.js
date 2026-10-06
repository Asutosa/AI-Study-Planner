const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

function getSafeErrorMessage(error) {
  const message = error && error.message ? error.message : String(error);
  return message.replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[hidden connection string]');
}

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error(
      'Error: MONGODB_URI is missing. Add your MongoDB Atlas connection string to the server/.env file.'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas.');
    console.error(getSafeErrorMessage(error));
    process.exit(1);
  }
}

module.exports = connectDB;
