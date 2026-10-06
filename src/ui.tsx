import { Check, ChevronDown, X } from "lucide-react";
import {
  Checkbox as CheckboxPrimitive,
  Dialog as DialogPrimitive,
  DropdownMenu as DropdownMenuPrimitive,
  Popover as PopoverPrimitive,
  Select as SelectPrimitive,
  Slider as SliderPrimitive,
  Tooltip as TooltipPrimitive,
  ToggleGroup as ToggleGroupPrimitive,
} from "radix-ui";
import React, { forwardRef, useRef } from "react";
import { useTranslation } from "react-i18next";

type Side = "top" | "right" | "bottom" | "left";
export const TooltipProvider = TooltipPrimitive.Provider;

export function DropdownMenu({
  open,
  onOpenChange,
  trigger,
  label,
  options,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactElement;
  label: string;
  options: readonly { id: string; label: string; onSelect: () => void }[];
}) {
  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          className="ui-select-content"
          aria-label={label}
          align="end"
          sideOffset={6}
          collisionPadding={10}
        >
          {options.map((option) => (
            <DropdownMenuPrimitive.Item
              className="ui-select-item"
              key={option.id}
              onSelect={option.onSelect}
            >
              {option.label}
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

export function Select({
  label,
  value,
  onValueChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string; lang?: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="ui-select-trigger" aria-label={label} data-value={value}>
        {icon && (
          <span className="ui-select-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="ui-select-value">
          <SelectPrimitive.Value />
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={14} aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="ui-select-content"
          position="popper"
          align="end"
          sideOffset={6}
          collisionPadding={10}
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                className="ui-select-item"
                key={option.value}
                value={option.value}
                lang={option.lang}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check size={14} aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

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
  const { t } = useTranslation();
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
            {label} · {t("dialog.return")}
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

export function Slider({
  value,
  onValueChange,
  disabled,
  label,
  valueText,
  offThreshold = 0,
  onValueCommit,
}: {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  label: string;
  valueText: string;
  offThreshold?: number;
  onValueCommit?: (value: number) => void;
}) {
  return (
    <SliderPrimitive.Root
      className="ui-slider"
      min={0}
      max={100 + offThreshold}
      step={1}
      value={[value === 0 ? 0 : value + offThreshold]}
      data-off-zone={offThreshold > 0 ? "true" : undefined}
      style={
        {
          "--slider-off-zone": `${(offThreshold / (100 + offThreshold)) * 100}%`,
        } as React.CSSProperties
      }
      onValueChange={(values) => onValueChange(Math.max(0, values[0] - offThreshold))}
      onValueCommit={(values) => onValueCommit?.(Math.max(0, values[0] - offThreshold))}
      onKeyDown={(event) => {
        // Keyboard users leave the off detent immediately instead of traversing invisible steps.
        if (
          offThreshold > 0 &&
          value === 0 &&
          ["ArrowUp", "ArrowRight", "PageUp"].includes(event.key)
        ) {
          event.preventDefault();
          const next = event.key === "PageUp" || event.shiftKey ? 10 : 1;
          onValueChange(next);
          onValueCommit?.(next);
        }
      }}
      orientation="vertical"
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
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
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
