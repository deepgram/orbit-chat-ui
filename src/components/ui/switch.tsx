import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group inline-flex h-6 w-11 shrink-0 items-center rounded-full border shadow-xs transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50",
        // Track colors
        "data-[state=unchecked]:bg-secondary/70",
        "data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-primary data-[state=checked]:to-emerald-300/60",
        // Border & focus
        "border-border focus-visible:border-ring focus-visible:ring-ring focus-visible:ring-[4px]",
        // Subtle glow when ON
        "data-[state=checked]:shadow-[0_0_12px_rgba(122,162,255,0.45)]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full shadow-md ring-0 transition-transform",
          // Thumb colors
          "bg-foreground group-data-[state=checked]:bg-white",
          // Outline for visibility on gradient track
          "border border-border ring-1 ring-border/50",
          // Position (based on parent state)
          "ml-[2px] group-data-[state=checked]:translate-x-5 group-data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
