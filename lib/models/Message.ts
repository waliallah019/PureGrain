// my-leather-platform/lib/models/Message.ts
import mongoose, { Schema, Document } from 'mongoose';

// Ensure _id is explicitly defined as mongoose.Types.ObjectId
export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId; // <--- ADD THIS LINE FOR ROBUST TYPING
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  customerCountry?: string;
  inquiryType: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, trim: true },
    customerCompany: { type: String, trim: true },
    customerCountry: { type: String, trim: true },
    inquiryType: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['unread', 'read', 'replied', 'archived'],
      default: 'unread',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

export default (mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema)) as mongoose.Model<IMessage>;