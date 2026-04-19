import { Toaster } from "@/components/ui/sonner";
import "./lib/i18n"; // 初始化 18国语言 i18n
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CaseXieTaitai from "./pages/CaseXieTaitai";
import CaseXiaoxiandun from "./pages/CaseXiaoxiandun";
import CaseJiangzhong from "./pages/CaseJiangzhong";
import CaseXiaoguan from "./pages/CaseXiaoguan";
import CasePangge from "./pages/CasePangge";
import MaoThinkTank from "./pages/MaoThinkTank";
import AdminMaoApplications from "./pages/AdminMaoApplications";
import AdminSubscribers from "./pages/AdminSubscribers";
import AdminAiNodes from "./pages/AdminAiNodes";
import Platform from "./pages/Platform";
import Chat from "./pages/Chat";
import Notes from "./pages/Notes";
import WechatFloat from "./components/WechatFloat";
import IPLicensing from "./pages/IPLicensing";
import Pricing from "./pages/Pricing";
import Press from "./pages/Press";
// MaoAI Feature
import {
  MaoAIChat,
  MaoAILogin,
  MaoAIPricing,
  MaoAISales,
  MAOAI_ROUTES,
} from "./features/maoai";
import OpenClaw from "./pages/OpenClaw";
import MillenniumClock from "./pages/MillenniumClock";
import WhalePictures from "./pages/WhalePictures";
import AdminInquiries from "./pages/AdminInquiries";
import AdminLogs from "./pages/AdminLogs";
import AdminMillenniumClock from "./pages/AdminMillenniumClock";
import AdminNodes from "./pages/AdminNodes";
import AdminRouting from "./pages/AdminRouting";
import MaoIndustry from "./components/sections/MaoIndustry";
import FaceFusion from "./pages/FaceFusion";

// 猫眼内容平台跳转地址（本地:3001，云端: mcmamoo.com/content）
const CONTENT_PLATFORM_URL = process.env.NODE_ENV === "production"
  ? "/content"
  : "http://localhost:3001/content";

// 猫眼内容平台跳转地址（本地:3001，云端: mcmamoo.com/content）
const CONTENT_PLATFORM_URL = process.env.NODE_ENV === "production"
  ? "/content"
  : "http://localhost:3001/content";

function Router() {
  return (
    <Switch>
      {/* 官网首页 */}
      <Route path={"/"} component={Home} />
      
      {/* 案例页面 */}
      <Route path={"/cases/xietaitai"} component={CaseXieTaitai} />
      <Route path={"/cases/xiaoxiandun"} component={CaseXiaoxiandun} />
      <Route path={"/cases/jiangzhong"} component={CaseJiangzhong} />
      <Route path={"/cases/xiaoguan"} component={CaseXiaoguan} />
      <Route path={"/cases/pangge"} component={CasePangge} />
      
      {/* 旗下子公司 */}
      <Route path={"/mao-think-tank"} component={MaoThinkTank} />
      <Route path={"/maothink"} component={MaoThinkTank} />
      <Route path={"/whale-pictures"} component={WhalePictures} />
      <Route path={"/mao-industry"} component={MaoIndustry} />
      
      {/* 管理后台（部分） */}
      <Route path={"/admin/mao-applications"} component={AdminMaoApplications} />
      <Route path={"/admin/subscribers"} component={AdminSubscribers} />
      <Route path={"/admin/ai-nodes"} component={AdminAiNodes} />
      <Route path={"/platform"} component={Platform} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/notes"} component={Notes} />
      <Route path={"/ip-licensing"} component={IPLicensing} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/press"} component={Press} />
      <Route path={"/openclaw"} component={OpenClaw} />
      <Route path={"/millennium-clock"} component={MillenniumClock} />
      
      {/* MaoAI */}
      <Route path={MAOAI_ROUTES.CHAT} component={MaoAIChat} />
      <Route path={MAOAI_ROUTES.LOGIN} component={MaoAILogin} />
      <Route path={MAOAI_ROUTES.PRICING} component={MaoAIPricing} />
      <Route path={MAOAI_ROUTES.SALES} component={MaoAISales} />
      {/* 兼容旧路由 */}
      <Route path={"/mao-ai"} component={MaoAIChat} />
      <Route path={"/mao-ai-pricing"} component={MaoAIPricing} />
      
<<<<<<< HEAD
      {/* 猫眼内容平台 */}
=======
      {/* 猫眼内容平台跳转（已拆分到独立项目） */}
>>>>>>> feat/maoai-latest
      <Route path={"/content"}>
        {() => {
          if (typeof window !== "undefined") {
            window.location.href = CONTENT_PLATFORM_URL;
          }
          return null;
        }}
      </Route>
      <Route path={"/autoclip"}>
        {() => {
          if (typeof window !== "undefined") {
            window.location.href = CONTENT_PLATFORM_URL.replace("/content", "/autoclip");
          }
          return null;
        }}
      </Route>
<<<<<<< HEAD

      {/* FaceFusion 面部融合 */}
      <Route path={"/facefusion"} component={FaceFusion} />
=======
>>>>>>> feat/maoai-latest
      
      {/* Admin 管理页面 */}
      <Route path={"/admin/inquiries"} component={AdminInquiries} />
      <Route path={"/admin/logs"} component={AdminLogs} />
      <Route path={"/admin/millennium-clock"} component={AdminMillenniumClock} />
      <Route path={"/admin/nodes"} component={AdminNodes} />
      <Route path={"/admin/routing"} component={AdminRouting} />
      
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <WechatFloat />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
