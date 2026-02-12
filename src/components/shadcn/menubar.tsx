'use client';

import type { ComponentProps } from 'react';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import { Menubar as MenubarPrimitive } from '@base-ui/react/menubar';
import { CheckIcon } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { cn } from '@/lib/utils';

const Menubar = ({ className, ...props }: MenubarPrimitive.Props) => (
	<MenubarPrimitive
		className={cn(
			'bg-background h-8 gap-0.5 rounded-lg border p-[3px] flex items-center',
			className,
		)}
		data-slot="menubar"
		{...props}
	/>
);

const MenubarMenu = ({ ...props }: ComponentProps<typeof DropdownMenu>) => (
	<DropdownMenu data-slot="menubar-menu" {...props} />
);

const MenubarGroup = ({ ...props }: ComponentProps<typeof DropdownMenuGroup>) => (
	<DropdownMenuGroup data-slot="menubar-group" {...props} />
);

const MenubarPortal = ({ ...props }: ComponentProps<typeof DropdownMenuPortal>) => (
	<DropdownMenuPortal data-slot="menubar-portal" {...props} />
);

const MenubarTrigger = ({ className, ...props }: ComponentProps<typeof DropdownMenuTrigger>) => (
	<DropdownMenuTrigger
		className={cn(
			'hover:bg-muted aria-expanded:bg-muted rounded-sm px-1.5 py-[2px] text-sm font-medium flex items-center outline-hidden select-none',
			className,
		)}
		data-slot="menubar-trigger"
		{...props}
	/>
);

const MenubarContent = ({
	align = 'start',
	alignOffset = -4,
	className,
	sideOffset = 8,
	...props
}: ComponentProps<typeof DropdownMenuContent>) => (
	<DropdownMenuContent
		align={align}
		alignOffset={alignOffset}
		className={cn(
			'bg-popover text-popover-foreground data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 min-w-36 rounded-lg p-1 shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2',
			className,
		)}
		data-slot="menubar-content"
		sideOffset={sideOffset}
		{...props}
	/>
);

const MenubarItem = ({
	className,
	inset,
	variant = 'default',
	...props
}: ComponentProps<typeof DropdownMenuItem>) => (
	<DropdownMenuItem
		className={cn(
			"focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive! not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-disabled:opacity-50 data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 group/menubar-item",
			className,
		)}
		data-inset={inset}
		data-slot="menubar-item"
		data-variant={variant}
		{...props}
	/>
);

const MenubarCheckboxItem = ({
	checked,
	children,
	className,
	inset,
	...props
}: MenuPrimitive.CheckboxItem.Props & {
	inset?: boolean;
}) => (
	<MenuPrimitive.CheckboxItem
		checked={checked}
		className={cn(
			'focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-1.5 pl-7 text-sm data-inset:pl-7 relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
			className,
		)}
		data-inset={inset}
		data-slot="menubar-checkbox-item"
		{...props}
	>
		<span className="left-1.5 size-4 [&_svg:not([class*='size-'])]:size-4 pointer-events-none absolute flex items-center justify-center">
			<MenuPrimitive.CheckboxItemIndicator>
				<CheckIcon />
			</MenuPrimitive.CheckboxItemIndicator>
		</span>
		{children}
	</MenuPrimitive.CheckboxItem>
);

const MenubarRadioGroup = ({ ...props }: ComponentProps<typeof DropdownMenuRadioGroup>) => (
	<DropdownMenuRadioGroup data-slot="menubar-radio-group" {...props} />
);

const MenubarRadioItem = ({
	children,
	className,
	inset,
	...props
}: MenuPrimitive.RadioItem.Props & {
	inset?: boolean;
}) => (
	<MenuPrimitive.RadioItem
		className={cn(
			"focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-1.5 pl-7 text-sm data-disabled:opacity-50 data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
			className,
		)}
		data-inset={inset}
		data-slot="menubar-radio-item"
		{...props}
	>
		<span className="left-1.5 size-4 [&_svg:not([class*='size-'])]:size-4 pointer-events-none absolute flex items-center justify-center">
			<MenuPrimitive.RadioItemIndicator>
				<CheckIcon />
			</MenuPrimitive.RadioItemIndicator>
		</span>
		{children}
	</MenuPrimitive.RadioItem>
);

const MenubarLabel = ({
	className,
	inset,
	...props
}: ComponentProps<typeof DropdownMenuLabel> & {
	inset?: boolean;
}) => (
	<DropdownMenuLabel
		className={cn('px-1.5 py-1 text-sm font-medium data-inset:pl-7', className)}
		data-inset={inset}
		data-slot="menubar-label"
		{...props}
	/>
);

const MenubarSeparator = ({
	className,
	...props
}: ComponentProps<typeof DropdownMenuSeparator>) => (
	<DropdownMenuSeparator
		className={cn('bg-border -mx-1 my-1 h-px', className)}
		data-slot="menubar-separator"
		{...props}
	/>
);

const MenubarShortcut = ({ className, ...props }: ComponentProps<typeof DropdownMenuShortcut>) => (
	<DropdownMenuShortcut
		className={cn(
			'text-muted-foreground group-focus/menubar-item:text-accent-foreground text-xs tracking-widest ml-auto',
			className,
		)}
		data-slot="menubar-shortcut"
		{...props}
	/>
);

const MenubarSub = ({ ...props }: ComponentProps<typeof DropdownMenuSub>) => (
	<DropdownMenuSub data-slot="menubar-sub" {...props} />
);

const MenubarSubTrigger = ({
	className,
	inset,
	...props
}: ComponentProps<typeof DropdownMenuSubTrigger> & {
	inset?: boolean;
}) => (
	<DropdownMenuSubTrigger
		className={cn(
			"focus:bg-accent focus:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4",
			className,
		)}
		data-inset={inset}
		data-slot="menubar-sub-trigger"
		{...props}
	/>
);

const MenubarSubContent = ({
	className,
	...props
}: ComponentProps<typeof DropdownMenuSubContent>) => (
	<DropdownMenuSubContent
		className={cn(
			'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 min-w-32 rounded-lg p-1 shadow-lg ring-1 duration-100',
			className,
		)}
		data-slot="menubar-sub-content"
		{...props}
	/>
);

export {
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarGroup,
	MenubarItem,
	MenubarLabel,
	MenubarMenu,
	MenubarPortal,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
};
