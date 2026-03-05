import { type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuthenticatedUser } from "@/lib/appstore/auth";
import { ok, fail } from "@/lib/appstore/http";
import { mapUserProfile } from "@/lib/appstore/mappers";
import { APPSTORE_COLLECTIONS } from "@/lib/appstore/paths";
import { upsertProfileSchema } from "@/lib/appstore/schemas";

function asCode(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "UNKNOWN_ERROR";
}

export async function GET(request: NextRequest) {
  let uid: string;

  try {
    uid = await requireAuthenticatedUser(request);
  } catch (error) {
    const code = asCode(error);
    return fail(code, code === "INVALID_AUTH_TOKEN" ? "Invalid auth token" : "Missing auth token", 401);
  }

  try {
    const userDoc = await adminDb.collection(APPSTORE_COLLECTIONS.users).doc(uid).get();

    if (!userDoc.exists) {
      return fail("PROFILE_NOT_FOUND", "Profile not found", 404);
    }

    return ok(mapUserProfile(userDoc.data()!));
  } catch (error) {
    console.error("get profile error:", error);
    return fail("GET_PROFILE_ERROR", "Unexpected error fetching profile", 500);
  }
}

export async function PUT(request: NextRequest) {
  let uid: string;

  try {
    uid = await requireAuthenticatedUser(request);
  } catch (error) {
    const code = asCode(error);
    return fail(code, code === "INVALID_AUTH_TOKEN" ? "Invalid auth token" : "Missing auth token", 401);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return fail("INVALID_CONTENT_TYPE", "Content-Type must be application/json", 415);
  }

  const body = await request.json().catch(() => null);
  const parsed = upsertProfileSchema.safeParse(body);

  if (!parsed.success) {
    return fail("INVALID_PROFILE_PAYLOAD", "Invalid profile payload", 400, parsed.error.flatten());
  }

  const payload = parsed.data;
  const nicknameLower = payload.nickname.toLocaleLowerCase("es-ES");

  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection(APPSTORE_COLLECTIONS.users).doc(uid);
      const usernameRef = adminDb.collection(APPSTORE_COLLECTIONS.usernames).doc(nicknameLower);

      const [userSnapshot, usernameSnapshot] = await Promise.all([
        transaction.get(userRef),
        transaction.get(usernameRef),
      ]);

      if (usernameSnapshot.exists && usernameSnapshot.data()?.uid !== uid) {
        throw new Error("USERNAME_TAKEN");
      }

      const existingUser = userSnapshot.data();
      const currentNicknameLower = existingUser?.nicknameLower as string | undefined;

      if (currentNicknameLower && currentNicknameLower !== nicknameLower) {
        const oldUsernameRef = adminDb.collection(APPSTORE_COLLECTIONS.usernames).doc(currentNicknameLower);
        transaction.delete(oldUsernameRef);
      }

      transaction.set(
        userRef,
        {
          uid,
          nickname: payload.nickname,
          nicknameLower,
          displayName: payload.displayName,
          bio: payload.bio ?? "",
          avatarUrl: payload.avatarUrl ?? "",
          createdAt: existingUser?.createdAt ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(
        usernameRef,
        {
          uid,
          nickname: payload.nickname,
          createdAt: usernameSnapshot.data()?.createdAt ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return {
        uid,
      };
    });

    const updatedDoc = await adminDb.collection(APPSTORE_COLLECTIONS.users).doc(result.uid).get();
    return ok(mapUserProfile(updatedDoc.data()!), 200);
  } catch (error) {
    const code = asCode(error);

    if (code === "USERNAME_TAKEN") {
      return fail("USERNAME_TAKEN", "Nickname is already in use", 409);
    }

    console.error("upsert profile error:", error);
    return fail("UPSERT_PROFILE_ERROR", "Unexpected error updating profile", 500);
  }
}
