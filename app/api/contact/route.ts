// my-leather-platform/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import messageService from "@/lib/services/messageService";
import { handleApiError } from "@/lib/utils/errorHandler";
import { validateRequest } from "@/lib/middleware/validateRequest";
import { contactFormSchema } from "@/lib/validators/contactValidator";
import logger from "@/lib/config/logger";
import { sendEmail } from "@/lib/utils/sendEmail";

export const dynamic = 'force-dynamic'; // Ensure dynamic behavior

// POST endpoint for contact form submission
export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const body = await req.json(); // Assuming JSON body for contact form

    const validation = await validateRequest(contactFormSchema, req, body);
    if (!validation.success) {
      return validation.errorResponse;
    }
    const formData = validation.data.body;

    const newMessage = await messageService.createMessage({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      companyName: formData.companyName,
      country: formData.country,
      industry: formData.industry,
      inquiryType: formData.inquiryType,
      message: formData.message,
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      logger.error("ADMIN_EMAIL is not configured. Contact form notification email was not sent.");
      throw new Error("Email notifications are not configured.");
    }

    const contactSummaryText = [
      "A new contact form query was submitted:",
      "",
      `Name: ${formData.fullName}`,
      `Email: ${formData.email}`,
      `Phone: ${formData.phone || "N/A"}`,
      `Company: ${formData.companyName || "N/A"}`,
      `Country: ${formData.country || "N/A"}`,
      `Industry: ${formData.industry || "N/A"}`,
      `Inquiry Type: ${formData.inquiryType}`,
      "",
      "Message:",
      formData.message,
      "",
      `Message ID: ${newMessage._id.toString()}`,
    ].join("\n");

    const escapeHtml = (value: string) =>
      value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

    const formattedMessage = escapeHtml(formData.message).replace(/\n/g, "<br />");

    await sendEmail({
      to: adminEmail,
      subject: `New Contact Query: ${formData.inquiryType}`,
      text: contactSummaryText,
      html: `
        <h2>New Contact Form Query</h2>
        <p><strong>Name:</strong> ${formData.fullName}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Phone:</strong> ${formData.phone || "N/A"}</p>
        <p><strong>Company:</strong> ${formData.companyName || "N/A"}</p>
        <p><strong>Country:</strong> ${formData.country || "N/A"}</p>
        <p><strong>Industry:</strong> ${formData.industry || "N/A"}</p>
        <p><strong>Inquiry Type:</strong> ${formData.inquiryType}</p>
        <p><strong>Message ID:</strong> ${newMessage._id.toString()}</p>
        <p><strong>Message:</strong></p>
        <div style="white-space: normal; line-height: 1.7;">${formattedMessage}</div>
      `,
    });

    logger.info(`Contact form submission processed: ${newMessage._id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been sent successfully! We will get back to you soon.",
        data: newMessage,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}