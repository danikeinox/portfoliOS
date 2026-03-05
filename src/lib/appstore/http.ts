import { NextResponse } from "next/server";
import type { AppStoreApiError, AppStoreApiSuccess } from "@/lib/appstore/contracts";

export function ok<T>(data: T, status = 200) {
  const payload: AppStoreApiSuccess<T> = {
    success: true,
    data,
  };

  return NextResponse.json(payload, { status });
}

export function fail(code: string, message: string, status: number, details?: unknown) {
  const payload: AppStoreApiError = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };

  return NextResponse.json(payload, { status });
}
