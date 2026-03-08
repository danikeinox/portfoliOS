import { Buffer } from "node:buffer";
import { NextResponse, type NextRequest } from "next/server";
import { applyRateLimit, enforceSameOrigin } from "@/lib/api/security";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_\.]/g, "_").slice(0, 64) || "upload";
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, {
    key: "api:upload-image",
    windowMs: 60_000,
    maxRequests: 8,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const originResponse = enforceSameOrigin(request);
  if (originResponse) {
    return originResponse;
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "IMGBB_NOT_CONFIGURED",
          message: "Image upload service is not configured.",
        },
      },
      { status: 503 },
    );
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
    const base64 = Buffer.from(bytes).toString("base64");

    const payload = new URLSearchParams();
    payload.set("image", base64);
    payload.set("name", sanitizeFileName(filePart.name));

    const uploadResponse = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload,
      },
    );

    const uploadJson = (await uploadResponse.json()) as {
      success?: boolean;
      data?: { url?: string; display_url?: string; delete_url?: string };
      error?: { message?: string };
    };

    if (!uploadResponse.ok || !uploadJson.success || !uploadJson.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "IMGBB_UPLOAD_FAILED",
            message:
              uploadJson.error?.message ?? "Failed to upload image to ImgBB.",
          },
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          url: uploadJson.data.url ?? uploadJson.data.display_url,
          deleteUrl: uploadJson.data.delete_url,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("upload-image route failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UPLOAD_INTERNAL_ERROR",
          message: "Failed to process image upload.",
        },
      },
      { status: 500 },
    );
  }
}
