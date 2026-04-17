/**
 * react-router-dom → wouter 兼容层
 * 
 * 改动目的：autoclip 各页面使用 react-router-dom v6 API，需适配到 mcmamoo-website 的 wouter v3
 * 改动内容：提供 react-router-dom 兼容的 hooks 和组件
 * 
 * wouter 与 react-router-dom API 差异：
 * - wouter: useNavigate 不存在，用 navigate() 函数或 useLocation()[1] 获取 setLocation
 * - wouter: Routes 不存在，用 Switch 代替
 * - wouter: useParams/useLocation 直接兼容
 * - wouter: Route 支持 children 函数形式 (params) => JSX
 */
import { useLocation, useParams, Route, Switch, useRouter } from "wouter";
import { navigate } from "wouter/use-browser-location";

// 兼容 react-router-dom 的组件别名
// wouter 没有 Routes，用 Switch 代替
export { Route, Switch as Routes };

// BrowserRouter 在 wouter 中就是 Router（根组件）
// mcmamoo-website 的 App.tsx 已经用 Router 包裹，这里不需要再包裹
// 为兼容 autoclip 代码，导出空组件
export const BrowserRouter = ({ children }: { children: React.ReactNode }) => children;

// 兼容 react-router-dom 的 useNavigate
// react-router-dom: const navigate = useNavigate(); navigate('/path')
// wouter: navigate('/path') (直接调用)
// 这里包装成 hook 形式以兼容 autoclip 代码
export function useNavigate() {
  return navigate;
}

// 导出 wouter 原生 hooks
export { useLocation, useParams };
