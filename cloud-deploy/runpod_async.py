#!/usr/bin/env python3
"""RunPod GPU 部署脚本 v4 - 修复 SSL 问题"""
import os
import sys
import time
import requests
import urllib3
from runpod.api.mutations.pods import generate_pod_deployment_mutation

# 禁用 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_KEY = os.environ.get("RUNPOD_API_KEY", "")
GRAPHQL_URL = "https://api.runpod.io/graphql"

def log(msg):
    time_str = time.strftime("%H:%M:%S")
    print(f"[{time_str}] {msg}", flush=True)

def run_graphql(query, variables=None):
    """执行 GraphQL 请求"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    try:
        resp = requests.post(GRAPHQL_URL, json=payload, headers=headers, timeout=60, verify=False)
        return resp.json()
    except Exception as e:
        return {"errors": [{"message": str(e)}]}

def main():
    log("=" * 50)
    log("开始 RunPod RTX 4090 部署")
    log("=" * 50)

    # Step 1: 生成部署 mutation
    log("[1/5] 生成部署请求...")
    mutation = generate_pod_deployment_mutation(
        name="gemma-31b-crack",
        image_name="runpod/pytorch:2.1.0-cuda12.1-cudnn8-devel",
        gpu_type_id="NVIDIA RTX 4090",
        cloud_type="SECURE",
        support_public_ip=True,
        start_ssh=True,
        gpu_count=1,
        volume_in_gb=80,
        container_disk_in_gb=20,
        ports="11434/tcp,22/tcp",
        env={
            "OLLAMA_HOST": "0.0.0.0:11434",
            "OLLAMA_MODELS": "/workspace/models"
        }
    )
    log("✓ 部署请求已生成")

    # Step 2: 执行部署
    log("[2/5] 提交部署请求...")
    log("  正在创建实例 (可能需要 1-2 分钟)...")

    result = run_graphql(mutation)
    log(f"  收到 API 响应")

    if "errors" in result:
        error_msg = result["errors"]
        log(f"✗ 部署失败: {error_msg}")
        log("")
        log("可能原因:")
        log("  1. 账户余额不足")
        log("  2. RTX 4090 库存不足")
        log("  3. API Key 权限问题")
        log("")
        log("请手动部署: https://runpod.io/console/gpu-secure-cloud")
        return

    # 提取 pod ID
    data = result.get("data", {})
    log(f"  完整响应: {str(data)[:500]}")

    # 尝试多种可能的响应格式
    pod_id = None
    for key in ["podFindAndDeployOnDemand", "startPod", "pod"]:
        if key in data and isinstance(data[key], dict):
            pod_id = data[key].get("id")
            if pod_id:
                break

    if pod_id:
        log(f"✓ 实例已创建!")
        log(f"  ID: {pod_id}")
    else:
        log("⚠ 无法获取 Pod ID")
        log("请手动部署: https://runpod.io/console/gpu-secure-cloud")
        return

    # Step 3: 等待启动
    log("[3/5] 等待实例启动...")
    log("  (约 2-5 分钟，按 Ctrl+C 退出)")

    for i in range(30):
        time.sleep(10)

        query = """
        query {
            pod(input: { podId: "%s" }) {
                id
                status
                runtime {
                    uptimeInSeconds
                }
                ips {
                    ip
                    type
                }
            }
        }
        """ % pod_id

        result = run_graphql(query)
        pod = result.get("data", {}).get("pod", {})

        if pod:
            status = pod.get("status", "未知")
            ips = pod.get("ips", [])
            ip = next((i["ip"] for i in ips if i.get("type") == "PUBLIC"), "分配中")

            log(f"  [{i*10+10}s] 状态: {status} | IP: {ip}")

            if status == "RUNNING":
                log("=" * 50)
                log("✓ 部署成功!")
                log(f"  实例 IP: {ip}")
                log(f"  SSH 端口: 22")
                log(f"  Ollama 端口: 11434")
                log("=" * 50)
                break
        else:
            log(f"  [{i*10+10}s] 获取状态中...")

    # Step 4: 后续步骤
    log("[4/5] 后续配置指南...")
    log("")
    log("SSH 登录后执行:")
    log("  curl -fsSL https://ollama.ai/install.sh | sh")
    log("  ollama serve &")

    # Step 5: 完成
    log("[5/5] 完成!")
    log("")
    log("把实例 IP 发给我，我来帮你配置!")

if __name__ == "__main__":
    main()
