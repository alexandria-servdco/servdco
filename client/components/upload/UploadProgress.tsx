import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface UploadProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value: number;
  label?: string;
}

export const UploadProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  UploadProgressProps
>(({ className, value, label, ...props }, ref) => (
  <div className="w-full space-y-1">
    {label && (
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#A8A8A8]">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-white/10",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-[#FF7A59] transition-all duration-300 ease-in-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  </div>
));
UploadProgress.displayName = "UploadProgress";
