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

import ContentPlatform from "./features/maoai/pages/ContentPlatform";
import MaoStrategy from "./pages/MaoStrategy";
import { MPODashboard } from "./features/mpo/components/MPODashboard";

// 代账功能
import {
  AccountingDashboard,
  AccountingInvoices,
  AccountingJournal,
  AccountingTaxCalendar,
} from "./features/accounting";

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
      
      {/* 毛战略决策部 - MaoAI 核心战略中枢 */}
      <Route path={"/strategy"} component={MaoStrategy} />

      {/* MPO 监控仪表板 */}
      <Route path={"/mpo"} component={MPODashboard} />
      <Route path={"/mpo/dashboard"} component={MPODashboard} />

      {/* 代账功能 */}
      <Route path={"/accounting"} component={AccountingDashboard} />
      <Route path={"/accounting/invoices"} component={AccountingInvoices} />
      <Route path={"/accounting/journal"} component={AccountingJournal} />
      <Route path={"/accounting/tax-calendar"} component={AccountingTaxCalendar} />
      
      {/* 猫眼内容平台（已整合到主站） */}
      <Route path={"/content"} component={ContentPlatform} />
      <Route path={"/autoclip"} component={ContentPlatform} />
      
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
