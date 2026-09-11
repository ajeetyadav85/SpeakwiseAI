let mongoose = null;
try {
  mongoose = require('mongoose');
} catch (e1) {
  try {
    mongoose = require('../server/node_modules/mongoose');
  } catch (e2) {
    mongoose = null;
  }
}

let cachedConn = null;
let cachedPromise = null;

async function connectDB() {
  if (!mongoose) {
    return null;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  if (!cachedPromise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };
    cachedPromise = mongoose.connect(uri, opts).then((m) => m);
  }

  try {
    cachedConn = await cachedPromise;
    return cachedConn;
  } catch (e) {
    cachedPromise = null;
    console.warn('[VERCEL MONGODB] Connection failed, running in fallback mode:', e.message);
    return null;
  }
}

// Resilient Mongoose User Schema for Vercel Serverless Function
let UserModel = null;
if (mongoose) {
  const userSchema = new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true, index: true, lowercase: true },
      passwordHash: { type: String, required: true },
      fullName: { type: String, required: true },
      role: { type: String, default: 'PRO_USER' },
      authProvider: { type: String, default: 'email' },
      googleId: { type: String, default: null },
      avatarUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      },
      streakDays: { type: Number, default: 7 },
      totalPracticeMinutes: { type: Number, default: 142 },
      averageScore: { type: Number, default: 88 },
      targetWpm: { type: Number, default: 145 },
      exp: { type: Number, default: 1850 },
      level: { type: Number, default: 4 },
      subscriptionPlan: { type: String, default: null },
      subscriptionExpiresAt: { type: Date, default: null },
      guestAttemptsConsumed: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  UserModel = mongoose.models.User || mongoose.model('User', userSchema);
}

module.exports = {
  connectDB,
  UserModel,
};
