import React, { forwardRef } from "react";
import { Root as RadioGroupRoot, Item as RadioGroupItemPrimitive, Indicator } from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { cn } from "../../lib/utils"; // <-- adjust the path as needed

const RadioGroup = forwardRef((props, ref) => {
  const { className, ...rest } = props;
  return (
    <RadioGroupRoot
      ref={ref}
      className={cn("grid gap-2", className)}
      {...rest}
    />
  );
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = forwardRef((props, ref) => {
  const { className, ...rest } = props;
  return (
    <RadioGroupItemPrimitive
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...rest}
    >
      <Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </Indicator>
    </RadioGroupItemPrimitive>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };

