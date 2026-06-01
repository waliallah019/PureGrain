// my-leather-platform/lib/services/quoteService.ts
import QuoteRequest from '@/lib/models/QuoteRequest';
import { IQuoteRequest, QuoteRequestStatus } from '@/types/quote';
import NotificationService from '@/lib/services/notificationService';
import logger from '@/lib/config/logger';
import mongoose from 'mongoose';
import { sendEmail } from '@/lib/utils/sendEmail';
import { format } from 'date-fns';
import { customAlphabet } from 'nanoid'; // Import nanoid

// Initialize nanoid to generate alphanumeric IDs
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8); // 8-character alphanumeric ID

// Interface for filters
interface QuoteRequestFilters {
  status?: IQuoteRequest['status'] | 'all';
  search?: string;
  destinationCountry?: string;
  itemTypeCategory?: IQuoteRequest['itemTypeCategory'] | 'all';
}

class QuoteService {
  /**
   * Generates a unique, short alphanumeric request number.
   * Ensures uniqueness by checking against existing numbers.
   */
  private async generateUniqueRequestNumber(): Promise<string> {
    let unique = false;
    let newNumber = '';
    while (!unique) {
      newNumber = nanoid();
      const existingRequest = await QuoteRequest.findOne({ requestNumber: newNumber });
      if (!existingRequest) {
        unique = true;
      }
    }
    return newNumber;
  }

