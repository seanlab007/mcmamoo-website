import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

interface SystemPromptSelectorProps {
  value: string;
  onChange: (value: string, prompt: string) => void;
  disabled?: boolean;
}

export function SystemPromptSelector({ value, onChange, disabled }: SystemPromptSelectorProps) {
  const { data: presets } = trpc.ai.presets.useQuery();

  const handleChange = (presetId: string) => {
    const preset = presets?.find(p => p.id === presetId);
    if (preset) {
      onChange(presetId, preset.prompt);
    }
  };

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="h-8 text-xs bg-secondary border-border w-[160px]">
        <SelectValue placeholder="选择预设" />
      </SelectTrigger>
      <SelectContent>
        {presets?.map(preset => (
          <SelectItem key={preset.id} value={preset.id} className="text-xs">
            {preset.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
