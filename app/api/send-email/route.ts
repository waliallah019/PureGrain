// my-leather-platform/app/api/send-email/route.ts
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/utils/sendEmail";
import logger from "@/lib/config/logger";

// Define a type for the expected request body
interface SendEmailRequestBody {
  to: string;
  subject: string;
  body: string; // The email content (can be HTML)
  requestLink: string; // Link back to the request detail page
}

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
  }

  try {
    const { to, subject, body, requestLink }: SendEmailRequestBody = await req.json();

    if (!to || !subject || !body || !requestLink) {
      return NextResponse.json(
        { message: "Missing required fields: to, subject, body, or requestLink" },
        { status: 400 },
      );
    }

    // Construct a more informative HTML email body
    const htmlBody = `
      <p>Dear ${to.split('@')[0]},</p>
      <p>${body.replace(/\n/g, '<br>')}</p>
      <br/>
      <p>---</p>
      <p>You can view the full request details <a href="${requestLink}">here</a>.</p>
      <p>Best regards,<br/>PureGrain Admin Team</p>
    `;

    await sendEmail({
      to,
      subject,
      text: body, // FIX: Added the required 'text' property
      html: htmlBody,
    });

    logger.info(`Email sent successfully via API to ${to}`);
    return NextResponse.json({ message: "Email sent successfully!" });
  } catch (error: any) {
    logger.error(`Failed to send email via API: ${error.message}`);
    return NextResponse.json(
      { message: "Failed to send email", error: error.message },
      { status: 500 },
    );
  }
}