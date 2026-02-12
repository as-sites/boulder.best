'use client';

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const Accordion = ({ className, ...props }: AccordionPrimitive.Root.Props) => (
	<AccordionPrimitive.Root
		className={cn('flex w-full flex-col', className)}
		data-slot="accordion"
		{...props}
	/>
);

const AccordionItem = ({ className, ...props }: AccordionPrimitive.Item.Props) => (
	<AccordionPrimitive.Item
		className={cn('not-last:border-b', className)}
		data-slot="accordion-item"
		{...props}
	/>
);

const AccordionTrigger = ({ children, className, ...props }: AccordionPrimitive.Trigger.Props) => (
	<AccordionPrimitive.Header className="flex">
		<AccordionPrimitive.Trigger
			className={cn(
				'focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:after:border-ring **:data-[slot=accordion-trigger-icon]:text-muted-foreground rounded-lg py-2.5 text-left text-sm font-medium hover:underline focus-visible:ring-3 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-all outline-none disabled:pointer-events-none disabled:opacity-50',
				className,
			)}
			data-slot="accordion-trigger"
			{...props}
		>
			{children}
			<ChevronDownIcon
				className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
				data-slot="accordion-trigger-icon"
			/>
			<ChevronUpIcon
				className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
				data-slot="accordion-trigger-icon"
			/>
		</AccordionPrimitive.Trigger>
	</AccordionPrimitive.Header>
);

const AccordionContent = ({ children, className, ...props }: AccordionPrimitive.Panel.Props) => (
	<AccordionPrimitive.Panel
		className="data-open:animate-accordion-down data-closed:animate-accordion-up text-sm overflow-hidden"
		data-slot="accordion-content"
		{...props}
	>
		<div
			className={cn(
				'pt-0 pb-2.5 [&_a]:hover:text-foreground h-(--accordion-panel-height) data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4',
				className,
			)}
		>
			{children}
		</div>
	</AccordionPrimitive.Panel>
);

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
