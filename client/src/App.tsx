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
import WechatFloat from "./components/WechatFloat";

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
      <Route path={"/admin/ai-nodes"} component={AdminAiNodes} />
      <Route path={"/platform"} component={Platform} />
      <Route path={"/chat"} component={Chat} />
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
