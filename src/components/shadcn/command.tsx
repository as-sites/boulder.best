'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { CheckIcon, SearchIcon } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/shadcn/dialog';
import { InputGroup, InputGroupAddon } from '@/components/shadcn/input-group';
import { cn } from '@/lib/utils';

const Command = ({ className, ...props }: ComponentProps<typeof CommandPrimitive>) => (
	<CommandPrimitive
		className={cn(
			'bg-popover text-popover-foreground rounded-xl! p-1 flex size-full flex-col overflow-hidden',
			className,
		)}
		data-slot="command"
		{...props}
	/>
);

const CommandDialog = ({
	children,
	className,
	description = 'Search for a command to run...',
	showCloseButton = false,
	title = 'Command Palette',
	...props
}: Omit<ComponentProps<typeof Dialog>, 'children'> & {
	children: ReactNode;
	className?: string;
	description?: string;
	showCloseButton?: boolean;
	title?: string;
}) => (
	<Dialog {...props}>
		<DialogHeader className="sr-only">
			<DialogTitle>{title}</DialogTitle>
			<DialogDescription>{description}</DialogDescription>
		</DialogHeader>
		<DialogContent
			className={cn('rounded-xl! top-1/3 translate-y-0 overflow-hidden p-0', className)}
			showCloseButton={showCloseButton}
		>
			{children}
		</DialogContent>
	</Dialog>
);

const CommandInput = ({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) => (
	<div className="p-1 pb-0" data-slot="command-input-wrapper">
		<InputGroup className="bg-input/30 border-input/30 h-8! rounded-lg! shadow-none! *:data-[slot=input-group-addon]:pl-2!">
			<CommandPrimitive.Input
				className={cn(
					'w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
					className,
				)}
				data-slot="command-input"
				{...props}
			/>
			<InputGroupAddon>
				<SearchIcon className="size-4 shrink-0 opacity-50" />
			</InputGroupAddon>
		</InputGroup>
	</div>
);

const CommandList = ({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) => (
	<CommandPrimitive.List
		className={cn(
			'no-scrollbar max-h-72 scroll-py-1 outline-none overflow-x-hidden overflow-y-auto',
			className,
		)}
		data-slot="command-list"
		{...props}
	/>
);

const CommandEmpty = ({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) => (
	<CommandPrimitive.Empty
		className={cn('py-6 text-center text-sm', className)}
		data-slot="command-empty"
		{...props}
	/>
);

const CommandGroup = ({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) => (
	<CommandPrimitive.Group
		className={cn(
			'text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium',
			className,
		)}
		data-slot="command-group"
		{...props}
	/>
);

const CommandSeparator = ({
	className,
	...props
}: ComponentProps<typeof CommandPrimitive.Separator>) => (
	<CommandPrimitive.Separator
		className={cn('bg-border -mx-1 h-px', className)}
		data-slot="command-separator"
		{...props}
	/>
);

const CommandItem = ({
	children,
	className,
	...props
}: ComponentProps<typeof CommandPrimitive.Item>) => (
	<CommandPrimitive.Item
		className={cn(
			"data-selected:bg-muted data-selected:text-foreground data-selected:*:[svg]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! [&_svg:not([class*='size-'])]:size-4 group/command-item data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
			className,
		)}
		data-slot="command-item"
		{...props}
	>
		{children}
		<CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
	</CommandPrimitive.Item>
);

const CommandShortcut = ({ className, ...props }: ComponentProps<'span'>) => (
	<span
		className={cn(
			'text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest',
			className,
		)}
		data-slot="command-shortcut"
		{...props}
	/>
);

export {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
};
