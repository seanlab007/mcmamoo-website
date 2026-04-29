/**
 * 统一日志系统 - MaoAI Logger
 * 
 * 使用方式:
 *   import { createLogger } from "./_core/logger";
 *   const logger = createLogger("ChatAPI");
 *   logger.info("用户登录成功", { userId: "xxx" });
 */

export enum LogLevel {
  DEBUG = 0,
  INFO  = 1,
  WARN  = 2,
  ERROR = 3,
}

const CURRENT_LEVEL = (() => {
  const env = process.env.LOG_LEVEL;
  if (env === undefined) return LogLevel.INFO;
  const n = parseInt(env, 10);
  return isNaN(n) ? LogLevel.INFO : n;
})();

/**
 * 创建带模块前缀的日志实例
 */
export function createLogger(module: string) {
  const ts = () => new Date().toISOString().replace("T", " ").slice(0, 19);
  const prefix = () => `${ts()} [${module}]`;

  return {
    debug: (msg: string, ...args: unknown[]) => {
      if (CURRENT_LEVEL <= LogLevel.DEBUG)
        console.debug(prefix(), msg, ...args);
    },
    info: (msg: string, ...args: unknown[]) => {
      if (CURRENT_LEVEL <= LogLevel.INFO)
        console.info(prefix(), msg, ...args);
    },
    warn: (msg: string, ...args: unknown[]) => {
      if (CURRENT_LEVEL <= LogLevel.WARN)
        console.warn(prefix(), msg, ...args);
    },
    error: (msg: string, ...args: unknown[]) => {
      if (CURRENT_LEVEL <= LogLevel.ERROR)
        console.error(prefix(), msg, ...args);
    },
  };
}
