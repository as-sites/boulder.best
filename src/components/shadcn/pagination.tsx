import type { ComponentProps } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

const Pagination = ({ className, ...props }: ComponentProps<'nav'>) => (
	<nav
		aria-label="pagination"
		className={cn('mx-auto flex w-full justify-center', className)}
		data-slot="pagination"
		role="navigation"
		{...props}
	/>
);

const PaginationContent = ({ className, ...props }: ComponentProps<'ul'>) => (
	<ul
		className={cn('gap-0.5 flex items-center', className)}
		data-slot="pagination-content"
		{...props}
	/>
);

const PaginationItem = ({ ...props }: ComponentProps<'li'>) => (
	<li data-slot="pagination-item" {...props} />
);

type PaginationLinkProps = ComponentProps<'a'> &
	Pick<ComponentProps<typeof Button>, 'size'> & {
		isActive?: boolean;
	};

const PaginationLink = ({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) => (
	<Button
		className={cn(className)}
		nativeButton={false}
		render={
			<a
				aria-current={isActive ? 'page' : undefined}
				data-active={isActive}
				data-slot="pagination-link"
				{...props}
			/>
		}
		size={size}
		variant={isActive ? 'outline' : 'ghost'}
	/>
);

const PaginationPrevious = ({
	className,
	text = 'Previous',
	...props
}: ComponentProps<typeof PaginationLink> & { text?: string }) => (
	<PaginationLink
		aria-label="Go to previous page"
		className={cn('pl-1.5!', className)}
		size="default"
		{...props}
	>
		<ChevronLeftIcon data-icon="inline-start" />
		<span className="hidden sm:block">{text}</span>
	</PaginationLink>
);

const PaginationNext = ({
	className,
	text = 'Next',
	...props
}: ComponentProps<typeof PaginationLink> & { text?: string }) => (
	<PaginationLink
		aria-label="Go to next page"
		className={cn('pr-1.5!', className)}
		size="default"
		{...props}
	>
		<span className="hidden sm:block">{text}</span>
		<ChevronRightIcon data-icon="inline-end" />
	</PaginationLink>
);

const PaginationEllipsis = ({ className, ...props }: ComponentProps<'span'>) => (
	<span
		aria-hidden
		className={cn(
			"size-8 [&_svg:not([class*='size-'])]:size-4 flex items-center justify-center",
			className,
		)}
		data-slot="pagination-ellipsis"
		{...props}
	>
		<MoreHorizontalIcon />
		<span className="sr-only">More pages</span>
	</span>
);

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
};
