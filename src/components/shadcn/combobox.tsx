'use client';

import type { ComponentPropsWithRef } from 'react';
import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/shadcn/button';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/shadcn/input-group';
import { cn } from '@/lib/utils';

const Combobox = ComboboxPrimitive.Root;

const ComboboxValue = ({ ...props }: ComboboxPrimitive.Value.Props) => (
	<ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
);

const ComboboxTrigger = ({ children, className, ...props }: ComboboxPrimitive.Trigger.Props) => (
	<ComboboxPrimitive.Trigger
		className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
		data-slot="combobox-trigger"
		{...props}
	>
		{children}
		<ChevronDownIcon className="text-muted-foreground size-4 pointer-events-none" />
	</ComboboxPrimitive.Trigger>
);

const ComboboxClear = ({ className, ...props }: ComboboxPrimitive.Clear.Props) => (
	<ComboboxPrimitive.Clear
		className={cn(className)}
		data-slot="combobox-clear"
		render={<InputGroupButton size="icon-xs" variant="ghost" />}
		{...props}
	>
		<XIcon className="pointer-events-none" />
	</ComboboxPrimitive.Clear>
);

const ComboboxInput = ({
	children,
	className,
	disabled = false,
	showClear = false,
	showTrigger = true,
	...props
}: ComboboxPrimitive.Input.Props & {
	showClear?: boolean;
	showTrigger?: boolean;
}) => (
	<InputGroup className={cn('w-auto', className)}>
		<ComboboxPrimitive.Input render={<InputGroupInput disabled={disabled} />} {...props} />
		<InputGroupAddon align="inline-end">
			{showTrigger && (
				<InputGroupButton
					className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
					data-slot="input-group-button"
					disabled={disabled}
					render={<ComboboxTrigger />}
					size="icon-xs"
					variant="ghost"
				/>
			)}
			{showClear && <ComboboxClear disabled={disabled} />}
		</InputGroupAddon>
		{children}
	</InputGroup>
);

const ComboboxContent = ({
	align = 'start',
	alignOffset = 0,
	anchor,
	className,
	side = 'bottom',
	sideOffset = 6,
	...props
}: ComboboxPrimitive.Popup.Props &
	Pick<
		ComboboxPrimitive.Positioner.Props,
		'align' | 'alignOffset' | 'anchor' | 'side' | 'sideOffset'
	>) => (
	<ComboboxPrimitive.Portal>
		<ComboboxPrimitive.Positioner
			align={align}
			alignOffset={alignOffset}
			anchor={anchor}
			className="isolate z-50"
			side={side}
			sideOffset={sideOffset}
		>
			<ComboboxPrimitive.Popup
				className={cn(
					'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:border-input/30 overflow-hidden rounded-lg shadow-md ring-1 duration-100 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:shadow-none data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) data-[chips=true]:min-w-(--anchor-width)',
					className,
				)}
				data-chips={!!anchor}
				data-slot="combobox-content"
				{...props}
			/>
		</ComboboxPrimitive.Positioner>
	</ComboboxPrimitive.Portal>
);

const ComboboxList = ({ className, ...props }: ComboboxPrimitive.List.Props) => (
	<ComboboxPrimitive.List
		className={cn(
			'no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 p-1 data-empty:p-0 overflow-y-auto overscroll-contain',
			className,
		)}
		data-slot="combobox-list"
		{...props}
	/>
);

const ComboboxItem = ({ children, className, ...props }: ComboboxPrimitive.Item.Props) => (
	<ComboboxPrimitive.Item
		className={cn(
			"data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
			className,
		)}
		data-slot="combobox-item"
		{...props}
	>
		{children}
		<ComboboxPrimitive.ItemIndicator
			render={
				<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
			}
		>
			<CheckIcon className="pointer-events-none" />
		</ComboboxPrimitive.ItemIndicator>
	</ComboboxPrimitive.Item>
);

const ComboboxGroup = ({ className, ...props }: ComboboxPrimitive.Group.Props) => (
	<ComboboxPrimitive.Group className={cn(className)} data-slot="combobox-group" {...props} />
);

const ComboboxLabel = ({ className, ...props }: ComboboxPrimitive.GroupLabel.Props) => (
	<ComboboxPrimitive.GroupLabel
		className={cn('text-muted-foreground px-2 py-1.5 text-xs', className)}
		data-slot="combobox-label"
		{...props}
	/>
);

const ComboboxCollection = ({ ...props }: ComboboxPrimitive.Collection.Props) => (
	<ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
);

const ComboboxEmpty = ({ className, ...props }: ComboboxPrimitive.Empty.Props) => (
	<ComboboxPrimitive.Empty
		className={cn(
			'text-muted-foreground hidden w-full justify-center py-2 text-center text-sm group-data-empty/combobox-content:flex',
			className,
		)}
		data-slot="combobox-empty"
		{...props}
	/>
);

const ComboboxSeparator = ({ className, ...props }: ComboboxPrimitive.Separator.Props) => (
	<ComboboxPrimitive.Separator
		className={cn('bg-border -mx-1 my-1 h-px', className)}
		data-slot="combobox-separator"
		{...props}
	/>
);

const ComboboxChips = ({
	className,
	...props
}: ComboboxPrimitive.Chips.Props & ComponentPropsWithRef<typeof ComboboxPrimitive.Chips>) => (
	<ComboboxPrimitive.Chips
		className={cn(
			'dark:bg-input/30 border-input focus-within:border-ring focus-within:ring-ring/50 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive dark:has-aria-invalid:border-destructive/50 flex min-h-8 flex-wrap items-center gap-1 rounded-lg border bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:ring-3 has-aria-invalid:ring-3 has-data-[slot=combobox-chip]:px-1',
			className,
		)}
		data-slot="combobox-chips"
		{...props}
	/>
);

const ComboboxChip = ({
	children,
	className,
	showRemove = true,
	...props
}: ComboboxPrimitive.Chip.Props & {
	showRemove?: boolean;
}) => (
	<ComboboxPrimitive.Chip
		className={cn(
			'bg-muted text-foreground flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap has-data-[slot=combobox-chip-remove]:pr-0 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50',
			className,
		)}
		data-slot="combobox-chip"
		{...props}
	>
		{children}
		{showRemove && (
			<ComboboxPrimitive.ChipRemove
				className="-ml-1 opacity-50 hover:opacity-100"
				data-slot="combobox-chip-remove"
				render={<Button size="icon-xs" variant="ghost" />}
			>
				<XIcon className="pointer-events-none" />
			</ComboboxPrimitive.ChipRemove>
		)}
	</ComboboxPrimitive.Chip>
);

const ComboboxChipsInput = ({ className, ...props }: ComboboxPrimitive.Input.Props) => (
	<ComboboxPrimitive.Input
		className={cn('min-w-16 flex-1 outline-none', className)}
		data-slot="combobox-chip-input"
		{...props}
	/>
);

function useComboboxAnchor() {
	return useRef<HTMLDivElement | null>(null);
}

export {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxCollection,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxLabel,
	ComboboxList,
	ComboboxSeparator,
	ComboboxTrigger,
	ComboboxValue,
	useComboboxAnchor,
};
