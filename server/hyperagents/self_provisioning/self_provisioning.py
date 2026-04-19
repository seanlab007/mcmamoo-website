#!/usr/bin/env python3
"""
MaoAI HyperAgents — Self-Provisioning（自主环境构建）
─────────────────────────────────────────────────────────────────────────────
目标：让 Agent 具备调用 docker-compose 的能力，根据任务需求自动拉取数据库、
缓存等中间件，构建一个完整的本地测试集群。

核心能力：
  1. Dynamic Sandbox   : 动态创建/销毁测试沙箱
  2. Docker Provisioner : 自动配置 Docker 环境
  3. Environment Monitor : 监控环境状态

用法：
  from self_provisioning import DynamicSandbox

  sandbox = DynamicSandbox(workspace="/path/to/project")
  sandbox.create({"postgres": "latest", "redis": "alpine"})
  sandbox.monitor()
  sandbox.destroy()
"""

import sys
import json
import time
import os
import re
import subprocess
import socket
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass, field
from enum import Enum

# ─── 日志工具 ────────────────────────────────────────────────────────────────

def log_step(step_type: str, message: str = "", **kwargs):
    """发送结构化日志到标准输出（flush=True 确保实时性）"""
    entry = {
        "type": step_type,
        "agent": "provisioner",
        "message": message,
        "timestamp": time.time(),
        **kwargs
    }
    print(json.dumps(entry, ensure_ascii=False), flush=True)


# ─── 状态枚举 ────────────────────────────────────────────────────────────────

class ServiceStatus(Enum):
    """服务状态"""
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    UNHEALTHY = "unhealthy"
    FAILED = "failed"


@dataclass
class Service:
    """服务定义"""
    name: str
    image: str
    port: int = 0
    env_vars: Dict[str, str] = field(default_factory=dict)
    depends_on: List[str] = field(default_factory=list)
    health_check: str = ""
    status: ServiceStatus = ServiceStatus.STOPPED
    container_id: str = ""


@dataclass
class SandboxConfig:
    """沙箱配置"""
    name: str
    services: List[Service] = field(default_factory=list)
    network: str = "maoai-sandbox"
    compose_file: str = ""


# ─── Base Provisioner ────────────────────────────────────────────────────────

