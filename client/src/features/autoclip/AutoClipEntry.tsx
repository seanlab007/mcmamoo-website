/**
 * AutoClip 主入口组件
 * 
 * 改动目的：
 *   1. autoclip 使用独立路由系统（react-router-dom），需整合到 mcmamoo-website 的 wouter 路由
 *   2. 提供统一的嵌套路由：/autoclip、/autoclip/project/:id、/autoclip/settings
 *   3. 提供 antd 样式加载
 * 
 * 改动内容：
 *   - 在 wouter 路由子树中渲染 autoclip 页面
 *   - 导入 antd 全局样式
 */
import "./styles/globals.css";
import { Route, Switch } from "wouter";
import HomePage from "./pages/HomePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import SettingsPage from "./pages/SettingsPage";

/**
 * AutoClip 主入口
 * wouter 的 /autoclip/* 路由在此组件内继续使用 Route/Switch 处理子路由
 * useParams/useNavigate 在 Route 树内部可用
 */
export default function AutoClipEntry() {
  return (
    <Switch>
      {/* /autoclip → 项目列表首页 */}
      <Route path="/autoclip" component={HomePage} />
      
      {/* /autoclip/project/:id → 项目详情页 */}
      <Route path="/autoclip/project/:id">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(params) => <ProjectDetailPage params={params} />}
      </Route>
      
      {/* /autoclip/settings → 设置页 */}
      <Route path="/autoclip/settings" component={SettingsPage} />
      
      {/* 兜底 → 重定向到首页 */}
      <Route>{() => { window.location.href = "/autoclip"; return null; }}</Route>
    </Switch>
  );
}
