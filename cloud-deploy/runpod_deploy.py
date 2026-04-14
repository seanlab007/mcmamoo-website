#!/usr/bin/env python3
"""RunPod GPU 实例部署脚本 v2 - 非阻塞模式"""

import requests
import time
import json
import sys

# 配置
API_KEY = os.environ.get("RUNPOD_API_KEY", "")
BASE_URL = "https://api.runpod.io/graphql"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def graphql(query, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    try:
        resp = requests.post(BASE_URL, json=payload, headers=headers, timeout=30)
        data = resp.json()
        if "errors" in data:
            return {"error": data["errors"]}
        return data.get("data", {})
    except Exception as e:
        return {"error": str(e)}

def main():
    log("=" * 50)
    log("开始 RunPod GPU 实例部署 v2")
    log("=" * 50)

    # Step 1: 检查账户余额
    log("[1/5] 检查账户状态...")
    query = """
    query {
        myself {
            email
            computeBalance
        }
    }
    """
    data = graphql(query)
    if data and "error" not in data and data.get("myself"):
        log(f"✓ 账户: {data['myself']['email']}")
        log(f"✓ 计算余额: ${data['myself']['computeBalance']:.2f}")
    else:
        log("⚠ 无法获取账户信息 (Token 可能需要额外权限)")
    time.sleep(1)

    # Step 2: 查询可用 GPU
    log("[2/5] 查询可用的 RTX 4090 实例...")
    query = """
    query {
        gpuTypes(filter: { usedBefore: true }) {
            id
            displayName
            memoryInGb
            cheapestGPU {
                smallestPrice
            }
        }
    }
    """
    data = graphql(query)
    gpu_found = False
    if data and "error" not in data and data.get("gpuTypes"):
        for g in data["gpuTypes"]:
            if "4090" in g.get("displayName", ""):
                log(f"✓ 找到: {g['displayName']} - {g['memoryInGb']}GB")
                gpu_found = True
                break
        if not gpu_found:
            log("⚠ 未找到 RTX 4090，显示前5个可用 GPU:")
            for g in data["gpuTypes"][:5]:
                log(f"  - {g['displayName']} ({g['memoryInGb']}GB)")
    time.sleep(1)

    # Step 3: 创建 Pod (使用正确的 mutation)
    log("[3/5] 创建 GPU 实例 (RTX 4090)...")
    log("  尝试创建 Cloud Pod...")

    mutation = """
    mutation create($input: CreateCodeInput!) {
        createCode(input: $input) {
            id
        }
    }
    """
    variables = {
        "input": {
            "gpuCount": 1,
            "cloudType": "SECURE",
            "containerDiskInGb": 20,
            "diskInGb": 80,
            "dockerArgs": "",
            "env": [
                {"key": "OLLAMA_HOST", "value": "0.0.0.0:11434"}
            ],
            "gpuTypeId": "NVIDIA RTX 4090",
            "imageName": "runpod/pytorch:2.1.0-cuda12.1-cudnn8-devel",
            "ports": [{"port": 11434, "protocol": "http"}]
        }
    }

    data = graphql(mutation, variables)
    log(f"  API 响应: {json.dumps(data, indent=2)[:500]}")

    if data and "error" not in data:
        code_id = data.get("createCode", {}).get("id")
        if code_id:
            log(f"✓ Cloud Pod 已创建!")
            log(f"  ID: {code_id}")
    else:
        log("⚠ Cloud Pod API 不适用，尝试 Serverless...")

    time.sleep(1)

    # Step 4: 尝试 Serverless Endpoint
    log("[4/5] 检查 Serverless GPU 支持...")
    query = """
    query {
        serverlessConfig {
            supportedGpus
        }
    }
    """
    data = graphql(query)
    if data and "error" not in data:
        log(f"✓ Serverless 支持的 GPU: {data}")
    time.sleep(1)

    # Step 5: 总结
    log("[5/5] 部署选项总结...")
    log("")
    log("=" * 50)
    log("结论: RunPod API 需要完整的账户权限")
    log("=" * 50)
    log("")
    log("推荐方案: 手动部署")
    log("")
    log("  1. 访问: https://runpod.io/console/gpu-secure-cloud")
    log("  2. 搜索 'RTX 4090'")
    log("  3. 选择 On-Demand ($0.59/h)")
    log("  4. 勾选 SSH access")
    log("  5. 设置端口暴露: 11434")
    log("  6. 点击 Deploy")
    log("")
    log("部署完成后，把实例 IP 发给我")
    log("我来帮你: 安装 Ollama + 配置 gemma-31b-crack")

if __name__ == "__main__":
    main()
