import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminNodes from "./pages/AdminNodes";
import AdminRouting from "./pages/AdminRouting";
import AdminLogs from "./pages/AdminLogs";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      {/* Admin routes — protected by role check inside each page */}
      <Route path={"/admin/nodes"} component={AdminNodes} />
      <Route path={"/admin/routing"} component={AdminRouting} />
      <Route path={"/admin/logs"} component={AdminLogs} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
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
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
