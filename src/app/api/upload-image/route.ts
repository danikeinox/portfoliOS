import { Buffer } from "node:buffer";
import { NextResponse, type NextRequest } from "next/server";
import { applyRateLimit, enforceSameOrigin } from "@/lib/api/security";
import { uploadToR2 } from "@/lib/r2";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_\.]/g, "_").slice(0, 64) || "upload";
}

export async function POST(request: NextRequest) {
  // Apply rate limiting: 5 uploads per hour per IP for R2 to be safe
  const rateLimitResponse = await applyRateLimit(request, {
    key: "api:upload-image-r2",
    windowMs: 3600_000, 
    maxRequests: 10,
  });
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const originResponse = enforceSameOrigin(request);
  if (originResponse) {
    return originResponse;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_FORM_DATA",
          message: "Request body must be multipart/form-data.",
        },
      },
      { status: 400 },
    );
  }

  const filePart = formData.get("file");
  if (!(filePart instanceof File)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FILE_REQUIRED",
          message: "Image file is required.",
        },
      },
      { status: 400 },
    );
  }

  if (!filePart.type.startsWith("image/")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_FILE_TYPE",
          message: "Only image files are allowed.",
        },
      },
      { status: 415 },
    );
  }

  if (filePart.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: "Image must be 8MB or smaller.",
        },
      },
      { status: 413 },
    );
  }

  try {
    const bytes = await filePart.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = sanitizeFileName(filePart.name);

    const publicUrl = await uploadToR2(buffer, fileName, filePart.type);

    return NextResponse.json(
      {
        success: true,
        data: {
          url: publicUrl,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("upload-image route failed:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to process image upload.";
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "R2_UPLOAD_ERROR",
          message: errorMessage,
        },
      },
      { status: 500 },
    );
  }
}

