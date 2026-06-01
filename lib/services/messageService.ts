// my-leather-platform/lib/services/messageService.ts
import Message, { IMessage } from "@/lib/models/Message";
import NotificationService from "@/lib/services/notificationService";
import logger from "@/lib/config/logger";
import { getMessageSubject } from "@/lib/utils/messageUtils";
// No explicit 'import mongoose from "mongoose";' needed here anymore for relatedId cast,
// as _id is correctly typed in IMessage and INotification.

interface MessageFilters {
  status?: IMessage['status'];
  priority?: IMessage['priority'];
  category?: string; // inquiryType is the field name
  search?: string;
}

class MessageService {
  /**
   * Creates a new message from a contact form submission.
   * Also creates a notification for the admin.
   * @param messageData - Data from the contact form.
   * @returns The created message.
   */
  public async createMessage(messageData: {
    fullName: string;
    email: string;
    phone?: string;
    companyName?: string;
    country?: string;
    inquiryType: string;
    message: string;
  }): Promise<IMessage> {
    try {
      const subject = getMessageSubject(messageData.inquiryType);
      const priority: IMessage['priority'] = messageData.inquiryType === 'support' || messageData.inquiryType === 'complaint' ? 'high' : 'medium';

      const newMessage = new Message({
        customerName: messageData.fullName,
        customerEmail: messageData.email,
        customerPhone: messageData.phone,
        customerCompany: messageData.companyName,
        customerCountry: messageData.country,
        inquiryType: messageData.inquiryType,
        subject: subject,
        message: messageData.message,
        status: 'unread',
        priority: priority,
      });

      await newMessage.save(); // After save, _id is populated and typed as mongoose.Types.ObjectId

      logger.info(`New contact message received from ${newMessage.customerName} (${newMessage.customerEmail})`);

      // Create a notification for the admin
      await NotificationService.createNotification({
        title: `New ${newMessage.inquiryType} Inquiry`,
        message: `From: ${newMessage.customerName} - Subject: ${newMessage.subject}`,
        type: 'new_message',
        link: `/admin-ahmza/messages?id=${newMessage._id.toString()}`, // _id is now correctly typed as ObjectId
        relatedId: newMessage._id, // _id is now correctly typed as ObjectId
      });

      return newMessage;
    } catch (error: any) {
      logger.error(`Error creating message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a list of messages with optional filters, pagination, and sorting.
   * @param filters - Message specific filters (status, priority, category, search)
   * @param page - Page number.
   * @param limit - Items per page.
   * @param sortBy - Field to sort by.
   * @param order - Sort order ('asc'/'desc').
   * @returns Paginated list of messages.
   */
  public async getMessages(
    filters: MessageFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    order: string = 'desc'
  ): Promise<{ messages: IMessage[]; total: number; page: number; limit: number }> {
    const query: any = {};

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.category) query.inquiryType = filters.category; // category maps to inquiryType

    if (filters.search) {
      query.$or = [
        { customerName: { $regex: new RegExp(filters.search, 'i') } },
        { customerEmail: { $regex: new RegExp(filters.search, 'i') } },
        { subject: { $regex: new RegExp(filters.search, 'i') } },
        { message: { $regex: new RegExp(filters.search, 'i') } },
      ];
    }

    try {
      const skip = (page - 1) * limit;
      const total = await Message.countDocuments(query);

      const allowedSortFields = ['createdAt', 'updatedAt', 'status', 'priority', 'customerName', 'inquiryType'];
      let sortOptions: { [key: string]: 1 | -1 } = {};

      if (sortBy && allowedSortFields.includes(sortBy)) {
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;
      } else {
        sortOptions = { createdAt: -1 };
        logger.warn(`Invalid or unallowed sortBy field for Messages: ${sortBy}. Defaulting to createdAt descending.`);
      }

      const messages = await Message.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec();

      logger.info(`Retrieved ${messages.length} messages (total: ${total})`);
      return { messages, total, page, limit };
    } catch (error: any) {
      logger.error(`Error getting messages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a single message by ID.
   */
  public async getMessageById(id: string): Promise<IMessage | null> {
    try {
      const message = await Message.findById(id);
      if (message) logger.info(`Retrieved message by ID: ${id}`);
      else logger.warn(`Message not found by ID: ${id}`);
      return message;
    } catch (error: any) {
      logger.error(`Error getting message by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates the status of a message.
   */
  public async updateMessageStatus(id: string, status: IMessage['status']): Promise<IMessage | null> {
    try {
      const message = await Message.findByIdAndUpdate(id, { status }, { new: true });
      if (message) logger.info(`Updated message ${id} status to: ${status}`);
      else logger.warn(`Message not found for status update: ${id}`);
      return message;
    } catch (error: any) {
      logger.error(`Error updating message status for ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a message.
   */
  public async deleteMessage(id: string): Promise<boolean> {
    try {
      const result = await Message.deleteOne({ _id: id });
      if (result.deletedCount && result.deletedCount > 0) {
        logger.info(`Deleted message with ID: ${id}`);
        return true;
      }
      logger.warn(`Message not found for deletion: ${id}`);
      return false;
    } catch (error: any) {
      logger.error(`Error deleting message with ID ${id}: ${error.message}`);
      throw error;
    }
  }
}

export default new MessageService();