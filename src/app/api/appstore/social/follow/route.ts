import { type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuthenticatedUser } from "@/lib/appstore/auth";
import { ok, fail } from "@/lib/appstore/http";
import { APPSTORE_COLLECTIONS, followDocId } from "@/lib/appstore/paths";
import { followActionSchema } from "@/lib/appstore/schemas";
import type { SocialRelationStatus } from "@/lib/appstore/contracts";

function asCode(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "UNKNOWN_ERROR";
}

async function resolveTargetUid(targetNickname: string) {
  const nicknameLower = targetNickname.toLocaleLowerCase("es-ES");
  const usernameDoc = await adminDb
    .collection(APPSTORE_COLLECTIONS.usernames)
    .doc(nicknameLower)
    .get();

  if (!usernameDoc.exists) {
    return null;
  }

  return usernameDoc.data()?.uid as string | undefined;
}

export async function POST(request: NextRequest) {
  let currentUid: string;

  try {
    currentUid = await requireAuthenticatedUser(request);
  } catch (error) {
    const code = asCode(error);
    return fail(
      code,
      code === "INVALID_AUTH_TOKEN"
        ? "Invalid auth token"
        : "Missing auth token",
      401,
    );
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return fail(
      "INVALID_CONTENT_TYPE",
      "Content-Type must be application/json",
      415,
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = followActionSchema.safeParse(body);

  if (!parsed.success) {
    return fail("INVALID_FOLLOW_PAYLOAD", "Invalid follow payload", 400, parsed.error.flatten());
  }

  const targetUid = await resolveTargetUid(parsed.data.targetNickname);

  if (!targetUid) {
    return fail("TARGET_NOT_FOUND", "Developer not found", 404);
  }

  if (targetUid === currentUid) {
    return fail("INVALID_TARGET", "You cannot follow yourself", 400);
  }

  try {
    const followRef = adminDb
      .collection(APPSTORE_COLLECTIONS.follows)
      .doc(followDocId(currentUid, targetUid));

    const reverseRef = adminDb
      .collection(APPSTORE_COLLECTIONS.follows)
      .doc(followDocId(targetUid, currentUid));

    const currentUserRef = adminDb.collection(APPSTORE_COLLECTIONS.users).doc(currentUid);
    const targetUserRef = adminDb.collection(APPSTORE_COLLECTIONS.users).doc(targetUid);

    const relation = await adminDb.runTransaction(async (transaction) => {
      const [followSnapshot, reverseSnapshot] = await Promise.all([
        transaction.get(followRef),
        transaction.get(reverseRef),
      ]);

      if (!followSnapshot.exists) {
        transaction.set(followRef, {
          followerId: currentUid,
          followingId: targetUid,
          createdAt: FieldValue.serverTimestamp(),
        });

        transaction.set(
          currentUserRef,
          {
            followingCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        transaction.set(
          targetUserRef,
          {
            followersCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      if (reverseSnapshot.exists) {
        return "friends" as SocialRelationStatus;
      }

      return "following" as SocialRelationStatus;
    });

    return ok({ relation });
  } catch (error) {
    console.error("follow action error:", error);
    return fail("FOLLOW_ACTION_ERROR", "Unexpected error following developer", 500);
  }
}

export async function DELETE(request: NextRequest) {
  let currentUid: string;

  try {
    currentUid = await requireAuthenticatedUser(request);
  } catch (error) {
    const code = asCode(error);
    return fail(
      code,
      code === "INVALID_AUTH_TOKEN"
        ? "Invalid auth token"
        : "Missing auth token",
      401,
    );
  }

  const targetNickname = request.nextUrl.searchParams.get("targetNickname") ?? "";
  const parsed = followActionSchema.safeParse({ targetNickname });

  if (!parsed.success) {
    return fail(
      "INVALID_UNFOLLOW_QUERY",
      "Invalid target nickname",
      400,
      parsed.error.flatten(),
    );
  }

  const targetUid = await resolveTargetUid(parsed.data.targetNickname);

  if (!targetUid) {
    return fail("TARGET_NOT_FOUND", "Developer not found", 404);
  }

  if (targetUid === currentUid) {
    return fail("INVALID_TARGET", "You cannot unfollow yourself", 400);
  }

  try {
    const followRef = adminDb
      .collection(APPSTORE_COLLECTIONS.follows)
      .doc(followDocId(currentUid, targetUid));

    const reverseRef = adminDb
      .collection(APPSTORE_COLLECTIONS.follows)
      .doc(followDocId(targetUid, currentUid));

    const currentUserRef = adminDb.collection(APPSTORE_COLLECTIONS.users).doc(currentUid);
    const targetUserRef = adminDb.collection(APPSTORE_COLLECTIONS.users).doc(targetUid);

    const relation = await adminDb.runTransaction(async (transaction) => {
      const [followSnapshot, reverseSnapshot] = await Promise.all([
        transaction.get(followRef),
        transaction.get(reverseRef),
      ]);

      if (followSnapshot.exists) {
        transaction.delete(followRef);

        transaction.set(
          currentUserRef,
          {
            followingCount: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        transaction.set(
          targetUserRef,
          {
            followersCount: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }

      if (reverseSnapshot.exists) {
        return "not_following" as SocialRelationStatus;
      }

      return "not_following" as SocialRelationStatus;
    });

    return ok({ relation });
  } catch (error) {
    console.error("unfollow action error:", error);
    return fail("UNFOLLOW_ACTION_ERROR", "Unexpected error unfollowing developer", 500);
  }
}
