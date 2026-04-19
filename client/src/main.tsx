import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      transformer: superjson,
      headers() {
        const sessionToken = localStorage.getItem("maoai_session_token");
        return sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
      },
      fetch(input, init) {
        // 从 localStorage 获取 sessionToken（邮箱登录后存储的）
        const sessionToken =
          typeof window !== "undefined"
            ? localStorage.getItem("maoai_session_token")
            : null;

        const headers: Record<string, string> = {
          ...(init?.headers as Record<string, string> ?? {}),
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        };

        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include", // 同时尝试带 Cookie（同域场景）
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
