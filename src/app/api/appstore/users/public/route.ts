import { type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  getOptionalAuthenticatedUser,
} from "@/lib/appstore/auth";
import { ok, fail } from "@/lib/appstore/http";
import { mapUserProfile } from "@/lib/appstore/mappers";
import {
  APPSTORE_COLLECTIONS,
  followDocId,
} from "@/lib/appstore/paths";
import { publicProfileQuerySchema } from "@/lib/appstore/schemas";
import type { SocialRelationStatus } from "@/lib/appstore/contracts";

export async function GET(request: NextRequest) {
  const parsed = publicProfileQuerySchema.safeParse({
    nickname: request.nextUrl.searchParams.get("nickname") ?? "",
  });

  if (!parsed.success) {
    return fail(
      "INVALID_PUBLIC_PROFILE_QUERY",
      "Invalid profile query",
      400,
      parsed.error.flatten(),
    );
  }

  const { nickname } = parsed.data;
  const nicknameLower = nickname.toLocaleLowerCase("es-ES");

  try {
    const usernameDoc = await adminDb
      .collection(APPSTORE_COLLECTIONS.usernames)
      .doc(nicknameLower)
      .get();

    if (!usernameDoc.exists) {
      return fail("PROFILE_NOT_FOUND", "Developer not found", 404);
    }

    const targetUid = usernameDoc.data()?.uid as string | undefined;
    if (!targetUid) {
      return fail("PROFILE_NOT_FOUND", "Developer not found", 404);
    }

    const targetDoc = await adminDb
      .collection(APPSTORE_COLLECTIONS.users)
      .doc(targetUid)
      .get();

    if (!targetDoc.exists) {
      return fail("PROFILE_NOT_FOUND", "Developer not found", 404);
    }

    const currentUid = await getOptionalAuthenticatedUser(request);
    const isOwner = currentUid === targetUid;

    let relation: SocialRelationStatus = isOwner ? "self" : "not_following";

    if (currentUid && !isOwner) {
      const followingRef = adminDb
        .collection(APPSTORE_COLLECTIONS.follows)
        .doc(followDocId(currentUid, targetUid));
      const reverseRef = adminDb
        .collection(APPSTORE_COLLECTIONS.follows)
        .doc(followDocId(targetUid, currentUid));

      const [followingSnapshot, reverseSnapshot] = await Promise.all([
        followingRef.get(),
        reverseRef.get(),
      ]);

      if (followingSnapshot.exists && reverseSnapshot.exists) {
        relation = "friends";
      } else if (followingSnapshot.exists) {
        relation = "following";
      } else {
        relation = "not_following";
      }
    }

    return ok({
      ...mapUserProfile(targetDoc.data()!),
      relation,
      isOwner,
    });
  } catch (error) {
    console.error("public profile error:", error);
    return fail(
      "PUBLIC_PROFILE_ERROR",
      "Unexpected error fetching public profile",
      500,
    );
  }
}
