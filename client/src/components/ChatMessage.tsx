import { cn } from "@/lib/utils";
import { User, Sparkles, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  model?: string | null;
  isStreaming?: boolean;
  createdAt?: Date;
}

function CodeBlock({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  if (!match) {
    // Inline code
    return (
      <code className={cn("font-mono text-[0.85em] bg-muted px-1.5 py-0.5 rounded text-primary", className)} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-[oklch(0.14_0.01_240)] px-4 py-1.5 rounded-t-lg border border-border border-b-0">
        <span className="text-xs text-muted-foreground font-mono">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <><Check className="size-3 text-green-400" /><span className="text-green-400">已复制</span></>
          ) : (
            <><Copy className="size-3" /><span>复制</span></>
          )}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none !border-t-0 overflow-x-auto bg-[oklch(0.13_0.01_240)] p-4">
        <code className={cn(className, "!bg-transparent")} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function ChatMessage({ role, content, model, isStreaming, createdAt }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="size-8 shrink-0 mt-0.5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Sparkles className="size-4 text-primary" />
        </div>
      )}

      <div className={cn("max-w-[85%] min-w-0", isUser ? "items-end" : "items-start", "flex flex-col gap-1")}>
        {!isUser && model && (
          <span className="text-[10px] text-muted-foreground px-1">{model}</span>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card border border-border text-foreground rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className={cn("prose-chat", isStreaming && !content && "typing-cursor")}>
              {content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code: CodeBlock as any,
                    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
                    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-3 hover:opacity-80">
                        {children}
                      </a>
                    ),
                    table: ({ children }: { children?: React.ReactNode }) => (
                      <div className="overflow-x-auto my-2">
                        <table className="prose-chat-table w-full border-collapse text-sm">{children}</table>
                      </div>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : null}
              {isStreaming && content && <span className="typing-cursor" />}
            </div>
          )}
        </div>
        {createdAt && (
          <span className="text-[10px] text-muted-foreground px-1">
            {new Date(createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {isUser && (
        <div className="size-8 shrink-0 mt-0.5 rounded-full bg-secondary border border-border flex items-center justify-center">
          <User className="size-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}
