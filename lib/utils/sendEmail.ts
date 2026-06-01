import nodemailer from 'nodemailer';
import logger from '@/lib/config/logger';

interface Attachment {
  filename: string;
  content: string; // Base64 encoded string
  encoding: 'base64';
  contentType: string; // e.g., 'application/pdf'
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string; // Optional: sender email, defaults to ADMIN_EMAIL
  requestLink?: string; // Optional: for internal use in HTML templates
  attachments?: Attachment[]; // FIX: Added attachments
  smtpUser?: string;
  smtpPass?: string;
}

const createTransporter = (smtpUser?: string, smtpPass?: string) => {
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: port === 465,
    auth: {
      user: smtpUser || process.env.EMAIL_USER,
      pass: smtpPass || process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

const transporter = createTransporter();

export const sendEmail = async ({ to, subject, text, html, from, requestLink, attachments, smtpUser, smtpPass }: EmailOptions): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const activeTransporter = smtpUser ? createTransporter(smtpUser, smtpPass) : transporter;

  const finalHtml = html || text;

  const mailOptions = {
    from: from || `PureGrain Admin <${adminEmail}>`,
    to,
    subject,
    text,
    html: finalHtml,
    attachments, // FIX: Pass attachments to nodemailer
  };

  try {
    const info = await activeTransporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Ethereal email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error}`);
    throw new Error(`Failed to send email to ${to}`);
  }
};