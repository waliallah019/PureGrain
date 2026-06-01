// my-leather-platform/app/api/custom-manufacturing/[id]/route.ts
import { NextResponse } from 'next/server';
import connectDB from "@/lib/config/db";
import customManufacturingService from '@/lib/services/customManufacturingService';

// Connect to DB (assuming this connects or is a no-op if already connected)
connectDB();

// GET handler for fetching a single request by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Request ID is required' }, { status: 400 });
    }

    const request = await customManufacturingService.getRequestById(id);

    if (!request) {
      return NextResponse.json({ message: 'Custom manufacturing request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    console.error('Error fetching custom manufacturing request:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT handler for updating a request by ID (e.g., status update)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json(); // Get the request body

    if (!id) {
      return NextResponse.json({ message: 'Request ID is required' }, { status: 400 });
    }

    const updatedRequest = await customManufacturingService.updateRequest(id, body);

    if (!updatedRequest) {
      return NextResponse.json({ message: 'Custom manufacturing request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error: any) {
    console.error('Error updating custom manufacturing request:', error);
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Server error during update' }, { status: 500 });
  }
}

// DELETE handler for deleting a request by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Request ID is required' }, { status: 400 });
    }

    const deletedRequest = await customManufacturingService.deleteRequest(id);

    if (!deletedRequest) {
      return NextResponse.json({ message: 'Custom manufacturing request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Custom manufacturing request deleted' });
  } catch (error: any) {
    console.error('Error deleting custom manufacturing request:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// You might also have a POST handler for creating requests if this route also handles creation
// export async function POST(req: Request) { ... }