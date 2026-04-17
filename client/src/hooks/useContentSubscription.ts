/**
 * useContentSubscription
 * Fetches the current user's content platform subscription from /api/content/subscription.
 * Returns plan, quotas, and derived boolean helpers for conditional rendering.
 */
import { useState, useEffect } from "react";

export type ContentPlan = "free" | "content" | "strategic" | "admin";

export interface ContentSubscription {
  plan: ContentPlan;
  contentQuota: number;       // -1 = unlimited
  contentUsed: number;
  resetAt: string | null;
  isActive: boolean;
}

const DEFAULT: ContentSubscription = {
  plan: "free",
  contentQuota: 5,
  contentUsed: 0,
  resetAt: null,
  isActive: false,
};

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || "https://api.mcmamoo.com";

export function useContentSubscription(authenticated: boolean) {
  const [data, setData] = useState<ContentSubscription>(DEFAULT);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authenticated) { setData(DEFAULT); return; }
    setLoading(true);
    fetch(`${BACKEND_URL}/api/content/subscription`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json) setData(json as ContentSubscription);
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  }, [authenticated]);

  const canAccessContent = data.plan !== "free" || data.plan === "free"; // free users still see the entry, just locked
  const hasContentAccess = data.plan === "content" || data.plan === "strategic" || data.plan === "admin";
  const isAdmin = data.plan === "admin";
  const isUnlimited = data.contentQuota === -1;
  const usagePercent = isUnlimited ? 0 : Math.round((data.contentUsed / data.contentQuota) * 100);

  return { data, loading, hasContentAccess, isAdmin, isUnlimited, usagePercent };
}
