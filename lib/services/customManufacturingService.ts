// my-leather-platform/lib/services/customManufacturingService.ts
import CustomManufacturingRequest, { ICustomManufacturingRequest } from "../models/CustomManufacturingRequest";
import logger from "../config/logger";
import NotificationService from "@/lib/services/notificationService";
import mongoose from "mongoose";
import { sendEmail } from "@/lib/utils/sendEmail";
import { customAlphabet } from "nanoid";
import { format } from "date-fns";

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

interface CustomRequestFilters {
  status?: string;
  search?: string; // Search by companyName, contactPerson, email
}

class CustomManufacturingService {
  private async generateUniqueRequestNumber(): Promise<string> {
    let unique = false;
    let newNumber = '';
    while (!unique) {
      newNumber = nanoid();
      const existingRequest = await CustomManufacturingRequest.findOne({ requestNumber: newNumber });
      if (!existingRequest) {
        unique = true;
      }
    }
    return newNumber;
  }

  /**
   * Creates a new custom manufacturing request.
   * @param requestData - The request data including Cloudinary design file URLs.
   * @returns The created request.
   */
  public async createRequest(
    requestData: Partial<ICustomManufacturingRequest>
  ): Promise<ICustomManufacturingRequest> {
    try {
      const requestNumber = requestData.requestNumber || await this.generateUniqueRequestNumber();
      const newRequest = new CustomManufacturingRequest({
        ...requestData,
        requestNumber,
        status: requestData.status || 'submitted',
      });
      await newRequest.save();
      logger.info(`Created new custom manufacturing request for: ${newRequest.companyName} (${newRequest.email})`);

      await NotificationService.createNotification({
        title: `New Custom Request: ${newRequest.companyName}`,
        message: `Custom request from ${newRequest.contactPerson} (${newRequest.email}) was submitted. Ref: ${newRequest.requestNumber}`,
        type: 'new_custom_request',
        link: `/admin-ahmza/custom-manufacturing/${newRequest._id.toString()}`,
        relatedId: mongoose.Types.ObjectId.isValid(newRequest._id) ? new mongoose.Types.ObjectId(newRequest._id as string) : undefined,
      });

      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const adminMessage = [
          'A new custom manufacturing request has been submitted.',
          '',
          `Request Number: ${newRequest.requestNumber}`,
          `Company: ${newRequest.companyName}`,
          `Contact Person: ${newRequest.contactPerson}`,
          `Email: ${newRequest.email}`,
          `Product Type: ${newRequest.productType}`,
          `Estimated Quantity: ${newRequest.estimatedQuantity}`,
          `Preferred Material: ${newRequest.preferredMaterial || 'N/A'}`,
          `Budget Range: ${newRequest.budgetRange || 'N/A'}`,
          `Timeline: ${newRequest.timeline || 'N/A'}`,
          '',
          'Please review it in the admin panel.',
        ].join('\n');

        void sendEmail({
          to: adminEmail,
          subject: `New Custom Request: ${newRequest.companyName} (Ref: ${newRequest.requestNumber})`,
          text: adminMessage,
          html: `<p>A new custom manufacturing request has been submitted.</p>
                 <p><strong>Request Number:</strong> ${newRequest.requestNumber}</p>
                 <p><strong>Company:</strong> ${newRequest.companyName}</p>
                 <p><strong>Contact Person:</strong> ${newRequest.contactPerson}</p>
                 <p><strong>Email:</strong> ${newRequest.email}</p>
                 <p><strong>Product Type:</strong> ${newRequest.productType}</p>
                 <p><strong>Estimated Quantity:</strong> ${newRequest.estimatedQuantity}</p>
                 <p><strong>Preferred Material:</strong> ${newRequest.preferredMaterial || 'N/A'}</p>
                 <p><strong>Budget Range:</strong> ${newRequest.budgetRange || 'N/A'}</p>
                 <p><strong>Timeline:</strong> ${newRequest.timeline || 'N/A'}</p>`,
        }).catch((err) => {
          logger.error(`[CustomManufacturingService] Admin notification email failed for ${newRequest._id} (Ref: ${newRequest.requestNumber}):`, err);
        });
      }

      void sendEmail({
        to: newRequest.email,
        subject: `PureGrain: Your Custom Request (Ref: ${newRequest.requestNumber}) Received`,
        text: `Dear ${newRequest.contactPerson},\n\nThank you for submitting your custom manufacturing request.\n\nReference Number: ${newRequest.requestNumber}\n\nOur team will review your request and contact you shortly.\n\nBest regards,\nPureGrain Team`,
        html: `<p>Dear ${newRequest.contactPerson},</p>
               <p>Thank you for submitting your custom manufacturing request.</p>
               <p><strong>Reference Number:</strong> ${newRequest.requestNumber}</p>
               <p>Our team will review your request and contact you shortly.</p>
               <p>Best regards,<br/>PureGrain Team</p>`,
      }).catch((err) => {
        logger.error(`[CustomManufacturingService] Customer acknowledgement email failed for ${newRequest._id} (Ref: ${newRequest.requestNumber}):`, err);
      });

      return newRequest;
    } catch (error: any) {
      logger.error(`Error creating custom manufacturing request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a list of custom manufacturing requests with optional filters, pagination, and sorting.
   * @param filters - Object containing status and search string.
   * @param page - Page number for pagination.
   * @param limit - Number of items per page for pagination.
   * @param sortBy - The field to sort by.
   * @param order - Sort order: 'asc' or 'desc'.
   * @returns An object containing requests, total count, and pagination info.
   */
  public async getRequests(
    filters: CustomRequestFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt",
    order: string = "desc"
  ): Promise<{ requests: ICustomManufacturingRequest[]; total: number; page: number; limit: number }> {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.search) {
      query.$or = [
        { companyName: { $regex: new RegExp(filters.search, "i") } },
        { contactPerson: { $regex: new RegExp(filters.search, "i") } },
        { email: { $regex: new RegExp(filters.search, "i") } },
        { productType: { $regex: new RegExp(filters.search, "i") } },
        { preferredMaterial: { $regex: new RegExp(filters.search, "i") } },
      ];
    }

    try {
      const skip = (page - 1) * limit;
      const total = await CustomManufacturingRequest.countDocuments(query);

      const allowedSortFields = [
        "companyName", "contactPerson", "email", "productType",
        "estimatedQuantity", "status", "createdAt", "updatedAt"
      ];
      let sortOptions: { [key: string]: 1 | -1 } = {};

      if (sortBy && allowedSortFields.includes(sortBy)) {
        sortOptions[sortBy] = order === "desc" ? -1 : 1;
      } else {
        sortOptions = { createdAt: -1 };
        logger.warn(`Invalid or unallowed sortBy field for CustomManufacturingRequest: ${sortBy}. Defaulting to createdAt descending.`);
      }

      const requests = await CustomManufacturingRequest.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec();

      logger.info(`Retrieved ${requests.length} custom manufacturing requests (total: ${total})`);
      return { requests, total, page, limit };
    } catch (error: any) {
      logger.error(`Error getting custom manufacturing requests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a single custom manufacturing request by its ID.
   * @param id - The ID of the request.
   * @returns The found request or null.
   */
  public async getRequestById(id: string): Promise<ICustomManufacturingRequest | null> {
    try {
      const request = await CustomManufacturingRequest.findById(id);
      if (request) {
        logger.info(`Retrieved custom manufacturing request by ID: ${id}`);
      } else {
        logger.warn(`Custom manufacturing request not found by ID: ${id}`);
      }
      return request;
    } catch (error: any) {
      logger.error(`Error getting custom manufacturing request by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates an existing custom manufacturing request.
   * @param id - The ID of the request to update.
   * @param updateData - The data to update.
   * @returns The updated request or null.
   */
  public async updateRequest(
    id: string,
    updateData: Partial<ICustomManufacturingRequest>
  ): Promise<ICustomManufacturingRequest | null> {
    try {
      const request = await CustomManufacturingRequest.findById(id);
      if (!request) {
        return null;
      }

      const originalStatus = request.status;

      Object.assign(request, updateData);
      await request.save();
      logger.info(`Updated custom manufacturing request: ${request.companyName} (ID: ${id})`);

      if (updateData.status && updateData.status !== originalStatus) {
        await NotificationService.createNotification({
          title: `Custom Request Status Update: ${request.requestNumber}`,
          message: `Custom request from ${request.contactPerson} changed from ${originalStatus} to ${request.status}.`,
          type: 'custom_request_status_update',
          link: `/admin-ahmza/custom-manufacturing/${request._id.toString()}`,
          relatedId: mongoose.Types.ObjectId.isValid(request._id) ? new mongoose.Types.ObjectId(request._id as string) : undefined,
        });

        const customerStatusLabel = this.formatStatus(request.status);
        let subject = `PureGrain: Status Update for Your Custom Request (Ref: ${request.requestNumber})`;
        let text = `Dear ${request.contactPerson},\n\nYour custom request (Ref: ${request.requestNumber}) status has been updated to ${customerStatusLabel}.\n\nBest regards,\nPureGrain Team`;
        let html = `<p>Dear ${request.contactPerson},</p><p>Your custom request (Ref: <strong>${request.requestNumber}</strong>) status has been updated to <strong>${customerStatusLabel}</strong>.</p><p>Best regards,<br/>PureGrain Team</p>`;

        switch (request.status) {
          case 'submitted':
            subject = `PureGrain: Your Custom Request Has Been Submitted (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nThank you for submitting your custom request. It is now in our queue for review.\n\nReference Number: ${request.requestNumber}\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>Thank you for submitting your custom request. It is now in our queue for review.</p><p><strong>Reference Number:</strong> ${request.requestNumber}</p><p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'under_review':
            subject = `PureGrain: Your Custom Request Is Under Review (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nYour custom request is currently under review by our team.\n\nReference Number: ${request.requestNumber}\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>Your custom request is currently <strong>under review</strong> by our team.</p><p><strong>Reference Number:</strong> ${request.requestNumber}</p><p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'approved':
            subject = `PureGrain: Your Custom Request Has Been Approved (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nGood news! Your custom request has been approved. We are preparing your invoice and payment details.\n\nReference Number: ${request.requestNumber}\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>Good news! Your custom request has been <strong>approved</strong>. We are preparing your invoice and payment details.</p><p><strong>Reference Number:</strong> ${request.requestNumber}</p><p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'invoice_sent':
            subject = `PureGrain: Invoice Sent for Your Custom Request (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nYour invoice has been sent for custom request ${request.requestNumber}. Please review the payment details and submit payment confirmation once payment is made.\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>Your invoice has been sent for custom request <strong>${request.requestNumber}</strong>. Please review the payment details and submit payment confirmation once payment is made.</p><p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'payment_pending':
            subject = `PureGrain: Payment Pending for Your Custom Request (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nWe are awaiting payment for your custom request ${request.requestNumber}. Once payment is received, we will continue processing.\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>We are awaiting payment for your custom request <strong>${request.requestNumber}</strong>. Once payment is received, we will continue processing.</p><p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'rejected':
            subject = `PureGrain: Your Custom Request Could Not Be Approved (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nAfter review, we are unable to proceed with your custom request at this time. ${request.adminComments ? `Reason: ${request.adminComments}\n\n` : ''}Reference Number: ${request.requestNumber}\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>After review, we are unable to proceed with your custom request at this time.</p>${request.adminComments ? `<p><strong>Reason:</strong> ${request.adminComments}</p>` : ''}<p><strong>Reference Number:</strong> ${request.requestNumber}</p><p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'paid':
            subject = `PureGrain: Payment Received for Your Custom Request (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nThank you! We have received your payment for custom request ${request.requestNumber}. Your order is now in processing.\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>Thank you! We have received your payment for custom request <strong>${request.requestNumber}</strong>. Your order is now in processing.</p><p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'processing':
            subject = `PureGrain: Your Custom Order Is Now Processing (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nYour custom order is now in processing. Our team is working on production and preparation.\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>Your custom order is now in <strong>processing</strong>. Our team is working on production and preparation.</p><p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'dispatched':
          case 'shipped':
            subject = `PureGrain: Your Custom Order Has Been Shipped (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nGreat news! Your custom order has been shipped.${request.trackingNumber ? ` Tracking Number: ${request.trackingNumber}.` : ''}${request.trackingLink ? ` Tracking Link: ${request.trackingLink}` : ''}\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>Great news! Your custom order has been <strong>shipped</strong>.</p>${request.trackingNumber ? `<p><strong>Tracking Number:</strong> ${request.trackingNumber}</p>` : ''}${request.trackingLink ? `<p><strong>Tracking Link:</strong> <a href="${request.trackingLink}" target="_blank" rel="noopener noreferrer">${request.trackingLink}</a></p>` : ''}<p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'delivered':
            subject = `PureGrain: Your Custom Order Has Been Delivered (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nYour custom order has been delivered. We hope everything meets your expectations.\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>Your custom order has been <strong>delivered</strong>. We hope everything meets your expectations.</p><p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'cancelled':
            subject = `PureGrain: Your Custom Request Has Been Cancelled (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nYour custom request has been cancelled.${request.adminComments ? ` Reason: ${request.adminComments}` : ''}\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>Your custom request has been cancelled.</p>${request.adminComments ? `<p><strong>Reason:</strong> ${request.adminComments}</p>` : ''}<p>Best regards,<br/>PureGrain Team</p>`;
            break;
          case 'expired':
            subject = `PureGrain: Your Custom Request Has Expired (Ref: ${request.requestNumber})`;
            text = `Dear ${request.contactPerson},\n\nYour custom request has expired. If you still need assistance, please submit a new request or contact us.\n\nBest regards,\nPureGrain Team`;
            html = `<p>Dear ${request.contactPerson},</p><p>Your custom request has expired. If you still need assistance, please submit a new request or contact us.</p><p>Best regards,<br/>PureGrain Team</p>`;
            break;
        }

        void sendEmail({
          to: request.email,
          subject,
          text,
          html,
        }).catch((err) => {
          logger.error(`[CustomManufacturingService] Status email failed for ${request._id} (Ref: ${request.requestNumber}):`, err);
        });
      }

      return request;
    } catch (error: any) {
      logger.error(`Error updating custom manufacturing request by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a custom manufacturing request by its ID.
   * NOTE: This does NOT delete associated design files from Cloudinary.
   * Implement Cloudinary deletion logic if needed.
   * @param id - The ID of the request to delete.
   * @returns True if deleted, false if not found.
   */
  public async deleteRequest(id: string): Promise<boolean> {
    try {
      const request = await CustomManufacturingRequest.findByIdAndDelete(id);
      if (request) {
        logger.info(`Deleted custom manufacturing request ID: ${id}`);
        // TODO: Add Cloudinary deletion for designFiles if necessary
        return true;
      } else {
        logger.warn(`Attempted to delete non-existent custom manufacturing request ID: ${id}`);
        return false;
      }
    } catch (error: any) {
      logger.error(`Error deleting custom manufacturing request by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  private formatStatus(status: string): string {
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export default new CustomManufacturingService();