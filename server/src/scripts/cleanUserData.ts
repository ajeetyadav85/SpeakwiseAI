import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { UserModel } from '../models/User.model.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.model.js';
import { GuestUsageModel } from '../models/GuestUsage.model.js';

async function cleanUserData() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB at:', env.MONGODB_URI);

  const userDel = await UserModel.deleteMany({});
  console.log(`Deleted ${userDel.deletedCount} users.`);

  const txDel = await PaymentTransactionModel.deleteMany({});
  console.log(`Deleted ${txDel.deletedCount} payment transactions.`);

  try {
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      for (const col of collections) {
        if (col.name.toLowerCase().includes('guest') || col.name.toLowerCase().includes('usage')) {
          const res = await db.collection(col.name).deleteMany({});
          console.log(`Deleted ${res.deletedCount} documents from collection '${col.name}'.`);
        }
      }
    }
  } catch (gErr: any) {
    console.error('Guest delete error:', gErr.message);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

cleanUserData().catch((err) => {
  console.error('Error cleaning data:', err);
  process.exit(1);
});
