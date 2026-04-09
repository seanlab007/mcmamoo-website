/**
 * 适配层：将 react-router-dom 的 hooks 接口适配到 wouter
 * 
 * 改动目的：autoclip 使用 react-router-dom API，需适配到 mcmamoo-website 的 wouter 路由
 * 改动内容：提供兼容接口层，屏蔽两个路由库的差异
 */
import { useLocation, useParams, useNavigate } from "wouter";
import { useRouter } from "wouter";

// wouter 的 params 是返回式而非 Hook，需要包装
// 对于 :id 这样的参数，wouter 的 useParams() 需要在对应 Route 内部使用
// 这里提供一个兼容层，内部使用 wouter hooks

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => children;

export function Routes({ children }: { children: React.ReactNode }) {
  // wouter 的路由在 App.tsx 中通过 <Switch> + <Route> 定义
  // 这里不做路由解析，直接渲染子路由
  return <>{children}</>;
}

// 使用 wouter 的 useParams
export function useParams<T = Record<string, string>>() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params = (useParams as any)();
  return params as T;
}

// 使用 wouter 的 useNavigate
export function useRouterDomNavigate() {
  const navigate = useNavigate();
  return navigate;
}

// 重新导出 wouter hooks 作为 react-router-dom 别名
export { useLocation, useNavigate };
