import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MODEL_LABELS: Record<string, string> = {
  "deepseek-chat": "DS V3",
  "deepseek-reasoner": "DS R1",
  "glm-4-flash": "GLM Flash",
  "glm-4-plus": "GLM Plus",
  "llama-3.3-70b-versatile": "Groq",
};

export function StatusIndicator() {
  const { data: status } = trpc.ai.status.useQuery(undefined, {
    refetchInterval: 30000,
  });

  if (!status) return null;

  const entries = Object.entries(status);
  const onlineCount = entries.filter(([, v]) => v).length;

  return (
    <div className="flex items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-default">
            <div className={cn(
              "size-1.5 rounded-full",
              onlineCount > 0 ? "bg-green-400 animate-pulse" : "bg-red-400"
            )} />
            <span className="text-[10px] text-muted-foreground">
              {onlineCount}/{entries.length}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="flex flex-col gap-1 p-1">
            {entries.map(([id, online]) => (
              <div key={id} className="flex items-center gap-2">
                <div className={cn("size-1.5 rounded-full", online ? "bg-green-400" : "bg-red-400")} />
                <span>{MODEL_LABELS[id] || id}</span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
