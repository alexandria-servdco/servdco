/** Session policy constants (client-enforced; complements Supabase JWT refresh). */
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

export const SESSION_STARTED_KEY = "servdco_session_started_at";
export const SESSION_LAST_ACTIVITY_KEY = "servdco_session_last_activity";
export const SESSION_REMEMBER_KEY = "servdco_remember_me";

export function markSessionStarted(rememberMe: boolean): void {
  const now = Date.now().toString();
  sessionStorage.setItem(SESSION_STARTED_KEY, now);
  sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, now);
  if (rememberMe) {
    localStorage.setItem(SESSION_REMEMBER_KEY, "1");
    localStorage.setItem(SESSION_STARTED_KEY, now);
    localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, now);
  } else {
    localStorage.removeItem(SESSION_REMEMBER_KEY);
    localStorage.removeItem(SESSION_STARTED_KEY);
    localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
  }
}

export function touchSessionActivity(): void {
  const now = Date.now().toString();
  sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, now);
  if (localStorage.getItem(SESSION_REMEMBER_KEY) === "1") {
    localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, now);
  }
}

export function clearSessionMarkers(): void {
  sessionStorage.removeItem(SESSION_STARTED_KEY);
  sessionStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
  localStorage.removeItem(SESSION_REMEMBER_KEY);
  localStorage.removeItem(SESSION_STARTED_KEY);
  localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
}

export function isRememberMeSession(): boolean {
  return localStorage.getItem(SESSION_REMEMBER_KEY) === "1";
}

export function sessionExpired(): boolean {
  const remember = isRememberMeSession();
  const startedRaw =
    (remember ? localStorage : sessionStorage).getItem(SESSION_STARTED_KEY) ??
    sessionStorage.getItem(SESSION_STARTED_KEY);
  const activityRaw =
    (remember ? localStorage : sessionStorage).getItem(SESSION_LAST_ACTIVITY_KEY) ??
    sessionStorage.getItem(SESSION_LAST_ACTIVITY_KEY);

  if (!startedRaw && !activityRaw) {
    return false;
  }

  const now = Date.now();
  const started = Number(startedRaw ?? now);
  const lastActivity = Number(activityRaw ?? started);
  const maxLifetime = remember ? SESSION_REMEMBER_MS : SESSION_MAX_MS;

  if (now - started > maxLifetime) return true;
  if (now - lastActivity > SESSION_IDLE_MS) return true;
  return false;
}
