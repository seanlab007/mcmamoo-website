#!/usr/bin/env node
/**
 * Marketing Claw 心跳守护进程
 * 每 60 秒向 MaoAI 发送心跳，保持节点在线
 * 用法: node scripts/heartbeat-marketing-claw.mjs
 */

const MAOAI_URL = process.env.MAOAI_URL || "http://localhost:5000";
const NODE_ID   = parseInt(process.env.NODE_ID || "4", 10);
const TOKEN     = process.env.NODE_TOKEN || "";           // 未配置时留空即可
const CHECKSUM  = "sha256:ddaa979e";                      // skills checksum
const INTERVAL  = 60_000;                                 // 60s

async function sendHeartbeat() {
  try {
    const res = await fetch(`${MAOAI_URL}/api/ai/node/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodeId: NODE_ID,
        token: TOKEN,
        skillsChecksum: CHECKSUM,
      }),
    });
    const data = await res.json();
    const ts = new Date().toLocaleTimeString("zh-CN");
    if (data.success) {
      console.log(`[${ts}] ✅ 心跳成功 nodeId=${NODE_ID}${data.needsSkillSync ? " (需要同步 skills)" : ""}`);
    } else {
      console.warn(`[${ts}] ⚠️  心跳失败:`, data.error || data);
    }
  } catch (err) {
    const ts = new Date().toLocaleTimeString("zh-CN");
    console.error(`[${ts}] ❌ 心跳请求异常:`, err.message);
  }
}

console.log(`Marketing Claw 心跳守护进程启动`);
console.log(`  目标: ${MAOAI_URL} | nodeId=${NODE_ID} | 间隔=${INTERVAL/1000}s`);

// 立即发一次
sendHeartbeat();
// 然后定时发
setInterval(sendHeartbeat, INTERVAL);
