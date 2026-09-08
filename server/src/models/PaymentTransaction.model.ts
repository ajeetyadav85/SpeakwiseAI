import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface IPaymentTransaction extends Document {
  userId?: mongoose.Types.ObjectId;
  userEmail: string;
  userName?: string;
  orderId: string;
  paymentId: string;
  signature?: string;
  planId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  durationHours: number;
  paidAt: Date;
  expiresAt: Date;
  notes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail: { type: String, required: true, index: true },
    userName: { type: String, default: '' },
    orderId: { type: String, required: true, index: true },
    paymentId: { type: String, required: true, index: true },
    signature: { type: String, default: '' },
    planId: {
      type: String,
      required: true,
      enum: ['1_DAY', '1_WEEK', '1_MONTH', '3_MONTH', '6_MONTH', '1_YEAR', 'PRO_MONTHLY'],
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['SUCCESS', 'PENDING', 'FAILED'],
      default: 'SUCCESS',
      index: true,
    },
    paymentMethod: { type: String, default: 'RAZORPAY_GATEWAY' },
    durationHours: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    notes: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const PaymentTransactionModel = mongoose.model<IPaymentTransaction>(
  'PaymentTransaction',
  PaymentTransactionSchema
);
