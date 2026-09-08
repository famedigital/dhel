import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-foreground",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/15",
        success:
          "border-emerald-600/25 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-950/40 dark:text-emerald-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export { Alert, alertVariants };
