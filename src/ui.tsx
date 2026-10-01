import { Check, X } from "lucide-react";
import {
  Checkbox as CheckboxPrimitive,
  Dialog as DialogPrimitive,
  Popover as PopoverPrimitive,
  Slider as SliderPrimitive,
  Tooltip as TooltipPrimitive,
  ToggleGroup as ToggleGroupPrimitive,
} from "radix-ui";
import React, { forwardRef, useRef, useSyncExternalStore } from "react";

type Side = "top" | "right" | "bottom" | "left";
export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  text,
  side = "top",
  sideOffset = 8,
  children,
}: {
  text: string;
  side?: Side;
  sideOffset?: number;
  children: React.ReactElement;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className="tooltip"
          side={side}
          sideOffset={sideOffset}
          collisionPadding={9}
          hideWhenDetached
        >
          {text}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  "data-tooltip"?: string;
  tooltipSide?: Side;
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { "data-tooltip": text, tooltipSide, ...props },
  ref,
) {
  const button = <button ref={ref} {...props} />;
  if (!text) return button;
  const side =
    tooltipSide ??
    (props.className?.includes("header-icon") || props.className === "places-button"
      ? "bottom"
      : "top");
  return (
    <Tooltip text={text} side={side}>
      {button}
    </Tooltip>
  );
});

export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  label,
  closeLabel,
  className,
  side = "bottom",
  align = "start",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactElement;
  children: React.ReactNode;
  label: string;
  closeLabel: string;
  className: string;
  side?: Side;
  align?: "start" | "center" | "end";
}) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={`${className} ui-popover`}
          aria-label={label}
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={{ top: 52, bottom: 30, left: 10, right: 10 }}
        >
          <PopoverPrimitive.Close className="popover-close" aria-label={closeLabel}>
            <X size={14} />
          </PopoverPrimitive.Close>
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function Dialog({
  open,
  onOpenChange,
  label,
  closeLabel,
  className = "",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  closeLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="modal-backdrop ui-backdrop" />
        <DialogPrimitive.Content
          className={`source-modal ui-dialog ${className}`}
          onOpenAutoFocus={() => {
            returnFocus.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocus.current?.isConnected) returnFocus.current.focus();
          }}
        >
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {label} · Fermez cette fenêtre pour revenir à la carte.
          </DialogPrimitive.Description>
          <DialogPrimitive.Close className="close-modal" aria-label={closeLabel}>
            <X />
          </DialogPrimitive.Close>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Checkbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <CheckboxPrimitive.Root
      className="ui-checkbox"
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
    >
      <CheckboxPrimitive.Indicator>
        <Check size={13} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

const shortScreen = window.matchMedia("(max-height: 650px)");
function subscribeScreen(callback: () => void) {
  shortScreen.addEventListener("change", callback);
  return () => shortScreen.removeEventListener("change", callback);
}
export function Slider({
  value,
  onValueChange,
  disabled,
  label,
  valueText,
}: {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  label: string;
  valueText: string;
}) {
  const horizontal = useSyncExternalStore(subscribeScreen, () => shortScreen.matches);
  return (
    <SliderPrimitive.Root
      className="ui-slider"
      min={0}
      max={100}
      step={1}
      value={[value]}
      onValueChange={(values) => onValueChange(values[0])}
      orientation={horizontal ? "horizontal" : "vertical"}
      disabled={disabled}
    >
      <SliderPrimitive.Track className="ui-slider-track">
        <SliderPrimitive.Range className="ui-slider-fill" />
      </SliderPrimitive.Track>
      <Tooltip text={label} side="left">
        <SliderPrimitive.Thumb
          className="ui-slider-thumb"
          aria-label={label}
          aria-valuetext={valueText}
        />
      </Tooltip>
    </SliderPrimitive.Root>
  );
}

export function ToggleGroup({
  value,
  onValueChange,
  children,
  ...props
}: Omit<
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>,
  "type" | "value" | "onValueChange" | "defaultValue"
> & { value: string; onValueChange: (value: string) => void }) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next);
      }}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  );
}
export const ToggleItem = ToggleGroupPrimitive.Item;
