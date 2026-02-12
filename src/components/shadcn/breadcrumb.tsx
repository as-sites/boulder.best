import type { ComponentProps } from 'react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const Breadcrumb = ({ className, ...props }: ComponentProps<'nav'>) => (
	<nav aria-label="breadcrumb" className={cn(className)} data-slot="breadcrumb" {...props} />
);

const BreadcrumbList = ({ className, ...props }: ComponentProps<'ol'>) => (
	<ol
		className={cn(
			'text-muted-foreground gap-1.5 text-sm flex flex-wrap items-center wrap-break-word',
			className,
		)}
		data-slot="breadcrumb-list"
		{...props}
	/>
);

const BreadcrumbItem = ({ className, ...props }: ComponentProps<'li'>) => (
	<li
		className={cn('gap-1 inline-flex items-center', className)}
		data-slot="breadcrumb-item"
		{...props}
	/>
);

function BreadcrumbLink({ className, render, ...props }: useRender.ComponentProps<'a'>) {
	return useRender({
		defaultTagName: 'a',
		props: mergeProps<'a'>(
			{
				className: cn('hover:text-foreground transition-colors', className),
			},
			props,
		),
		render,
		state: {
			slot: 'breadcrumb-link',
		},
	});
}

const BreadcrumbPage = ({ className, ...props }: ComponentProps<'span'>) => (
	<span
		aria-current="page"
		aria-disabled="true"
		className={cn('text-foreground font-normal', className)}
		data-slot="breadcrumb-page"
		role="link"
		{...props}
	/>
);

const BreadcrumbSeparator = ({ children, className, ...props }: ComponentProps<'li'>) => (
	<li
		aria-hidden="true"
		className={cn('[&>svg]:size-3.5', className)}
		data-slot="breadcrumb-separator"
		role="presentation"
		{...props}
	>
		{children ?? <ChevronRightIcon />}
	</li>
);

const BreadcrumbEllipsis = ({ className, ...props }: ComponentProps<'span'>) => (
	<span
		aria-hidden="true"
		className={cn('size-5 [&>svg]:size-4 flex items-center justify-center', className)}
		data-slot="breadcrumb-ellipsis"
		role="presentation"
		{...props}
	>
		<MoreHorizontalIcon />
		<span className="sr-only">More</span>
	</span>
);

export {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
};
