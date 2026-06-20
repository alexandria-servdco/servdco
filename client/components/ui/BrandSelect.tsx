import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type BrandSelectOption = {
  value: string;
  label: string;
};

type BrandSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: BrandSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/** Dark-themed Radix select — no native browser blue highlight. */
export function BrandSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  disabled,
}: BrandSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "h-10 rounded-xl border-white/10 bg-[#111111] text-white text-sm",
          "focus:ring-[#FF7A59]/40 focus:ring-offset-0",
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-[#161616] border-white/10 text-white rounded-xl">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="rounded-lg focus:bg-[#FF7A59]/15 focus:text-white data-[highlighted]:bg-[#FF7A59]/15 data-[highlighted]:text-white"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