  /**
   * Creates a new quote request from customer.
   */
  public async createQuoteRequest(quoteData: Partial<IQuoteRequest>): Promise<IQuoteRequest> {
    try {
      // FIX: Generate a unique request number
      const requestNumber = await this.generateUniqueRequestNumber();

      const newQuoteRequest = new QuoteRequest({
        ...quoteData,
        requestNumber: requestNumber, // Assign the generated number
      });
      const savedQuote = await newQuoteRequest.save();
      logger.info(`New Quote Request created: ${savedQuote._id} (Ref: ${savedQuote.requestNumber}) from ${savedQuote.companyName}`);

      // Create notification for admin
      await NotificationService.createNotification({
        title: `New Quote Request: ${savedQuote.companyName}`,
        message: `Quote for ${savedQuote.itemName} (Qty: ${savedQuote.quantity} ${savedQuote.quantityUnit}) from ${savedQuote.customerName} (Ref: ${savedQuote.requestNumber}) has been submitted.`, // FIX: Use requestNumber
        type: 'new_quote_request',
        link: `/admin-ahmza/quotes/${savedQuote._id.toString()}`,
        relatedId: mongoose.Types.ObjectId.isValid(savedQuote._id) ? new mongoose.Types.ObjectId(savedQuote._id as string) : undefined,
      });

      // Send initial confirmation email to customer (improved content)
      // FIX: Use requestNumber for emails
      const displayId = savedQuote.requestNumber || savedQuote._id.toString().substring(0, 8) + '...';

      await sendEmail({
        to: savedQuote.customerEmail,
        subject: `PureGrain: Your Quote Request (Ref: ${displayId}) Received`, // FIX: Use displayId
        text: `Dear ${savedQuote.customerName},\n\nThank you for submitting your quote request for ${savedQuote.itemName} (Quantity: ${savedQuote.quantity} ${savedQuote.quantityUnit}).\n\nYour request has been received successfully and is currently under review.\nReference Number: ${displayId}\n\nOur team will contact you shortly with a detailed response or any follow-up questions, if required.\n\nThank you for choosing PureGrain.\n\nBest regards,\nThe PureGrain Team`,
        html: `
          <p>Dear ${savedQuote.customerName},</p>
          <p>Thank you for submitting your quote request for <strong>${savedQuote.itemName}</strong> (Quantity: ${savedQuote.quantity} ${savedQuote.quantityUnit}).</p>
          <p>Your request has been received successfully and is currently under review.</p>
          <p>Reference Number: <strong>${displayId}</strong></p>
          <p>Our team will contact you shortly with a detailed response or any follow-up questions, if required.</p>
          <p>Thank you for choosing PureGrain.</p>
          <p>Best regards,<br>The PureGrain Team</p>
        `,
      });


      return savedQuote;
    } catch (error: any) {
      logger.error(`Error creating quote request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves quote requests with filters, pagination, and sorting.
   */
  public async getQuoteRequests(
    filters: QuoteRequestFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<{ requests: IQuoteRequest[]; total: number; page: number; limit: number }> {
    const query: any = {};

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.destinationCountry) {
      query.destinationCountry = filters.destinationCountry;
    }
    if (filters.itemTypeCategory && filters.itemTypeCategory !== 'all') {
      query.itemTypeCategory = filters.itemTypeCategory;
    }
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { customerName: { $regex: searchRegex } },
        { companyName: { $regex: searchRegex } },
        { itemName: { $regex: searchRegex } },
        { requestNumber: { $regex: searchRegex } }, // FIX: Search by requestNumber
        ...(mongoose.Types.ObjectId.isValid(filters.search) ? [{ _id: new mongoose.Types.ObjectId(filters.search) }] : []),
      ];
    }

    try {
      const skip = (page - 1) * limit;
      const total = await QuoteRequest.countDocuments(query);

      const allowedSortFields = ['createdAt', 'updatedAt', 'status', 'customerName', 'companyName', 'itemName', 'proposedTotalPrice', 'requestNumber']; // FIX: Add requestNumber
      let sortOptions: { [key: string]: 1 | -1 } = {};

      if (sortBy && allowedSortFields.includes(sortBy)) {
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;
      } else {
        sortOptions = { createdAt: -1 }; // Default sort
        logger.warn(`Invalid or unallowed sortBy field for QuoteRequests: ${sortBy}. Defaulting to createdAt descending.`);
      }

      const requests = await QuoteRequest.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean<IQuoteRequest[]>();

      logger.info(`Retrieved ${requests.length} quote requests (total: ${total})`);
      return { requests, total, page, limit };
    } catch (error: any) {
      logger.error(`Error getting quote requests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets a single quote request by ID.
   */
  public async getQuoteRequestById(id: string): Promise<IQuoteRequest | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const request = await QuoteRequest.findById(id).lean<IQuoteRequest>();
      return request;
    } catch (error: any) {
      logger.error(`Error getting quote request by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates a quote request (e.g., status, price, tracking).
   */
  public async updateQuoteRequest(
    id: string,
    updateData: Partial<IQuoteRequest>
  ): Promise<IQuoteRequest | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid Quote Request ID.');
      }

      const originalRequest = await QuoteRequest.findById(id).lean<IQuoteRequest>();
      if (!originalRequest) {
        return null;
      }

      const updatedRequest = await QuoteRequest.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean<IQuoteRequest>();

      if (!updatedRequest) {
        return null;
      }

      logger.info(`Quote Request updated: ${id} (Ref: ${updatedRequest.requestNumber}) - Status: ${updatedRequest.status}`); // FIX: Use requestNumber in logs

      // Check if status has changed and send notification
      if (originalRequest.status !== updatedRequest.status) {
        void this.sendQuoteStatusUpdateEmail(originalRequest, updatedRequest, 'status_change').catch(err => { // FIRE AND FORGET
          logger.error(`[QuoteService] Fire-and-forget status_change email failed for ${updatedRequest._id} (Ref: ${updatedRequest.requestNumber}):`, err); // FIX: Use requestNumber in logs
        });
        await NotificationService.createNotification({
          title: `Quote Status Update: ${updatedRequest.requestNumber}`, // FIX: Use requestNumber
          message: `Quote for ${updatedRequest.itemName} from ${updatedRequest.companyName} (Ref: ${updatedRequest.requestNumber}) status changed to ${updatedRequest.status}.`, // FIX: Use requestNumber
          type: 'quote_status_update',
          link: `/admin-ahmza/quotes/${updatedRequest._id.toString()}`,
          relatedId: mongoose.Types.ObjectId.isValid(updatedRequest._id) ? new mongoose.Types.ObjectId(updatedRequest._id as string) : undefined,
        });
      }

      return updatedRequest;
    } catch (error: any) {
      logger.error(`Error updating quote request ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a quote request.
   */
  public async deleteQuoteRequest(id: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }
      const result = await QuoteRequest.deleteOne({ _id: id });
      if (result.deletedCount && result.deletedCount > 0) {
        logger.info(`Quote Request deleted: ${id}`);
        // FIX: No original request available here to get requestNumber, so fallback to truncated _id for notification
        await NotificationService.createNotification({
          title: `Quote Request Deleted: ${id.substring(0,8)}...`,
          message: `Quote request (ID: ${id.substring(0,8)}...) was deleted.`,
          type: 'info',
          link: undefined,
          relatedId: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : undefined,
        });
        return true;
      }
      return false;
    } catch (error: any) {
      logger.error(`Error deleting quote request ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sends an email to the customer about their quote request status update.
   */
  private async sendQuoteStatusUpdateEmail(originalQuote: IQuoteRequest, updatedQuote: IQuoteRequest, emailType: 'initial_paid' | 'status_change' | 'tracking_update' // Add emailType for consistency
  ): Promise<void> {
    const requestTitle = updatedQuote.itemName;
    // FIX: Use requestNumber for emails
    const displayId = updatedQuote.requestNumber || updatedQuote._id.toString().substring(0, 8) + '...';

    let subject = `PureGrain: Update on Your Quote Request (Ref: ${displayId})`; // FIX: Use displayId
    let emailText = `Dear ${updatedQuote.customerName},\n\nThe status of your quote request for "${requestTitle}" (Reference: ${displayId}) has been updated from ${originalQuote.status} to ${updatedQuote.status}.\n\n`; // FIX: Use displayId
    let emailHtml = `
      <p>Dear ${updatedQuote.customerName},</p>
      <p>The status of your quote request for <strong>${requestTitle}</strong> (Reference: <strong>${displayId}</strong>) has been updated.</p>
      <p><strong>Previous Status:</strong> ${this.formatStatus(originalQuote.status)}</p>
      <p><strong>New Status:</strong> ${this.formatStatus(updatedQuote.status)}</p>
      <br>
    `;

    switch (updatedQuote.status) {
      case 'approved':
        subject = `PureGrain: Your Quote Request Has Been Approved (Ref: ${displayId})`;
        emailText = `Dear ${updatedQuote.customerName},\n\nWe are pleased to inform you that your quote request for "${requestTitle}" (Reference: ${displayId}) has been approved.\n\nWe have reviewed your requirements and are preparing your invoice. You will receive payment details shortly.\n\n`;
        emailHtml = `
          <p>Dear ${updatedQuote.customerName},</p>
          <p>We are pleased to inform you that your quote request for <strong>${requestTitle}</strong> (Reference: <strong>${displayId}</strong>) has been <strong>approved</strong>.</p>
          <p>We have reviewed your requirements and are preparing your invoice. You will receive payment details shortly.</p>
        `;
        if (updatedQuote.proposedTotalPrice) {
            emailText += `Proposed Total Price: $${updatedQuote.proposedTotalPrice.toFixed(2)} USD\n`;
            emailHtml += `<p><strong>Proposed Total Price:</strong> $${updatedQuote.proposedTotalPrice.toFixed(2)} USD</p>`;
        }
        break;
      case 'rejected':
        subject = `PureGrain: Update on Your Quote Request for "${updatedQuote.itemName}" (Ref: ${displayId})`; // FIX: Use displayId
        emailText = `Dear ${updatedQuote.customerName},\n\nAfter careful consideration, we regret to inform you that your quote request for "${requestTitle}" (Reference: ${displayId}) could not be approved at this time.\n\n`; // FIX: Use displayId
        emailHtml = `
          <p>Dear ${updatedQuote.customerName},</p>
          <p>After careful consideration, we regret to inform you that your quote request for <strong>${requestTitle}</strong> (Reference: ${displayId}) could not be approved at this time. We may not be able to meet the specific requirements or current production capacity.</p>
        `;
        if (updatedQuote.adminComments) {
          emailText += `Our comments: ${updatedQuote.adminComments}\n\n`;
          emailHtml += `<p><strong>Our comments:</strong> ${updatedQuote.adminComments}</p>`;
        }
        break;
      case 'paid':
        subject = `PureGrain: Payment Confirmation for Invoice #${updatedQuote.invoiceId?.toString().substring(0, 8)}... (Ref: ${displayId})`; // FIX: Use displayId
        emailText = `Dear ${updatedQuote.customerName},\n\nThank you! We have received your payment for quote request (Reference: ${displayId}). Your order is now confirmed and will proceed to the next stage.\n\n`; // FIX: Use displayId
        emailHtml = `
          <p>Dear ${updatedQuote.customerName},</p>
          <p>Thank you for your payment! We have successfully received your payment for invoice #${updatedQuote.invoiceId?.toString().substring(0, 8)}... related to your quote request (Reference: ${displayId}).</p>
          <p>Your order is now confirmed and will proceed to the next stage (processing/dispatch).</p>
        `;
        break;
      case 'dispatched':
        subject = `PureGrain: Your Order for "${updatedQuote.itemName}" Has Been Dispatched! (Ref: ${displayId})`; // FIX: Use displayId
        emailText = `Dear ${updatedQuote.customerName},\n\nGreat news! Your order for "${requestTitle}" (Reference: ${displayId}) has been dispatched.\n\n`; // FIX: Use displayId
        emailHtml = `
          <p>Dear ${updatedQuote.customerName},</p>
          <p>Great news! Your order for <strong>${requestTitle}</strong> (Reference: ${displayId}) has been dispatched.</p>
          <p>You can track its journey using the details below:</p>
        `;
        if (updatedQuote.trackingNumber) {
          emailText += `Tracking Number: ${updatedQuote.trackingNumber}\n`;
          emailHtml += `<p><strong>Tracking Number:</strong> ${updatedQuote.trackingNumber}</p>`;
        }
        if (updatedQuote.trackingLink) {
          emailText += `Tracking Link: <a href="${updatedQuote.trackingLink}">${updatedQuote.trackingLink}</a>\n`;
          emailHtml += `<p><strong>Tracking Link:</strong> <a href="${updatedQuote.trackingLink}">${updatedQuote.trackingLink}</a></p>`;
        }
        if (updatedQuote.dispatchedAt) {
          emailText += `Dispatched On: ${format(new Date(updatedQuote.dispatchedAt), 'MMM dd, yyyy HH:mm')}\n`;
          emailHtml += `<p><strong>Dispatched On:</strong> ${format(new Date(updatedQuote.dispatchedAt), 'MMM dd, yyyy HH:mm')}</p>`;
        }
        emailText += `\nWe hope you enjoy your purchase!`;
        emailHtml += `<br><p>We hope you enjoy your purchase!</p>`;
        break;
      case 'cancelled':
        subject = `PureGrain: Your Quote Request for "${updatedQuote.itemName}" Has Been Cancelled (Ref: ${displayId})`; // FIX: Use displayId
        emailText = `Dear ${updatedQuote.customerName},\n\nWe regret to inform you that your quote request for "${requestTitle}" (Reference: ${displayId}) has been cancelled.\n\n`; // FIX: Use displayId
        emailHtml = `
          <p>Dear ${updatedQuote.customerName},</p>
          <p>We regret to inform you that your quote request for <strong>${requestTitle}</strong> (Reference: ${displayId}) has been <strong>CANCELLED</strong>.</p>
        `;
        if (updatedQuote.adminComments) {
          emailText += `Reason: ${updatedQuote.adminComments}\n\n`;
          emailHtml += `<p><strong>Reason:</strong> ${updatedQuote.adminComments}</p>`;
        }
        emailText += `If this was an error or you wish to discuss, please contact us.`;
        emailHtml += `<p>If you believe this is an error or wish to discuss this further, please do not hesitate to contact our support team.</p>`;
        break;
      case 'requested':
      default:
        subject = `PureGrain: Quote Request Status Update for "${updatedQuote.itemName}" (Ref: ${displayId})`; // FIX: Use displayId
        emailText = `Dear ${updatedQuote.customerName},\n\nThe status of your quote request for "${requestTitle}" (Reference: ${displayId}) is now ${updatedQuote.status}.\n\n`; // FIX: Use displayId
        emailHtml = `
          <p>Dear ${updatedQuote.customerName},</p>
          <p>The status of your quote request for <strong>${requestTitle}</strong> (Reference: ${displayId}) is now <strong>${this.formatStatus(updatedQuote.status)}</strong>.</p>
        `;
        break;
    }

    emailText += `If you have any questions, please feel free to contact us.\n\nBest regards,\nThe PureGrain Team`;

    emailHtml += `
      <p>If you have any questions, please feel free to contact us.</p>
      <p>Best regards,<br>The PureGrain Team</p>
    `;

    try {
      await sendEmail({
        to: updatedQuote.customerEmail,
        subject: subject,
        text: emailText,
        html: emailHtml,
      });
      logger.info(`Customer notification email (Ref: ${displayId}) sent for Quote ID ${updatedQuote._id} status ${updatedQuote.status}.`); // FIX: Use displayId
    } catch (emailError) {
      logger.error(`Failed to send customer notification email (Ref: ${displayId}) for Quote ID ${updatedQuote._id}: ${emailError}`); // FIX: Use displayId
    }
  }

  private formatStatus(status: QuoteRequestStatus): string {
    return status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}

const quoteService = new QuoteService();
export default quoteService;