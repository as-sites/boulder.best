'use client';

import type { ComponentProps } from 'react';
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import { cn } from '@/lib/utils';

const Avatar = ({
	className,
	size = 'default',
	...props
}: AvatarPrimitive.Root.Props & {
	size?: 'default' | 'lg' | 'sm';
}) => (
	<AvatarPrimitive.Root
		className={cn(
			'size-8 rounded-full after:rounded-full data-[size=lg]:size-10 data-[size=sm]:size-6 after:border-border group/avatar relative flex shrink-0 select-none after:absolute after:inset-0 after:border after:mix-blend-darken dark:after:mix-blend-lighten',
			className,
		)}
		data-size={size}
		data-slot="avatar"
		{...props}
	/>
);

const AvatarImage = ({ className, ...props }: AvatarPrimitive.Image.Props) => (
	<AvatarPrimitive.Image
		className={cn('rounded-full aspect-square size-full object-cover', className)}
		data-slot="avatar-image"
		{...props}
	/>
);

const AvatarFallback = ({ className, ...props }: AvatarPrimitive.Fallback.Props) => (
	<AvatarPrimitive.Fallback
		className={cn(
			'bg-muted text-muted-foreground rounded-full flex size-full items-center justify-center text-sm group-data-[size=sm]/avatar:text-xs',
			className,
		)}
		data-slot="avatar-fallback"
		{...props}
	/>
);

const AvatarBadge = ({ className, ...props }: ComponentProps<'span'>) => (
	<span
		className={cn(
			'bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-blend-color ring-2 select-none',
			'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
			'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
			'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
			className,
		)}
		data-slot="avatar-badge"
		{...props}
	/>
);

const AvatarGroup = ({ className, ...props }: ComponentProps<'div'>) => (
	<div
		className={cn(
			'*:data-[slot=avatar]:ring-background group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2',
			className,
		)}
		data-slot="avatar-group"
		{...props}
	/>
);

const AvatarGroupCount = ({ className, ...props }: ComponentProps<'div'>) => (
	<div
		className={cn(
			'bg-muted text-muted-foreground size-8 rounded-full text-sm group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3 ring-background relative flex shrink-0 items-center justify-center ring-2',
			className,
		)}
		data-slot="avatar-group-count"
		{...props}
	/>
);

export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage };
