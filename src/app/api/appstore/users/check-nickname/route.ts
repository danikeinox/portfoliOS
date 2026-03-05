import { type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { nicknameSchema } from "@/lib/appstore/schemas";
import { ok, fail } from "@/lib/appstore/http";
import { APPSTORE_COLLECTIONS } from "@/lib/appstore/paths";

export async function GET(request: NextRequest) {
  const nicknameRaw = request.nextUrl.searchParams.get("nickname");

  const parsed = nicknameSchema.safeParse(nicknameRaw ?? "");
  if (!parsed.success) {
    return fail(
      "INVALID_NICKNAME",
      "Invalid nickname",
      400,
      parsed.error.flatten(),
    );
  }

  const nickname = parsed.data;
  const nicknameLower = nickname.toLocaleLowerCase("es-ES");

  try {
    const usernameDoc = await adminDb
      .collection(APPSTORE_COLLECTIONS.usernames)
      .doc(nicknameLower)
      .get();

    return ok({
      nickname,
      nicknameLower,
      available: !usernameDoc.exists,
    });
  } catch (error) {
    console.error("check nickname error:", error);
    return fail(
      "CHECK_NICKNAME_ERROR",
      "Unexpected error validating nickname",
      500,
    );
  }
}