class BaseProvisioner:
    """配置器基类"""

    def __init__(self, workspace: str = None):
        self.workspace = workspace or os.getcwd()
        self.docker_available = self._check_docker()
        self.compose_available = self._check_docker_compose()

    def _check_docker(self) -> bool:
        """检查 Docker 是否可用"""
        try:
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True, text=True, timeout=5
            )
            available = result.returncode == 0
            log_step("observation", f"Docker {'可用' if available else '不可用'}",
                    tool="docker", available=available)
            return available
        except (subprocess.TimeoutExpired, FileNotFoundError):
            log_step("error", "Docker 未安装或不可用", tool="docker")
            return False

    def _check_docker_compose(self) -> bool:
        """检查 Docker Compose 是否可用"""
        for cmd in ["docker-compose", "docker", "podman-compose"]:
            try:
                result = subprocess.run(
                    [cmd, "--version"],
                    capture_output=True, text=True, timeout=5
                )
                if result.returncode == 0:
                    self.compose_cmd = cmd
                    log_step("observation", f"Compose 命令: {cmd}", tool="compose", cmd=cmd)
                    return True
            except (subprocess.TimeoutExpired, FileNotFoundError):
                continue

        log_step("error", "Docker Compose 不可用", tool="compose")
        return False

    def run_command(self, cmd: List[str], timeout: int = 60) -> Dict[str, Any]:
        """执行命令并返回结果"""
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=timeout,
                cwd=self.workspace
            )
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "stdout": "", "stderr": "Command timeout", "returncode": -1}
        except Exception as e:
            return {"success": False, "stdout": "", "stderr": str(e), "returncode": -1}

    def check_port(self, host: str, port: int, timeout: int = 2) -> bool:
        """检查端口是否可用"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        try:
            result = sock.connect_ex((host, port))
            sock.close()
            return result == 0
        except Exception:
            return False


# ─── Docker Provisioner ──────────────────────────────────────────────────────

class DockerProvisioner(BaseProvisioner):
    """
    Docker 配置器 - 自动管理容器化服务

    支持的服务模板：
      - postgres: PostgreSQL 数据库
      - mysql: MySQL 数据库
      - redis: Redis 缓存
      - mongo: MongoDB
      - elasticsearch: Elasticsearch
      - rabbitmq: RabbitMQ
      - nginx: Nginx 反向代理
    """

    SERVICE_TEMPLATES = {
        "postgres": {
            "image": "postgres:15-alpine",
            "port": 5432,
            "env_vars": {
                "POSTGRES_USER": "maoai",
                "POSTGRES_PASSWORD": "maoai_secret",
                "POSTGRES_DB": "maoai_db"
            },
            "health_check": "pg_isready -U maoai"
        },
        "postgres-16": {
            "image": "postgres:16-alpine",
            "port": 5432,
            "env_vars": {
                "POSTGRES_USER": "maoai",
                "POSTGRES_PASSWORD": "maoai_secret",
                "POSTGRES_DB": "maoai_db"
            },
            "health_check": "pg_isready -U maoai"
        },
        "mysql": {
            "image": "mysql:8",
            "port": 3306,
            "env_vars": {
                "MYSQL_ROOT_PASSWORD": "root_secret",
                "MYSQL_DATABASE": "maoai_db",
                "MYSQL_USER": "maoai",
                "MYSQL_PASSWORD": "maoai_secret"
            },
            "health_check": "mysqladmin ping -h localhost"
        },
        "redis": {
            "image": "redis:7-alpine",
            "port": 6379,
            "env_vars": {},
            "health_check": "redis-cli ping"
        },
        "redis-cluster": {
            "image": "redis:7-alpine",
            "port": 6379,
            "env_vars": {"REDIS_PASSWORD": "redis_secret"},
            "health_check": "redis-cli ping"
        },
        "mongo": {
            "image": "mongo:6",
            "port": 27017,
            "env_vars": {
                "MONGO_INITDB_ROOT_USERNAME": "admin",
                "MONGO_INITDB_ROOT_PASSWORD": "admin_secret"
            },
            "health_check": "mongosh --eval 'db.adminCommand(\"ping\")'"
        },
        "elasticsearch": {
            "image": "elasticsearch:8.11.0",
            "port": 9200,
            "env_vars": {
                "discovery.type": "single-node",
                "xpack.security.enabled": "false",
                "ES_JAVA_OPTS": "-Xms512m -Xmx512m"
            },
            "health_check": "curl -s http://localhost:9200/_cluster/health"
        },
        "rabbitmq": {
            "image": "rabbitmq:3-management",
            "port": 5672,
            "env_vars": {
                "RABBITMQ_DEFAULT_USER": "maoai",
                "RABBITMQ_DEFAULT_PASS": "maoai_secret"
            },
            "health_check": "rabbitmq-diagnostics check_running"
        },
        "nginx": {
            "image": "nginx:alpine",
            "port": 80,
            "env_vars": {},
            "health_check": "curl -s http://localhost:80/health"
        },
        "memcached": {
            "image": "memcached:1.6-alpine",
            "port": 11211,
            "env_vars": {},
            "health_check": "echo 'stats' | nc localhost 11211"
        },
        "dynamodb": {
            "image": "amazon/dynamodb-local:latest",
            "port": 8000,
            "env_vars": {},
            "health_check": "curl -s http://localhost:8000"
        },
        "mailhog": {
            "image": "mailhog/mailhog:latest",
            "port": 1025,
            "env_vars": {},
            "health_check": "curl -s http://localhost:8025/health"
        }
    }

    def __init__(self, workspace: str = None):
        super().__init__(workspace)
        self.compose_cmd = "docker-compose" if self.compose_available else None
        self.active_containers: Dict[str, str] = {}  # name -> container_id

    def generate_compose_file(self, services: List[Service], network: str = "maoai-sandbox") -> str:
        """生成 docker-compose.yml 文件"""
        config = {
            "version": "3.8",
            "services": {},
            "networks": {
                network: {"driver": "bridge"}
            }
        }

        for svc in services:
            service_config = {
                "image": svc.image,
                "container_name": f"maoai-{svc.name}",
                "networks": [network],
                "restart": "unless-stopped"
            }

            # 端口映射
            if svc.port > 0:
                service_config["ports"] = [f"{svc.port}:{svc.port}"]

            # 环境变量
            if svc.env_vars:
                service_config["environment"] = svc.env_vars

            # 依赖关系
            if svc.depends_on:
                service_config["depends_on"] = svc.depends_on

            # 健康检查
            if svc.health_check:
                service_config["healthcheck"] = {
                    "test": svc.health_check.split(),
                    "interval": "30s",
                    "timeout": "10s",
                    "retries": 3
                }

            config["services"][svc.name] = service_config

        return json.dumps(config, ensure_ascii=False, indent=2)

    def provision(self, service_specs: Dict[str, Any]) -> SandboxConfig:
        """
        配置服务

        Args:
            service_specs: 服务规格，如 {"postgres": "15-alpine", "redis": "alpine"}

        Returns:
            SandboxConfig: 沙箱配置
        """
        log_step("action", f"开始配置服务: {list(service_specs.keys())}",
                agent="provisioner", services=list(service_specs.keys()))

        if not self.docker_available:
            log_step("error", "Docker 不可用，无法配置服务", agent="provisioner")
            raise RuntimeError("Docker is not available")

        services = []
        for name, version in service_specs.items():
            # 解析服务名和版本
            if isinstance(version, dict):
                image = version.get("image", f"{name}:latest")
                port = version.get("port", 0)
                env_vars = version.get("env", {})
            else:
                template_key = f"{name}-{version}" if version else name
                if template_key in self.SERVICE_TEMPLATES:
                    template = self.SERVICE_TEMPLATES[template_key]
                elif name in self.SERVICE_TEMPLATES:
                    template = self.SERVICE_TEMPLATES[name]
                else:
                    image = f"{name}:{version}" if version else f"{name}:latest"
                    template = {
                        "image": image,
                        "port": 0,
                        "env_vars": {},
                        "health_check": ""
                    }

                port = template.get("port", 0)
                env_vars = template.get("env_vars", {})
                image = template.get("image", image)

            # 检查端口是否被占用
            if port > 0 and self.check_port("localhost", port):
                log_step("error", f"端口 {port} 已被占用，跳过 {name}",
                        agent="provisioner", port=port, service=name)
                continue

            services.append(Service(
                name=name,
                image=image,
                port=port,
                env_vars=env_vars
            ))

            log_step("observation", f"配置服务: {name} ({image})",
                    agent="provisioner", service=name, image=image, port=port)

        config = SandboxConfig(
            name=f"maoai-sandbox-{int(time.time())}",
            services=services
        )

        # 生成 compose 文件
        compose_content = self.generate_compose_file(services, config.network)
        compose_file = os.path.join(self.workspace, ".maoai", "docker-compose.yml")
        os.makedirs(os.path.dirname(compose_file), exist_ok=True)

        with open(compose_file, "w", encoding="utf-8") as f:
            f.write(compose_content)

        config.compose_file = compose_file
        log_step("done", f"Compose 文件已生成: {compose_file}",
                agent="provisioner", compose_file=compose_file)

        return config

    def start_services(self, config: SandboxConfig) -> Dict[str, ServiceStatus]:
        """
        启动服务

        Returns:
            Dict[str, ServiceStatus]: 各服务状态
        """
        log_step("action", "启动 Docker Compose 服务...",
                agent="provisioner", compose_file=config.compose_file)

        if not self.compose_cmd:
            log_step("error", "Docker Compose 不可用", agent="provisioner")
            return {svc.name: ServiceStatus.FAILED for svc in config.services}

        # 拉取镜像
        log_step("thought", "拉取 Docker 镜像...", agent="provisioner")
        pull_result = self.run_command(
            [self.compose_cmd, "-f", config.compose_file, "pull"],
            timeout=300
        )
        if not pull_result["success"]:
            log_step("error", f"拉取镜像失败: {pull_result['stderr']}", agent="provisioner")

        # 启动服务
        log_step("action", "启动容器...", agent="provisioner")
        start_result = self.run_command(
            [self.compose_cmd, "-f", config.compose_file, "up", "-d"],
            timeout=120
        )

        statuses = {}
        for svc in config.services:
            if start_result["success"]:
                statuses[svc.name] = ServiceStatus.RUNNING
                svc.status = ServiceStatus.RUNNING
            else:
                statuses[svc.name] = ServiceStatus.FAILED
                svc.status = ServiceStatus.FAILED

        log_step("done", f"服务启动完成: {statuses}", agent="provisioner", statuses=statuses)

        return statuses

    def stop_services(self, config: SandboxConfig) -> bool:
        """停止并清理服务"""
        log_step("action", "停止 Docker Compose 服务...",
                agent="provisioner", compose_file=config.compose_file)

        if not self.compose_cmd:
            return False

        result = self.run_command(
            [self.compose_cmd, "-f", config.compose_file, "down", "-v"],
            timeout=60
        )

        log_step("done", f"服务已停止: {result['success']}",
                agent="provisioner", success=result["success"])

        return result["success"]

    def get_service_status(self, config: SandboxConfig) -> Dict[str, ServiceStatus]:
        """获取服务状态"""
        if not self.compose_cmd:
            return {}

        result = self.run_command(
            [self.compose_cmd, "-f", config.compose_file, "ps", "--format", "json"],
            timeout=30
        )

        statuses = {}
        if result["success"] and result["stdout"]:
            try:
                for line in result["stdout"].strip().splitlines():
                    container_info = json.loads(line)
                    name = container_info.get("Service", "")
                    state = container_info.get("State", "").lower()

                    if "running" in state or "up" in state:
                        statuses[name] = ServiceStatus.RUNNING
                    elif "exit" in state:
                        statuses[name] = ServiceStatus.STOPPED
                    else:
                        statuses[name] = ServiceStatus.UNHEALTHY
            except json.JSONDecodeError:
                pass

        # 更新配置中的状态
        for svc in config.services:
            if svc.name in statuses:
                svc.status = statuses[svc.name]

        return statuses


# ─── Dynamic Sandbox ─────────────────────────────────────────────────────────

class DynamicSandbox(DockerProvisioner):
    """
    动态沙箱 - 完全自主的环境管理

    核心功能：
      1. 根据任务需求自动推断所需服务
      2. 动态创建/销毁测试环境
      3. 提供环境连接信息给 Agent
    """

    def __init__(self, workspace: str = None):
        super().__init__(workspace)
        self.active_config: Optional[SandboxConfig] = None
        self.creation_history: List[Dict] = []

    def infer_services(self, task: str) -> Dict[str, Any]:
        """根据任务描述推断所需服务"""
        log_step("thought", f"分析任务，推断所需服务: {task[:50]}...",
                agent="sandbox")

        services = {}

        # 关键词匹配
        keywords = {
            "database": "postgres",
            "数据库": "postgres",
            "postgresql": "postgres",
            "mysql": "mysql",
            "mongodb": "mongo",
            "cache": "redis",
            "缓存": "redis",
            "queue": "rabbitmq",
            "消息队列": "rabbitmq",
            "search": "elasticsearch",
            "搜索": "elasticsearch",
            "email": "mailhog",
            "邮件": "mailhog",
            "session": "redis",
            "nosql": "mongo",
            "dynamodb": "dynamodb"
        }

        task_lower = task.lower()
        for keyword, service in keywords.items():
            if keyword in task_lower and service not in services:
                services[service] = "latest"
                log_step("observation", f"推断需要服务: {service}",
                        agent="sandbox", inferred_service=service)

        # 特殊处理
        if "docker" in task_lower or "container" in task_lower:
            services["nginx"] = "alpine"

        log_step("done", f"服务推断完成: {list(services.keys())}",
                agent="sandbox", inferred_services=list(services.keys()))

        return services

    def create(self, service_specs: Dict[str, Any] = None, task: str = "") -> SandboxConfig:
        """
        创建沙箱环境

        Args:
            service_specs: 明确指定的服务规格，如 {"postgres": "15-alpine"}
            task: 任务描述，用于自动推断服务

        Returns:
            SandboxConfig: 沙箱配置
        """
        # 自动推断服务
        if not service_specs and task:
            service_specs = self.infer_services(task)

        if not service_specs:
            log_step("error", "未指定服务且无法从任务推断",
                    agent="sandbox")
            raise ValueError("No services specified or inferred")

        log_step("start", f"创建动态沙箱，服务: {list(service_specs.keys())}",
                agent="sandbox", services=list(service_specs.keys()))

        # 清理旧环境
        if self.active_config:
            log_step("action", "清理旧沙箱环境...", agent="sandbox")
            self.destroy()

        # 配置服务
        config = self.provision(service_specs)
        self.active_config = config

        # 启动服务
        self.start_services(config)

        # 记录历史
        self.creation_history.append({
            "timestamp": time.time(),
            "services": list(service_specs.keys()),
            "config": config.name
        })

        return config

    def get_connection_info(self) -> Dict[str, Dict[str, Any]]:
        """获取连接信息（供 Agent 使用）"""
        if not self.active_config:
            return {}

        info = {}
        for svc in self.active_config.services:
            conn = {
                "host": "localhost",
                "port": svc.port,
                "image": svc.image,
                "status": svc.status.value
            }

            # 根据服务类型添加额外信息
            if svc.name == "postgres":
                conn["dsn"] = f"postgresql://maoai:maoai_secret@localhost:{svc.port}/maoai_db"
            elif svc.name == "mysql":
                conn["dsn"] = f"mysql://maoai:maoai_secret@localhost:{svc.port}/maoai_db"
            elif svc.name == "redis":
                conn["dsn"] = f"redis://localhost:{svc.port}/0"
            elif svc.name == "mongo":
                conn["dsn"] = f"mongodb://admin:admin_secret@localhost:{svc.port}"

            env_var = f"{svc.name.upper()}_CONNECTION_STRING"
            info[env_var] = conn

        return info

    def destroy(self) -> bool:
        """销毁沙箱环境"""
        if not self.active_config:
            log_step("observation", "没有活动的沙箱需要销毁", agent="sandbox")
            return True

        log_step("action", f"销毁沙箱: {self.active_config.name}",
                agent="sandbox", config_name=self.active_config.name)

        success = self.stop_services(self.active_config)
        self.active_config = None

        log_step("done", f"沙箱已销毁: {success}", agent="sandbox", success=success)

        return success

    def monitor(self) -> Dict[str, Any]:
        """监控沙箱状态"""
        if not self.active_config:
            return {"active": False}

        statuses = self.get_service_status(self.active_config)

        monitor_data = {
            "active": True,
            "config": self.active_config.name,
            "services": {},
            "healthy": all(s == ServiceStatus.RUNNING for s in statuses.values())
        }

        for svc in self.active_config.services:
            monitor_data["services"][svc.name] = {
                "status": svc.status.value,
                "port": svc.port,
                "image": svc.image
            }

        log_step("observation", f"沙箱状态: {'健康' if monitor_data['healthy'] else '有问题'}",
                agent="sandbox", healthy=monitor_data["healthy"])

        return monitor_data

    def wait_for_healthy(self, timeout: int = 60) -> bool:
        """等待所有服务变为健康状态"""
        start = time.time()
        while time.time() - start < timeout:
            monitor = self.monitor()
            if monitor.get("healthy", False):
                return True
            time.sleep(2)

        log_step("error", "服务未能在超时前变为健康状态",
                agent="sandbox", timeout=timeout)
        return False


# ─── Environment Analyzer ────────────────────────────────────────────────────

class EnvironmentAnalyzer(BaseProvisioner):
    """
    环境分析器 - 分析项目所需环境依赖

    功能：
      1. 扫描 package.json / requirements.txt 等依赖文件
      2. 分析 Dockerfile / docker-compose.yml
      3. 推断所需的服务
    """

    def analyze(self, project_path: str = None) -> Dict[str, Any]:
        """分析项目环境需求"""
        project_path = project_path or self.workspace

        log_step("action", f"分析项目环境: {project_path}",
                agent="analyzer")

        result = {
            "language": None,
            "framework": None,
            "dependencies": [],
            "services": [],
            "dockerfile_exists": False,
            "compose_exists": False
        }

        # 检测语言和框架
        if os.path.exists(os.path.join(project_path, "package.json")):
            result["language"] = "javascript"
            result["framework"] = self._detect_js_framework(project_path)
            result["dependencies"] = self._parse_package_json(project_path)

        if os.path.exists(os.path.join(project_path, "requirements.txt")):
            result["language"] = "python"
            result["dependencies"] = self._parse_requirements(project_path)

        if os.path.exists(os.path.join(project_path, "go.mod")):
            result["language"] = "go"

        if os.path.exists(os.path.join(project_path, "Cargo.toml")):
            result["language"] = "rust"

        # 检查 Docker 配置
        result["dockerfile_exists"] = os.path.exists(
            os.path.join(project_path, "Dockerfile")
        )
        result["compose_exists"] = os.path.exists(
            os.path.join(project_path, "docker-compose.yml")
        )

        # 推断所需服务
        result["services"] = self._infer_services_from_deps(result["dependencies"])

        log_step("done", f"环境分析完成: {result['language']} / {result['framework']}",
                agent="analyzer", **result)

        return result

    def _detect_js_framework(self, project_path: str) -> str:
        """检测 JS 框架"""
        deps = []
        pkg_path = os.path.join(project_path, "package.json")
        if os.path.exists(pkg_path):
            try:
                with open(pkg_path, "r", encoding="utf-8") as f:
                    pkg = json.load(f)
                    deps = list(pkg.get("dependencies", {}).keys())
            except Exception:
                pass

        frameworks = {
            "next": "Next.js",
            "nuxt": "Nuxt.js",
            "gatsby": "Gatsby",
            "remix": "Remix",
            "vite": "Vite",
            "express": "Express",
            "fastify": "Fastify",
            "nest": "NestJS",
            "prisma": "Prisma"
        }

        for dep, framework in frameworks.items():
            if dep in deps:
                return framework

        return "Node.js"

    def _parse_package_json(self, project_path: str) -> List[str]:
        """解析 package.json"""
        pkg_path = os.path.join(project_path, "package.json")
        if not os.path.exists(pkg_path):
            return []

        try:
            with open(pkg_path, "r", encoding="utf-8") as f:
                pkg = json.load(f)
                all_deps = list(pkg.get("dependencies", {}).keys()) + \
                          list(pkg.get("devDependencies", {}).keys())
                return all_deps
        except Exception:
            return []

    def _parse_requirements(self, project_path: str) -> List[str]:
        """解析 requirements.txt"""
        req_path = os.path.join(project_path, "requirements.txt")
        if not os.path.exists(req_path):
            return []

        try:
            with open(req_path, "r", encoding="utf-8") as f:
                return [line.strip() for line in f if line.strip() and not line.startswith("#")]
        except Exception:
            return []

    def _infer_services_from_deps(self, dependencies: List[str]) -> List[str]:
        """从依赖推断所需服务"""
        services = []

        dep_str = " ".join(dependencies).lower()

        # 数据库
        if any(d in dep_str for d in ["pg", "postgres", "postgresql"]):
            services.append("postgres")
        if "mysql" in dep_str:
            services.append("mysql")
        if any(d in dep_str for d in ["mongodb", "mongoose"]):
            services.append("mongo")
        if any(d in dep_str for d in ["redis", "ioredis"]):
            services.append("redis")

        # 消息队列
        if any(d in dep_str for d in ["amqp", "rabbitmq", "bull"]):
            services.append("rabbitmq")

        # 搜索引擎
        if any(d in dep_str for d in ["elasticsearch", "opensearch"]):
            services.append("elasticsearch")

        return services


# ─── CLI 入口 ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="MaoAI Self-Provisioning")
    parser.add_argument("--mode", type=str, choices=["create", "destroy", "monitor", "analyze"],
                       default="analyze", help="运行模式")
    parser.add_argument("--services", type=str, default="",
                       help="服务列表，逗号分隔，如: postgres:15-alpine,redis:alpine")
    parser.add_argument("--task", type=str, default="", help="任务描述（用于自动推断）")
    parser.add_argument("--workspace", type=str, default=os.environ.get("WORKSPACE", "."),
                       help="工作目录")
    args = parser.parse_args()

    if args.mode == "analyze":
        analyzer = EnvironmentAnalyzer(args.workspace)
        result = analyzer.analyze()
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif args.mode == "create":
        sandbox = DynamicSandbox(args.workspace)

        # 解析服务
        services = {}
        if args.services:
            for spec in args.services.split(","):
                parts = spec.split(":")
                name = parts[0].strip()
                version = parts[1].strip() if len(parts) > 1 else "latest"
                services[name] = version

        config = sandbox.create(services, args.task)
        connection_info = sandbox.get_connection_info()

        log_step("done", "沙箱创建完成",
                config_name=config.name,
                connection_info=connection_info)

        print(json.dumps({
            "config": config.name,
            "services": [s.name for s in config.services],
            "connection_info": connection_info
        }, ensure_ascii=False, indent=2))

    elif args.mode == "monitor":
        sandbox = DynamicSandbox(args.workspace)
        result = sandbox.monitor()
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif args.mode == "destroy":
        sandbox = DynamicSandbox(args.workspace)
        success = sandbox.destroy()
        log_step("done", f"沙箱销毁{'成功' if success else '失败'}",
                success=success)
