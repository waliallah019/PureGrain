// C:\Dev\puretemp-main\lib\services\sampleService.ts
import SampleRequest, { ISampleRequest, PaymentStatus } from '@/lib/models/sampleRequestModel';
import NotificationService from '@/lib/services/notificationService';
import logger from '@/lib/config/logger';
import mongoose from 'mongoose';
import { sendEmail } from '@/lib/utils/sendEmail';
import { format } from 'date-fns';
import { customAlphabet } from 'nanoid'; // Import nanoid for unique short IDs

// Initialize nanoid to generate alphanumeric IDs
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8); // 8-character alphanumeric ID

interface SampleRequestFilters {
  status?: PaymentStatus | 'all';
  search?: string;
  country?: string;
  sampleType?: ISampleRequest['sampleType'] | 'all';
}

class SampleService {
  /**
   * Generates a unique, short alphanumeric request number.
   * Ensures uniqueness by checking against existing numbers.
   */
  private async generateUniqueRequestNumber(): Promise<string> {
    let unique = false;
    let newNumber = '';
    while (!unique) {
      newNumber = nanoid();
      const existingRequest = await SampleRequest.findOne({ requestNumber: newNumber });
      if (!existingRequest) {
        unique = true;
      }
    }
    return newNumber;
  }

  /**
   * Generates the public-facing order reference in the format
   * `PGE-YYYY-XXXX`. The numeric suffix is the (year-scoped) document
   * count + 1, zero-padded to four digits, and we re-roll on the rare
   * collision so the value remains unique even under concurrency.
   */
  public async generateOrderRef(): Promise<string> {
    const year = new Date().getFullYear();
    let attempts = 0;
    while (attempts < 5) {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const yearCount = await SampleRequest.countDocuments({ createdAt: { $gte: startOfYear } });
      const candidate = `PGE-${year}-${String(yearCount + 1 + attempts).padStart(4, '0')}`;
      const existing = await SampleRequest.findOne({ orderRef: candidate }).lean();
      if (!existing) return candidate;
      attempts += 1;
    }
    // Fallback — extremely unlikely; pad with random suffix to avoid blocking.
    return `PGE-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  /**
   * Creates a new sample request.
    * This is typically called before payment proof is submitted.
   */
  public async createSampleRequest(sampleData: Partial<ISampleRequest>): Promise<ISampleRequest> {
    try {
      // FIX: Generate a unique request number
      const requestNumber = await this.generateUniqueRequestNumber();

      // Generate the public-facing order reference if the caller did not
      // pass one in. Older flows that don't yet set an orderRef will still
      // get one going forward, while leaving legacy records untouched.
      const orderRef = sampleData.orderRef || (await this.generateOrderRef());

      const newSampleRequest = new SampleRequest({
        ...sampleData,
        requestNumber: requestNumber, // Assign the generated number
        orderRef,
        paymentStatus: sampleData.paymentStatus || 'pending',
      });
      const savedRequest = await newSampleRequest.save();
      logger.info('Sample request saved successfully with ID:', savedRequest._id, 'Request Number:', savedRequest.requestNumber);

      const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'https://pure-grain-three.vercel.app';
      if (savedRequest.paymentConfirmationToken) {
        const paymentConfirmationLink = `${baseUrl.replace(/\/$/, '')}/payment-confirmation/${savedRequest.paymentConfirmationToken}`;

        void sendEmail({
          to: savedRequest.email,
          subject: `PureGrain: Submit Your Payment Confirmation (Ref: ${savedRequest.requestNumber})`,
          text: `Dear ${savedRequest.contactPerson || 'Customer'},\n\nThank you for your sample request (Ref: ${savedRequest.requestNumber}).\n\nPlease submit your payment confirmation here:\n${paymentConfirmationLink}\n\nIf you already submitted your proof of payment, please ignore this email.\n\nBest regards,\nPureGrain Team`,
          html: `<p>Dear ${savedRequest.contactPerson || 'Customer'},</p>
                 <p>Thank you for your sample request (Ref: <strong>${savedRequest.requestNumber}</strong>).</p>
                 <p>Please submit your payment confirmation using the link below:</p>
                 <p><a href="${paymentConfirmationLink}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:white;text-decoration:none;border-radius:6px;font-weight:600;">Submit Payment Confirmation</a></p>
                 <p style="color:#666;font-size:13px;font-style:italic;"><strong>Note:</strong> If you have already submitted your proof of payment, please ignore this email.</p>
                 <p>Best regards,<br/>PureGrain Team</p>`,
        }).catch((err) => {
          logger.error(`[SampleService] Payment confirmation reminder email failed for ${savedRequest._id} (Req# ${savedRequest.requestNumber}):`, err);
        });
      } else if (savedRequest.paymentStatus === 'paid') {
        // Keep existing behavior for flows where payment is already completed before creation.
        void this.sendSampleStatusUpdateEmail(null, savedRequest, 'initial_paid').catch(err => {
          logger.error(`[SampleService] Fire-and-forget initial_paid email failed for ${savedRequest._id} (Req# ${savedRequest.requestNumber}):`, err);
        });
        // New (additive) admin email — only triggered for the unified review
        // flow which carries the richer items[]/industry/website context.
        // Legacy flows still rely on the in-app NotificationService alone.
        if (savedRequest.requestType) {
          void this.sendAdminNewSampleEmail(savedRequest).catch((err) => {
            logger.error(`[SampleService] Admin new-sample email failed for ${savedRequest._id} (Req# ${savedRequest.requestNumber}):`, err);
          });
        }
      }

      // Create a notification for the admin
      await NotificationService.createNotification({
        title: `New Sample Request from ${savedRequest.companyName}`,
        message: `A new sample request (Ref: ${savedRequest.requestNumber}) has been received from ${savedRequest.contactPerson} (${savedRequest.email}).`,
        type: 'new_sample_request',
        link: `/admin-ahmza/samples/${savedRequest._id.toString()}`, // Link still uses MongoDB ID
        relatedId: mongoose.Types.ObjectId.isValid(savedRequest._id) ? new mongoose.Types.ObjectId(savedRequest._id as string) : undefined,
      });
      logger.info('Admin notification created for new sample request.');

      return savedRequest;
    } catch (error: any) {
      logger.error('Error creating sample request:', error);
      throw error;
    }
  }

  /**
   * Retrieves sample requests with filters, pagination, and sorting.
   */
  public async getSampleRequests(
    filters: SampleRequestFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<{ requests: ISampleRequest[]; total: number; page: number; limit: number }> {
    const query: any = {};

    if (filters.search) {
      query.$or = [
        { companyName: { $regex: filters.search, $options: 'i' } },
        { contactPerson: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { requestNumber: { $regex: filters.search, $options: 'i' } }, // FIX: Search by requestNumber
        ...(mongoose.Types.ObjectId.isValid(filters.search) ? [{ _id: new mongoose.Types.ObjectId(filters.search) }] : []),
      ];
    }
    if (filters.status && filters.status !== 'all') {
      query.paymentStatus = filters.status;
    }
    if (filters.sampleType && filters.sampleType !== 'all') {
      query.sampleType = filters.sampleType;
    }
    if (filters.country) {
      query.country = filters.country;
    }

    try {
      const sortOptions: { [key: string]: 1 | -1 } = {};
      if (sortBy) {
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;
      } else {
        sortOptions.createdAt = -1;
      }

      const skip = (page - 1) * limit;

      const [requests, total] = await Promise.all([
        SampleRequest.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean<ISampleRequest[]>(),
        SampleRequest.countDocuments(query),
      ]);

      logger.info(`Retrieved ${requests.length} sample requests (total: ${total})`);
      return { requests, total, page, limit };
    } catch (error: any) {
      logger.error(`Error getting sample requests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets a single sample request by ID.
   */
  public async getSampleRequestById(id: string): Promise<ISampleRequest | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      const request = await SampleRequest.findById(id).lean<ISampleRequest>();
      return request;
    } catch (error: any) {
      logger.error(`Error getting sample request by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates a sample request (e.g., status, tracking).
   */
  public async updateSampleRequest(
    id: string,
    updateData: Partial<ISampleRequest>
  ): Promise<ISampleRequest | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid Sample Request ID.');
      }

      const originalRequest = await SampleRequest.findById(id).lean<ISampleRequest>();
      if (!originalRequest) {
        return null;
      }

      // Handle shippedAt logic
      if (updateData.paymentStatus === 'shipped' && !originalRequest.shippedAt) {
        updateData.shippedAt = new Date();
      } else if (updateData.paymentStatus !== 'shipped' && originalRequest.shippedAt) {
        updateData.shippedAt = undefined;
      }

      const updatedRequest = await SampleRequest.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean<ISampleRequest>();

      if (!updatedRequest) {
        return null;
      }

      logger.info(`Sample Request updated: ${id} (Req# ${updatedRequest.requestNumber}) - Status: ${updatedRequest.paymentStatus}`);

      const statusChanged = originalRequest.paymentStatus !== updatedRequest.paymentStatus;
      const movedToShipped = statusChanged && updatedRequest.paymentStatus === 'shipped';

      if (statusChanged && !movedToShipped) {
        void this.sendSampleStatusUpdateEmail(originalRequest, updatedRequest, 'status_change').catch(err => {
            logger.error(`[SampleService] Fire-and-forget status_change email failed for ${updatedRequest._id} (Req# ${updatedRequest.requestNumber}):`, err);
        });
      }

      if (statusChanged) {
        await NotificationService.createNotification({
          title: `Sample Status Update: ${updatedRequest.requestNumber}`, // FIX: Use requestNumber
          message: `Sample request from ${updatedRequest.companyName} status changed to ${updatedRequest.paymentStatus}.`,
          type: 'sample_status_update',
          link: `/admin-ahmza/samples/${updatedRequest._id.toString()}`,
          relatedId: mongoose.Types.ObjectId.isValid(updatedRequest._id) ? new mongoose.Types.ObjectId(updatedRequest._id as string) : undefined,
        });
      }

      const previousTrackingLink = (originalRequest.shippingTrackingLink || '').trim();
      const newTrackingLink = (updatedRequest.shippingTrackingLink || '').trim();
      const trackingLinkChanged = newTrackingLink !== previousTrackingLink;

      if (updatedRequest.paymentStatus === 'shipped' && trackingLinkChanged && newTrackingLink) {
         void this.sendSampleStatusUpdateEmail(originalRequest, updatedRequest, 'tracking_update').catch(err => {
             logger.error(`[SampleService] Fire-and-forget tracking_update email failed for ${updatedRequest._id} (Req# ${updatedRequest.requestNumber}):`, err);
         });
      }

      return updatedRequest;
    } catch (error: any) {
      logger.error(`Error updating sample request ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a sample request.
   */
  public async deleteSampleRequest(id: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }
      const deleted = await SampleRequest.findByIdAndDelete(id).lean<ISampleRequest>();

      if (deleted) {
        logger.info(`Sample request deleted: ${id} (Req# ${deleted.requestNumber})`);
        await NotificationService.createNotification({
          title: `Sample Request Deleted: ${deleted.companyName}`,
          message: `Sample request (Ref: ${deleted.requestNumber}) from ${deleted.contactPerson} was deleted.`, // FIX: Use requestNumber
          type: 'info',
          link: undefined,
          relatedId: mongoose.Types.ObjectId.isValid(deleted._id) ? new mongoose.Types.ObjectId(deleted._id as string) : undefined,
        });
        return true;
      }
      return false;
    } catch (error: any) {
      logger.error(`Error deleting sample request ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sends an email to the customer about their sample request status update.
   */
  private async sendSampleStatusUpdateEmail(
    originalRequest: ISampleRequest | null,
    updatedRequest: ISampleRequest,
    emailType: 'initial_paid' | 'status_change' | 'tracking_update'
  ): Promise<void> {
    // Safety guard: shipped updates must only use tracking_update emails.
    if (emailType === 'status_change' && updatedRequest.paymentStatus === 'shipped') {
      logger.info(`[SampleService] Skipping shipped status_change email for ${updatedRequest._id} (Req# ${updatedRequest.requestNumber}).`);
      return;
    }

    // Safety guard: tracking emails require a usable tracking link.
    if (emailType === 'tracking_update' && !(updatedRequest.shippingTrackingLink || '').trim()) {
      logger.info(`[SampleService] Skipping tracking_update email with empty tracking link for ${updatedRequest._id} (Req# ${updatedRequest.requestNumber}).`);
      return;
    }

    const requestTitle = updatedRequest.productName || updatedRequest.sampleType || 'your sample request';
    // FIX: Use requestNumber for emails
    const displayId = updatedRequest.requestNumber || updatedRequest._id.toString().substring(0, 8) + '...';


    let subject = `PureGrain: Update on Your Sample Request (Ref: ${displayId})`;
    let emailTextContent = ``;
    let emailHtmlContent = ``;

    const commonEmailHeader = `
      <p>Dear ${updatedRequest.contactPerson || 'Customer'},</p>
      <p>This is an update regarding your sample request for <strong>${requestTitle}</strong> (Reference: <strong>${displayId}</strong>).</p>
      <br>
    `;

    const commonEmailFooter = `
      <p>If you have any questions, please feel free to contact us.</p>
      <p>Best regards,<br>The PureGrain Team</p>
    `;

    switch (emailType) {
        case 'initial_paid':
            subject = `PureGrain: Your Sample Request Payment Confirmed & Order Placed (Ref: ${displayId})!`;
          emailTextContent = `Dear ${updatedRequest.contactPerson},\n\nThank you for your payment. We have successfully received payment for your sample request for "${requestTitle}" (Ref: ${displayId}). Your order is now placed, and processing will begin shortly.\n\nWe will notify you once your samples are shipped.\n\nBest regards,\nThe PureGrain Team`;
            emailHtmlContent = `
                ${commonEmailHeader}
                <p>Thank you for your payment! We have successfully received it for your sample request.</p>
                <p>Your order for <strong>${requestTitle}</strong> (Reference: ${displayId}) is now placed, and we will begin processing it shortly.</p>
                ${this.buildItemsListHtml(updatedRequest)}
                ${this.buildShippingTimelineHtml(updatedRequest)}
                ${this.buildWhatsNextHtml()}
                <p>We will notify you as soon as your samples are shipped.</p>
                ${commonEmailFooter}
            `;
            break;

        case 'status_change':
            const previousStatus = originalRequest ? this.formatStatus(originalRequest.paymentStatus) : 'N/A';
            const newStatus = this.formatStatus(updatedRequest.paymentStatus);

            subject = `PureGrain: Status Update for Your Sample Request (Ref: ${displayId})`;
            emailTextContent = `Dear ${updatedRequest.contactPerson},\n\nThe status of your sample request for "${requestTitle}" (Ref: ${displayId}) has been updated from ${previousStatus} to ${newStatus}.\n\n`;
            emailHtmlContent = `
                ${commonEmailHeader}
                <p>The status of your sample request for <strong>${requestTitle}</strong> (Reference: ${displayId}) has been updated:</p>
                <ul>
                    <li><strong>Previous Status:</strong> ${previousStatus}</li>
                    <li><strong>New Status:</strong> ${newStatus}</li>
                </ul>
            `;

            switch (updatedRequest.paymentStatus) {
                case 'pending':
                  emailTextContent += `Your request is currently pending. We might need additional information, or it may be awaiting manual review. Please contact us if you have any questions.`;
                  emailHtmlContent += `<p>Your request is currently pending. We might need additional information, or it may be awaiting manual review. Please contact us if you have any questions.</p>`;
                    break;
                case 'processing':
                    emailTextContent += `Your sample request is now being processed. We are preparing your samples for shipment.`;
                    emailHtmlContent += `<p>Your sample request is now being processed. We are actively preparing your samples for shipment.</p>`;
                    break;
                case 'shipped':
                    emailTextContent += `Your sample request has been shipped. We will provide tracking details in a separate email or update shortly.`;
                    emailHtmlContent += `<p>Your sample request has been shipped! We will provide tracking details in a separate email or update shortly.</p>`;
                    break;
                case 'delivered':
                    emailTextContent += `Your sample request has been delivered. We hope you are satisfied with your samples.`;
                    emailHtmlContent += `<p>Your sample request has been <strong>DELIVERED</strong>! We hope you are satisfied with your samples.</p>
                                         <p>Please feel free to reach out if you have any feedback or further requirements.</p>`;
                    break;
                case 'cancelled':
                    emailTextContent += `Your sample request has been cancelled. If you have any questions or this was an error, please contact us.`;
                    emailHtmlContent += `<p>Your sample request has been <strong>CANCELLED</strong>. If you believe this is an error or wish to discuss this further, please do not hesitate to contact our support team.</p>`;
                    break;
                case 'failed':
                    emailTextContent += `Your sample request payment has failed. Please check your payment method or contact us to resolve this issue.`;
                    emailHtmlContent += `<p>We regret to inform you that the payment for your sample request has <strong>FAILED</strong>. Please check your payment method or contact our support team to resolve this issue and re-initiate your order.</p>`;
                    break;
                case 'refunded':
                    emailTextContent += `Your sample request has been refunded. The refund should appear in your account within 5-10 business days.`;
                    emailHtmlContent += `<p>Your sample request has been <strong>REFUNDED</strong>. The refund amount should appear in your account within 5-10 business days, depending on your bank.</p>
                                         <p>If you have any further questions, please contact us.</p>`;
                    break;
                default:
                  emailTextContent += `Please contact us if you need any further details.`;
                  emailHtmlContent += `<p>Please contact us if you need any further details.</p>`;
            }
            emailHtmlContent += commonEmailFooter;
            break;

        case 'tracking_update':
            if (updatedRequest.paymentStatus !== 'shipped') {
                logger.warn(`Attempted to send tracking_update email for non-shipped status: ${updatedRequest.paymentStatus}`);
                return;
            }
            subject = `PureGrain: Your Sample Order for "${requestTitle}" Has Been Shipped! (Ref: ${displayId})`;
            emailTextContent = `Dear ${updatedRequest.contactPerson},\n\nGreat news! Your sample order for "${requestTitle}" (Ref: ${displayId}) has been shipped.`;
            emailHtmlContent = `${commonEmailHeader}
                <p>Great news! Your sample order for <strong>${requestTitle}</strong> (Reference: ${displayId}) has been shipped.</p>
                <p>You can track its journey using the details below:</p>
            `;

            if (updatedRequest.shippingTrackingLink) {
                emailTextContent += `\nTracking Link: ${updatedRequest.shippingTrackingLink}`;
                emailHtmlContent += `<p><strong>Tracking Link:</strong> <a href="${updatedRequest.shippingTrackingLink}" target="_blank">${updatedRequest.shippingTrackingLink}</a></p>`;
            } else if (updatedRequest.trackingNumber) {
                // Fall back to a DHL "track by ID" deep link when the admin
                // only stored the bare tracking number on the request.
                const dhlLink = `https://www.dhl.com/tracking?id=${encodeURIComponent(updatedRequest.trackingNumber)}`;
                emailTextContent += `\nTracking Number: ${updatedRequest.trackingNumber}\nTrack: ${dhlLink}`;
                emailHtmlContent += `<p><strong>Tracking Number:</strong> ${updatedRequest.trackingNumber}${updatedRequest.courierName ? ` (${updatedRequest.courierName})` : ''}</p>
                                     <p><a href="${dhlLink}" target="_blank">Track your shipment</a></p>`;
            }
            if (updatedRequest.shippedAt) {
                emailTextContent += `\nShipped On: ${format(new Date(updatedRequest.shippedAt), 'MMM dd, yyyy HH:mm')}`;
                emailHtmlContent += `<p><strong>Shipped On:</strong> ${format(new Date(updatedRequest.shippedAt), 'MMM dd, yyyy HH:mm')}</p>`;
            }
            emailTextContent += `\n\nWe hope you enjoy your samples from PureGrain.`;
            emailHtmlContent += `<p>We hope you enjoy your samples from PureGrain.</p>${commonEmailFooter}`;
            break;
    }

    try {
      await sendEmail({
        to: updatedRequest.email,
        subject: subject,
        text: emailTextContent,
        html: emailHtmlContent,
      });
      logger.info(`Customer notification email (${emailType}) sent for Sample ID ${updatedRequest._id} (Req# ${updatedRequest.requestNumber}) status ${updatedRequest.paymentStatus}.`);
    } catch (emailError) {
      logger.error(`Failed to send customer notification email (${emailType}) for Sample ID ${updatedRequest._id} (Req# ${updatedRequest.requestNumber}): ${emailError}`);
    }
  }

  private formatStatus(status: PaymentStatus): string {
    return status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  /**
   * Renders an HTML <ul> of the requested items, including hide-specific
   * specifications. Returns an empty string when the request does not
   * carry the new items[] payload (legacy single-product requests).
   */
  private buildItemsListHtml(req: ISampleRequest): string {
    if (!req.items || req.items.length === 0) return '';
    const rows = req.items
      .map((it) => {
        const specs = [it.hideType, it.grade, it.thickness, it.tanningMethod, it.finish, it.variantName]
          .filter(Boolean)
          .join(' · ');
        return `<li><strong>${it.productName || 'Sample item'}</strong>${specs ? ` <span style="color:#666;">— ${specs}</span>` : ''}</li>`;
      })
      .join('');
    const heading = req.requestType === 'HIDE' ? 'Requested hides' : 'Requested product';
    return `<p style="margin-top:18px;"><strong>${heading}:</strong></p><ul>${rows}</ul>`;
  }

  /**
   * Renders the estimated-timeline line for the buyer email when we know
   * the destination transit days from the ShippingRate lookup.
   */
  private buildShippingTimelineHtml(req: ISampleRequest): string {
    if (!req.estimatedDays) return '';
    return `<p><strong>Estimated transit:</strong> ${req.estimatedDays} via DHL Express to ${req.country}.</p>`;
  }

  /**
   * Standard 4-step "what happens next" block included in the buyer
   * confirmation email and the post-payment success page.
   */
  private buildWhatsNextHtml(): string {
    return `
      <p style="margin-top:18px;"><strong>What happens next</strong></p>
      <ol>
        <li>We receive your order</li>
        <li>We pack your samples (1-2 days)</li>
        <li>DHL collects and ships (day 2-3)</li>
        <li>Samples arrive at your door</li>
      </ol>
    `;
  }

  /**
   * Notifies the configured admin inbox of a fresh sample request that
   * came through the unified review flow. Includes the rich context that
   * isn't covered by the existing in-app NotificationService.
   */
  private async sendAdminNewSampleEmail(req: ISampleRequest): Promise<void> {
    const adminTo = process.env.ADMIN_EMAIL;
    if (!adminTo) {
      logger.warn('[SampleService] ADMIN_EMAIL not set — skipping admin new-sample email.');
      return;
    }
    const ref = req.orderRef || req.requestNumber;
    const itemsHtml = this.buildItemsListHtml(req);
    const meta = `
      <ul>
        <li><strong>Buyer:</strong> ${req.contactPerson} &lt;${req.email}&gt;${req.phone ? ` · ${req.phone}` : ''}</li>
        <li><strong>Company:</strong> ${req.companyName}</li>
        <li><strong>Country:</strong> ${req.country}</li>
        ${req.industry ? `<li><strong>Industry:</strong> ${req.industry}</li>` : ''}
        ${req.website ? `<li><strong>Website:</strong> ${req.website}</li>` : ''}
        <li><strong>Type:</strong> ${req.requestType || 'n/a'}</li>
        <li><strong>Shipping charged:</strong> $${(req.shippingFee || 0).toFixed(2)} USD${req.estimatedDays ? ` (${req.estimatedDays})` : ''}</li>
        ${req.notes ? `<li><strong>Notes:</strong> ${req.notes}</li>` : ''}
      </ul>
    `;
    const subject = `New sample request — ${ref} (${req.requestType || 'sample'})`;
    const html = `
      <p>A new sample request has been received.</p>
      <p><strong>Order reference:</strong> ${ref}</p>
      ${meta}
      ${itemsHtml}
      <p style="margin-top:14px;"><a href="${(process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || '').replace(/\/$/, '')}/admin-ahmza/samples/${req._id}">Open in admin</a></p>
    `;
    await sendEmail({ to: adminTo, subject, html, text: `${subject}\n\nBuyer: ${req.contactPerson} <${req.email}>\nCompany: ${req.companyName}\nCountry: ${req.country}` });
  }
}

const sampleService = new SampleService();
export default sampleService;