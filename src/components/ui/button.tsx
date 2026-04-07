import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-eco-700 text-white shadow-[0_10px_24px_-15px_rgba(22,101,52,0.8)] hover:-translate-y-0.5 hover:bg-eco-800",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-input bg-white/90 hover:bg-muted",
        ghost: "hover:bg-muted",
        secondary: "bg-eco-100 text-eco-900 hover:bg-eco-200",
        yellow: "bg-amber-400 text-amber-950 shadow-[0_12px_24px_-18px_rgba(251,191,36,0.95)] hover:-translate-y-0.5 hover:bg-amber-500"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
