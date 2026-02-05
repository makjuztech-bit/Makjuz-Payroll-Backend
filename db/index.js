const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://madhavan:EgFHpkXVWLxZmube@levivaan.xns2kil.mongodb.net/levivaan?retryWrites=true&w=majority&appName=levivaan';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');

    // Log connection state
    const state = mongoose.connection.readyState;
    console.log('MongoDB connection state:', {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      4: 'invalid'
    }[state] || 'unknown');

  } catch (error) {
    console.error('MongoDB connection error:', {
      error: error.toString(),
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', {
    error: err.toString(),
    stack: err.stack,
    code: err.code,
    name: err.name
  });
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected event fired');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

module.exports = connectDB;
