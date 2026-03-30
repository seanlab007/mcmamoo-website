/**
 * MaoYan 跨平台积分上报（mcmamoo-website 版）
 * 文件：server/_core/maoyan-rewards.ts
 * 
 * 在 mcmamoo 的订单支付成功后，调用 Supabase RPC 提交跨平台订单，
 * 触发 10% 消费返积分到 maoyan.vip 钱包。
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? "";

function getServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("[MaoYan Rewards] 缺少 Supabase Service Key");
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

export interface RewardPayload {
  /** Supabase openId（如：supabase:uuid 格式） */
  openId: string;
  /** 订单号 */
  orderId: string | number;
  /** 订单金额（USD） */
  amountUsd: number;
  currency?: string;
}

/**
 * 提取纯 UUID from mcmamoo openId（格式：supabase:uuid）
 */
function extractUUID(openId: string): string | null {
  if (openId.startsWith("supabase:")) return openId.slice(9);
  // 如果本身就是 UUID 格式
  if (/^[0-9a-f-]{36}$/i.test(openId)) return openId;
  return null;
}

/**
 * 上报 mcmamoo 订单，发放 MAO 积分
 */
export async function reportMcmamooOrder(payload: RewardPayload): Promise<number> {
  const supabase = getServiceClient();
  if (!supabase) return 0;

  const userId = extractUUID(payload.openId);
  if (!userId) {
    console.warn("[MaoYan Rewards] 无效的 openId:", payload.openId);
    return 0;
  }

  try {
    const maoReward = payload.amountUsd * 0.10 * 100;

    const { error } = await supabase.rpc("submit_platform_order", {
      p_user_id: userId,
      p_platform: "mcmamoo",
      p_order_id: String(payload.orderId),
      p_amount_usd: payload.amountUsd,
      p_currency: payload.currency || "USD",
      p_auto_credit: true,
    });

    if (error) {
      console.error("[MaoYan Rewards] 积分上报失败:", error.message);
      return 0;
    }

    console.log(
      `[MaoYan Rewards] ✓ 用户 ${userId} 在 mcmamoo 消费 $${payload.amountUsd}，` +
      `获得 ${maoReward} MAO 积分`
    );
    return maoReward;
  } catch (err) {
    console.error("[MaoYan Rewards] 错误:", err);
    return 0;
  }
}
