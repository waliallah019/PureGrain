import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import cloudinary from "@/lib/config/cloudinary";
import { handleApiError } from "@/lib/utils/errorHandler";

export const dynamic = "force-dynamic";
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const formData = await req.formData();
    const image = formData.get("file");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Image file is required." },
        { status: 400 }
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const b64 = buffer.toString("base64");
    const dataUri = `data:${image.type};base64,${b64}`;

    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: "blogs/content",
      resource_type: "image",
      quality: "auto:eco",
      fetch_format: "auto",
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    });

    // TinyMCE expects an object with a `location` field.
    return NextResponse.json({ location: uploaded.secure_url });
  } catch (error) {
    return handleApiError(error);
  }
}
