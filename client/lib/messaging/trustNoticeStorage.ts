const STORAGE_PREFIX = "servdco-msg-trust-dismissed";

export function trustNoticeStorageKey(
  userId: string | null | undefined,
  conversationId: string,
): string {
  return `${STORAGE_PREFIX}:${userId ?? "guest"}:${conversationId}`;
}

export function isTrustNoticeDismissed(
  userId: string | null | undefined,
  conversationId: string,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(trustNoticeStorageKey(userId, conversationId)) === "1";
  } catch {
    return false;
  }
}

export function dismissTrustNotice(
  userId: string | null | undefined,
  conversationId: string,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(trustNoticeStorageKey(userId, conversationId), "1");
  } catch {
    // ignore quota / private mode
  }
}
