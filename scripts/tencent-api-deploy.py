#!/usr/bin/env python3
"""
MaoAI 腾讯云自动化部署脚本
使用腾讯云 API 创建轻量服务器并自动部署
"""

import json
import hashlib
import hmac
import base64
import time
import requests
import urllib.parse
from datetime import datetime, timezone

# 腾讯云 API 配置 (从环境变量读取)
import os
SECRET_ID = os.environ.get("TENCENT_SECRET_ID", "")
SECRET_KEY = os.environ.get("TENCENT_SECRET_KEY", "")
REGION = "ap-guangzhou"  # 广州节点

class TencentCloudAPI:
    def __init__(self, secret_id, secret_key):
        self.secret_id = secret_id
        self.secret_key = secret_key
        self.service = "lighthouse"
        self.host = "lighthouse.tencentcloudapi.com"
    
    def sign(self, payload, timestamp):
        """生成腾讯云 API 签名"""
        date = datetime.fromtimestamp(timestamp, tz=timezone.utc).strftime("%Y-%m-%d")
        
        # 1. 拼接规范请求
        http_request_method = "POST"
        canonical_uri = "/"
        canonical_querystring = ""
        ct = "application/json; charset=utf-8"
        canonical_headers = f"content-type:{ct}\nhost:{self.host}\nx-tc-action:{payload['Action'].lower()}\n"
        signed_headers = "content-type;host;x-tc-action"
        hashed_request_payload = hashlib.sha256(json.dumps(payload).encode()).hexdigest()
        
        canonical_request = (
            f"{http_request_method}\n"
            f"{canonical_uri}\n"
            f"{canonical_querystring}\n"
            f"{canonical_headers}\n"
            f"{signed_headers}\n"
            f"{hashed_request_payload}"
        )
        
        # 2. 拼接签名字符串
        algorithm = "TC3-HMAC-SHA256"
        credential_scope = f"{date}/{self.service}/tc3_request"
        hashed_canonical_request = hashlib.sha256(canonical_request.encode()).hexdigest()
        
        string_to_sign = (
            f"{algorithm}\n"
            f"{timestamp}\n"
            f"{credential_scope}\n"
            f"{hashed_canonical_request}"
        )
        
        # 3. 计算签名
        secret_date = hmac.new(f"TC3{self.secret_key}".encode(), date.encode(), hashlib.sha256).digest()
        secret_service = hmac.new(secret_date, self.service.encode(), hashlib.sha256).digest()
        secret_signing = hmac.new(secret_service, "tc3_request".encode(), hashlib.sha256).digest()
        signature = hmac.new(secret_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()
        
        # 4. 拼接 Authorization
        authorization = (
            f"{algorithm} "
            f"Credential={self.secret_id}/{credential_scope}, "
            f"SignedHeaders={signed_headers}, "
            f"Signature={signature}"
        )
        
        return authorization
    
    def request(self, action, params=None):
        """发送腾讯云 API 请求"""
        timestamp = int(time.time())
        
        payload = {
            "Action": action,
            "Version": "2020-03-24",
            "Region": REGION,
        }
        if params:
            payload.update(params)
        
        authorization = self.sign(payload, timestamp)
        
        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "Host": self.host,
            "X-TC-Action": action,
            "X-TC-Version": "2020-03-24",
            "X-TC-Timestamp": str(timestamp),
            "X-TC-Region": REGION,
            "Authorization": authorization,
        }
        
        response = requests.post(
            f"https://{self.host}",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        return response.json()
    
    def get_blueprints(self):
        """获取镜像列表"""
        return self.request("DescribeBlueprints", {
            "Filters": [{"Name": "blueprint-type", "Values": ["OS"]}]
        })
    
    def get_bundle_specs(self):
        """获取套餐列表"""
        return self.request("DescribeBundles", {
            "Filters": [{"Name": "bundle-type", "Values": ["GENERAL_BUNDLE"]}]
        })
    
    def create_instance(self, bundle_id, blueprint_id, instance_name, password):
        """创建轻量服务器实例"""
        params = {
            "BundleId": bundle_id,
            "BlueprintId": blueprint_id,
            "InstanceName": instance_name,
            "LoginConfiguration": {
                "Password": password
            },
            "Zone": "ap-guangzhou-3",  # 广州三区
        }
        return self.request("CreateInstances", params)
    
    def describe_instances(self):
        """查询实例列表"""
        return self.request("DescribeInstances")
    
    def get_instance_traffic_package(self, instance_id):
        """获取实例流量包"""
        return self.request("DescribeInstancesTrafficPackages", {
            "InstanceIds": [instance_id]
        })


def main():
    """主函数"""
    print("=" * 50)
    print("MaoAI 腾讯云自动化部署")
    print("=" * 50)
    
    api = TencentCloudAPI(SECRET_ID, SECRET_KEY)
    
    # 1. 查询可用套餐
    print("\n[1/4] 查询可用套餐...")
    bundles = api.get_bundle_specs()
    if "Response" in bundles and "BundleSet" in bundles["Response"]:
        print("\n可用套餐:")
        for bundle in bundles["Response"]["BundleSet"]:
            cpu = bundle.get("CPU", 0)
            memory = bundle.get("Memory", 0)
            bandwidth = bundle.get("InternetMaxBandwidthOut", 0)
            price = bundle.get("Price", {})
            print(f"  - {bundle['BundleId']}: {cpu}核{memory}GB {bandwidth}Mbps 流量包")
    
    # 2. 查询镜像
    print("\n[2/4] 查询可用镜像...")
    blueprints = api.get_blueprints()
    if "Response" in blueprints and "BlueprintSet" in blueprints["Response"]:
        print("\n推荐镜像:")
        for bp in blueprints["Response"]["BlueprintSet"]:
            if "Ubuntu" in bp.get("BlueprintName", "") or "Debian" in bp.get("BlueprintName", ""):
                print(f"  - {bp['BlueprintId']}: {bp['BlueprintName']}")
    
    # 3. 查询现有实例
    print("\n[3/4] 查询现有实例...")
    instances = api.describe_instances()
    if "Response" in instances and "InstanceSet" in instances["Response"]:
        if instances["Response"]["InstanceSet"]:
            print("\n现有实例:")
            for inst in instances["Response"]["InstanceSet"]:
                print(f"  - {inst['InstanceId']}: {inst['InstanceName']} ({inst.get('PublicAddresses', ['无公网IP'])[0]})")
        else:
            print("  暂无实例")
    
    print("\n[4/4] 部署配置已就绪")
    print("\n下一步:")
    print("1. 选择套餐 ID (如: bundle_nl_2_0_50_1)")
    print("2. 选择镜像 ID (如: lhbp-6p3qtx0j Ubuntu 22.04)")
    print("3. 设置 root 密码")
    print("4. 运行创建实例")
    
    return api


if __name__ == "__main__":
    api = main()
