export const APPSTORE_COLLECTIONS = {
  users: "users",
  usernames: "usernames",
  apps: "apps",
  follows: "follows",
} as const;

export function userDocPath(uid: string): string {
  return `${APPSTORE_COLLECTIONS.users}/${uid}`;
}

export function usernameDocPath(nicknameLower: string): string {
  return `${APPSTORE_COLLECTIONS.usernames}/${nicknameLower}`;
}

export function appDocPath(appId: string): string {
  return `${APPSTORE_COLLECTIONS.apps}/${appId}`;
}

export function followDocId(followerId: string, followingId: string): string {
  return `${followerId}__${followingId}`;
}
