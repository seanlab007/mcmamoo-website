import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const { data: models, isLoading } = trpc.ai.models.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        <span>加载模型...</span>
      </div>
    );
  }

  const availableModels = models?.filter(m => m.available) ?? [];

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 text-xs bg-secondary border-border w-[180px]">
        <SelectValue placeholder="选择模型" />
      </SelectTrigger>
      <SelectContent>
        {availableModels.map(model => (
          <SelectItem key={model.id} value={model.id} className="text-xs">
            <span className="mr-1.5">{model.badge}</span>
            {model.name}
          </SelectItem>
        ))}
        {availableModels.length === 0 && (
          <SelectItem value="_none" disabled className="text-xs text-muted-foreground">
            无可用模型
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
