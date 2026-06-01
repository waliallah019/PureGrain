// C:\Dev\puretemp-main\lib\services\notificationService.ts (complete corrected file)
import Notification, { INotification } from "@/lib/models/Notification";
import logger from "@/lib/config/logger";
import mongoose from "mongoose";

interface NotificationFilters {
  read?: boolean;
  type?: INotification['type'] | 'all';
  search?: string;
}

class NotificationService {
  /**
   * Creates a new notification.
   */
  public async createNotification(notificationData: Partial<INotification>): Promise<INotification> {
    try {
      // Ensure relatedId is converted to ObjectId if it's a string
      if (notificationData.relatedId && typeof notificationData.relatedId === 'string' && mongoose.Types.ObjectId.isValid(notificationData.relatedId)) {
        notificationData.relatedId = new mongoose.Types.ObjectId(notificationData.relatedId);
      } else {
        notificationData.relatedId = undefined;
      }

      const newNotification = new Notification(notificationData);
      await newNotification.save();
      logger.info(`New notification created: "${newNotification.title}" (Type: ${newNotification.type})`);
      return newNotification;
    } catch (error: any) {
      logger.error(`Error creating notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a list of notifications with filters, pagination, and sorting.
   */
  public async getNotifications(
    filters: NotificationFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    order: string = 'desc'
  ): Promise<{ notifications: INotification[]; total: number; page: number; limit: number }> {
    const query: any = {};

    // --- FIX IS HERE ---
    // This correctly adds { read: true } or { read: false } to the MongoDB query object
    if (typeof filters.read === 'boolean') {
      query.read = filters.read;
      logger.info(`NotificationService: Applying 'read' filter: ${filters.read}`); // Added log
    } else {
      logger.info(`NotificationService: No 'read' filter provided or it's not a boolean.`); // Added log
    }
    // --- END FIX ---


    if (filters.type && filters.type !== 'all') {
      query.type = filters.type as INotification['type'];
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: new RegExp(filters.search, 'i') } },
        { message: { $regex: new RegExp(filters.search, 'i') } },
      ];
    }

    try {
      const skip = (page - 1) * limit;
      // Count documents *with* the constructed query
      const total = await Notification.countDocuments(query);

      const allowedSortFields = ['createdAt', 'updatedAt', 'read', 'type', 'title'];
      let sortOptions: { [key: string]: 1 | -1 } = {};

      if (sortBy && allowedSortFields.includes(sortBy)) {
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;
      } else {
        sortOptions = { createdAt: -1 };
        logger.warn(`Invalid or unallowed sortBy field for Notifications: ${sortBy}. Defaulting to createdAt descending.`);
      }

      // Find documents *with* the constructed query
      const notifications = await Notification.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec();

      logger.info(`Retrieved ${notifications.length} notifications (total: ${total}) with query: ${JSON.stringify(query)}`); // Added query log
      return { notifications, total, page, limit };
    } catch (error: any) {
      logger.error(`Error getting notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marks a notification as read or unread.
   */
  public async updateNotificationStatus(id: string, read: boolean): Promise<INotification | null> {
    try {
      const notification = await Notification.findByIdAndUpdate(id, { read }, { new: true });
      if (notification) logger.info(`Updated notification ${id} read status to: ${read}`);
      else logger.warn(`Notification not found for status update: ${id}`);
      return notification;
    } catch (error: any) {
      logger.error(`Error updating notification status for ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a notification.
   */
  public async deleteNotification(id: string): Promise<boolean> {
    try {
      const result = await Notification.deleteOne({ _id: id });
      if (result.deletedCount && result.deletedCount > 0) {
        logger.info(`Deleted notification with ID: ${id}`);
        return true;
      }
      logger.warn(`Notification not found for deletion: ${id}`);
      return false;
    } catch (error: any) {
      logger.error(`Error deleting notification with ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marks all notifications as read.
   */
  public async markAllAsRead(): Promise<void> {
    try {
      await Notification.updateMany({ read: false }, { read: true });
      logger.info('All unread notifications marked as read.');
    } catch (error: any) {
      logger.error(`Error marking all notifications as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes notifications older than a specified number of days.
   * @param days - Number of days. Notifications older than this will be deleted.
   * @returns The count of deleted notifications.
   */
  public async deleteOldNotifications(days: number): Promise<number> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days); // Calculate date 'days' ago

      const result = await Notification.deleteMany({
        createdAt: { $lt: dateThreshold } // Delete notifications where createdAt is less than (older than) the threshold
      });

      logger.info(`Deleted ${result.deletedCount} notifications older than ${days} days.`);
      return result.deletedCount;
    } catch (error: any) {
      logger.error(`Error deleting old notifications: ${error.message}`);
      throw error;
    }
  }
}

export default new NotificationService();