import { Toaster } from "@/components/ui/sonner";
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
import MaoAIChat from "./pages/MaoAIChat";
import MaoAIPricing from "./pages/MaoAIPricing";
import OpenClaw from "./pages/OpenClaw";
import MillenniumClock from "./pages/MillenniumClock";
import WhalePictures from "./pages/WhalePictures";
import AdminInquiries from "./pages/AdminInquiries";
import AdminLogs from "./pages/AdminLogs";
import AdminMillenniumClock from "./pages/AdminMillenniumClock";
import AdminNodes from "./pages/AdminNodes";
import AdminRouting from "./pages/AdminRouting";
import AutoClip from "./pages/AutoClip";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/cases/xietaitai"} component={CaseXieTaitai} />
      <Route path={"/cases/xiaoxiandun"} component={CaseXiaoxiandun} />
      <Route path={"/cases/jiangzhong"} component={CaseJiangzhong} />
      <Route path={"/cases/xiaoguan"} component={CaseXiaoguan} />
      <Route path={"/cases/pangge"} component={CasePangge} />
      <Route path={"/maothink"} component={MaoThinkTank} />
      <Route path={"/admin/mao-applications"} component={AdminMaoApplications} />
      <Route path={"/admin/subscribers"} component={AdminSubscribers} />
      <Route path={"/admin/ai-nodes" } component={AdminAiNodes} />
      <Route path={"/platform"} component={Platform} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/notes"} component={Notes} />
      {/* IP 授权、定价、新闻稿等页面 */}
      <Route path={"/ip-licensing"} component={IPLicensing} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/press"} component={Press} />
      {/* MaoAI 相关页面 */}
      <Route path={"/mao-ai"} component={MaoAIChat} />
      <Route path={"/mao-ai-pricing"} component={MaoAIPricing} />
      {/* 其他功能页面 */}
      <Route path={"/openclaw"} component={OpenClaw} />
      <Route path={"/millennium-clock"} component={MillenniumClock} />
      <Route path={"/whale-pictures"} component={WhalePictures} />
      <Route path={"/autoclip"} component={AutoClip} />
      {/* Admin 管理页面 */}
      <Route path={"/admin/inquiries"} component={AdminInquiries} />
      <Route path={"/admin/logs"} component={AdminLogs} />
      <Route path={"/admin/millennium-clock"} component={AdminMillenniumClock} />
      <Route path={"/admin/nodes"} component={AdminNodes} />
      <Route path={"/admin/routing"} component={AdminRouting} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
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
