/**
 * Supabase REST API client (no package needed — uses native fetch)
 * Project: fczherphuixpdjuevzsh
 */

const SUPABASE_URL = "https://fczherphuixpdjuevzsh.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDM0OTEsImV4cCI6MjA4OTIxOTQ5MX0.t7FSUWbWDsKIcU-m-1ul65aVVu87RZn0zHleqccDEo4";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg";

/** Generic REST query helper */
async function sbFetch(
  path: string,
  options: RequestInit = {},
  authToken?: string
) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error ${res.status}: ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/** Admin helper using service_role key */
async function sbAdmin(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase admin error ${res.status}: ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── OpenClaw Plans ──────────────────────────────────────────────────────────

/** Fetch all active subscription plans */
export async function getOpenClawPlans() {
  return sbFetch(
    "/openclaw_plans?is_active=eq.true&order=sort_order.asc&select=*"
  );
}

/** Fetch the current user's subscription (requires auth token) */
export async function getUserSubscription(authToken: string) {
  try {
    const rows = await sbFetch(
      "/openclaw_subscriptions?select=*,openclaw_plans(*)&limit=1",
      {},
      authToken
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Fetch today's usage for the current user */
export async function getUserUsageToday(authToken: string) {
  const today = new Date().toISOString().split("T")[0];
  try {
    const rows = await sbFetch(
      `/openclaw_usage?date=eq.${today}&select=*&limit=1`,
      {},
      authToken
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

export interface ContactSubmission {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  message?: string;
}

/** Submit a contact form entry */
export async function submitContact(data: ContactSubmission) {
  return sbFetch("/contact_submissions", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { Prefer: "return=minimal" },
  });
}

// ─── Mao Think Tank ───────────────────────────────────────────────────────────

export interface MaoApplication {
  name: string;
  organization: string;
  consult_type: string;
  description?: string;
}

/** Submit a Mao Think Tank application */
export async function submitMaoApplication(data: MaoApplication) {
  return sbFetch("/mao_applications", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { Prefer: "return=minimal" },
  });
}

/** Subscribe to the strategic brief */
export async function subscribeBrief(email: string) {
  return sbFetch("/brief_subscribers", {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: { Prefer: "return=minimal" },
  });
}

// ─── Admin (service_role key) ─────────────────────────────────────────────────

/** List all mao applications (admin) */
export async function adminListApplications() {
  return sbAdmin("/mao_applications?order=created_at.desc&select=*");
}

/** Update application status (admin) */
export async function adminUpdateApplicationStatus(id: number, status: string) {
  return sbAdmin(`/mao_applications?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
    headers: { Prefer: "return=minimal" },
  });
}

/** Update application notes (admin) */
export async function adminUpdateApplicationNotes(id: number, notes: string) {
  return sbAdmin(`/mao_applications?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ notes, updated_at: new Date().toISOString() }),
    headers: { Prefer: "return=minimal" },
  });
}

/** List all brief subscribers (admin) */
export async function adminListSubscribers() {
  return sbAdmin("/brief_subscribers?order=created_at.desc&select=*");
}
