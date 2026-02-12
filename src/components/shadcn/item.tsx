import type { ComponentProps } from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { Separator } from '@/components/shadcn/separator';
import { cn } from '@/lib/utils';

const ItemGroup = ({ className, ...props }: ComponentProps<'div'>) => (
	<div
		className={cn(
			'gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2 group/item-group flex w-full flex-col',
			className,
		)}
		data-slot="item-group"
		role="list"
		{...props}
	/>
);

const ItemSeparator = ({ className, ...props }: ComponentProps<typeof Separator>) => (
	<Separator
		className={cn('my-2', className)}
		data-slot="item-separator"
		orientation="horizontal"
		{...props}
	/>
);

const itemVariants = cva(
	'[a]:hover:bg-muted rounded-lg border text-sm w-full group/item focus-visible:border-ring focus-visible:ring-ring/50 flex items-center flex-wrap outline-none transition-colors duration-100 focus-visible:ring-[3px] [a]:transition-colors',
	{
		defaultVariants: {
			size: 'default',
			variant: 'default',
		},
		variants: {
			size: {
				default: 'gap-2.5 px-3 py-2.5',
				sm: 'gap-2.5 px-3 py-2.5',
				xs: 'gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0',
			},
			variant: {
				default: 'border-transparent',
				muted: 'bg-muted/50 border-transparent',
				outline: 'border-border',
			},
		},
	},
);

function Item({
	className,
	render,
	size = 'default',
	variant = 'default',
	...props
}: useRender.ComponentProps<'div'> & VariantProps<typeof itemVariants>) {
	return useRender({
		defaultTagName: 'div',
		props: mergeProps<'div'>(
			{
				className: cn(itemVariants({ className, size, variant })),
			},
			props,
		),
		render,
		state: {
			size,
			slot: 'item',
			variant,
		},
	});
}

const itemMediaVariants = cva(
	'gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start flex shrink-0 items-center justify-center [&_svg]:pointer-events-none',
	{
		defaultVariants: {
			variant: 'default',
		},
		variants: {
			variant: {
				default: 'bg-transparent',
				icon: "[&_svg:not([class*='size-'])]:size-4",
				image: 'size-10 overflow-hidden rounded-sm group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 [&_img]:size-full [&_img]:object-cover',
			},
		},
	},
);

const ItemMedia = ({
	className,
	variant = 'default',
	...props
}: ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) => (
	<div
		className={cn(itemMediaVariants({ className, variant }))}
		data-slot="item-media"
		data-variant={variant}
		{...props}
	/>
);

const ItemContent = ({ className, ...props }: ComponentProps<'div'>) => (
	<div
		className={cn(
			'gap-1 group-data-[size=xs]/item:gap-0 flex flex-1 flex-col [&+[data-slot=item-content]]:flex-none',
			className,
		)}
		data-slot="item-content"
		{...props}
	/>
);

const ItemTitle = ({ className, ...props }: ComponentProps<'div'>) => (
	<div
		className={cn(
			'gap-2 text-sm leading-snug font-medium underline-offset-4 line-clamp-1 flex w-fit items-center',
			className,
		)}
		data-slot="item-title"
		{...props}
	/>
);

const ItemDescription = ({ className, ...props }: ComponentProps<'p'>) => (
	<p
		className={cn(
			'text-muted-foreground text-left text-sm leading-normal group-data-[size=xs]/item:text-xs [&>a:hover]:text-primary line-clamp-2 font-normal [&>a]:underline [&>a]:underline-offset-4',
			className,
		)}
		data-slot="item-description"
		{...props}
	/>
);

const ItemActions = ({ className, ...props }: ComponentProps<'div'>) => (
	<div className={cn('gap-2 flex items-center', className)} data-slot="item-actions" {...props} />
);

const ItemHeader = ({ className, ...props }: ComponentProps<'div'>) => (
	<div
		className={cn('gap-2 flex basis-full items-center justify-between', className)}
		data-slot="item-header"
		{...props}
	/>
);

const ItemFooter = ({ className, ...props }: ComponentProps<'div'>) => (
	<div
		className={cn('gap-2 flex basis-full items-center justify-between', className)}
		data-slot="item-footer"
		{...props}
	/>
);

export {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemFooter,
	ItemGroup,
	ItemHeader,
	ItemMedia,
	ItemSeparator,
	ItemTitle,
};
