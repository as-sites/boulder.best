'use client';

import type { ComponentProps } from 'react';
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

const AlertDialog = ({ ...props }: AlertDialogPrimitive.Root.Props) => (
	<AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
);

const AlertDialogTrigger = ({ ...props }: AlertDialogPrimitive.Trigger.Props) => (
	<AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
);

const AlertDialogPortal = ({ ...props }: AlertDialogPrimitive.Portal.Props) => (
	<AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
);

const AlertDialogOverlay = ({ className, ...props }: AlertDialogPrimitive.Backdrop.Props) => (
	<AlertDialogPrimitive.Backdrop
		className={cn(
			'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50',
			className,
		)}
		data-slot="alert-dialog-overlay"
		{...props}
	/>
);

const AlertDialogContent = ({
	className,
	size = 'default',
	...props
}: AlertDialogPrimitive.Popup.Props & {
	size?: 'default' | 'sm';
}) => (
	<AlertDialogPortal>
		<AlertDialogOverlay />
		<AlertDialogPrimitive.Popup
			className={cn(
				'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 bg-background ring-foreground/10 gap-4 rounded-xl p-4 ring-1 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 outline-none',
				className,
			)}
			data-size={size}
			data-slot="alert-dialog-content"
			{...props}
		/>
	</AlertDialogPortal>
);

const AlertDialogHeader = ({ className, ...props }: ComponentProps<'div'>) => (
	<div
		className={cn(
			'grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]',
			className,
		)}
		data-slot="alert-dialog-header"
		{...props}
	/>
);

const AlertDialogFooter = ({ className, ...props }: ComponentProps<'div'>) => (
	<div
		className={cn(
			'bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end',
			className,
		)}
		data-slot="alert-dialog-footer"
		{...props}
	/>
);

const AlertDialogMedia = ({ className, ...props }: ComponentProps<'div'>) => (
	<div
		className={cn(
			"bg-muted mb-2 inline-flex size-10 items-center justify-center rounded-md sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-6",
			className,
		)}
		data-slot="alert-dialog-media"
		{...props}
	/>
);

const AlertDialogTitle = ({
	className,
	...props
}: ComponentProps<typeof AlertDialogPrimitive.Title>) => (
	<AlertDialogPrimitive.Title
		className={cn(
			'text-base font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2',
			className,
		)}
		data-slot="alert-dialog-title"
		{...props}
	/>
);

const AlertDialogDescription = ({
	className,
	...props
}: ComponentProps<typeof AlertDialogPrimitive.Description>) => (
	<AlertDialogPrimitive.Description
		className={cn(
			'text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3',
			className,
		)}
		data-slot="alert-dialog-description"
		{...props}
	/>
);

const AlertDialogAction = ({ className, ...props }: ComponentProps<typeof Button>) => (
	<Button className={cn(className)} data-slot="alert-dialog-action" {...props} />
);

const AlertDialogCancel = ({
	className,
	size = 'default',
	variant = 'outline',
	...props
}: AlertDialogPrimitive.Close.Props & Pick<ComponentProps<typeof Button>, 'size' | 'variant'>) => (
	<AlertDialogPrimitive.Close
		className={cn(className)}
		data-slot="alert-dialog-cancel"
		render={<Button size={size} variant={variant} />}
		{...props}
	/>
);

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger,
};
