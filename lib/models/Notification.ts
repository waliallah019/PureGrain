// my-leather-platform/lib/models/Notification.ts
import mongoose, { Schema, Document } from 'mongoose';

// Interface defined directly in the model file, as per your preference.
export interface INotification extends Document {
  _id: mongoose.Types.ObjectId; // Use mongoose.Types.ObjectId for direct consistency
  title: string;
  message: string;
  // --- FIX: Ensure enum values match between interface and schema ---
  type:
    | 'info'
    | 'warning'
    | 'error'
    | 'success'
    | 'new_message'
    | 'new_sample_request'
    | 'new_custom_request'
    | 'sample_status_update'
    | 'payment_confirmed' // From previous code, ensuring it's here
    | 'payment_failed'    // From previous code, ensuring it's here
    | 'new_quote_request'
    | 'quote_status_update'
    | 'invoice_sent'
    | 'payment_received';
  // --- END FIX ---
  read: boolean;
  link?: string; // Link to the related item (e.g., admin/samples/sampleId)
  relatedId?: mongoose.Types.ObjectId; // E.g., the SampleRequest _id
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      // --- FIX: Enum must match exactly with the interface and the string literals used elsewhere ---
      enum: [
        'info',
        'warning',
        'error',
        'success',
        'new_message',
        'new_sample_request',
        'new_custom_request',
        'sample_status_update',
        'payment_confirmed',
        'payment_failed',
        'new_quote_request',
        'quote_status_update',
        'invoice_sent',
        'payment_received'
      ],
      // --- END FIX ---
      default: 'info',
    },
    read: { type: Boolean, default: false },
    link: { type: String, trim: true },
    // Ensure relatedId can refer to different types if needed, or specify one (e.g., 'SampleRequest' or 'QuoteRequest')
    // If it can refer to multiple types, you might use no `ref` or a `refPath`.
    // For now, let's keep it generic and rely on context.
    relatedId: { type: Schema.Types.ObjectId, sparse: true },
  },
  { timestamps: true }
);

// Ensure model is not recompiled on hot-reloading
export default (mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema)) as mongoose.Model<INotification>;