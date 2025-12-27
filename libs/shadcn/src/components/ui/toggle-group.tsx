'use client';

import type { VariantProps } from 'class-variance-authority';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import {
	type ComponentPropsWithoutRef,
	createContext,
	type ElementRef,
	forwardRef,
	useContext,
} from 'react';

import { cn } from '../../lib/utils';
import { toggleVariants } from './toggle';

const ToggleGroupContext = createContext<VariantProps<typeof toggleVariants>>({
	size: 'default',
	variant: 'default',
});

const ToggleGroup = forwardRef<
	ElementRef<typeof ToggleGroupPrimitive.Root>,
	ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ children, className, size, variant, ...props }, ref) => (
	<ToggleGroupPrimitive.Root
		className={cn('flex items-center justify-center gap-1', className)}
		ref={ref}
		{...props}
	>
		<ToggleGroupContext.Provider value={{ size, variant }}>
			{children}
		</ToggleGroupContext.Provider>
	</ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = forwardRef<
	ElementRef<typeof ToggleGroupPrimitive.Item>,
	ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>
>(({ children, className, size, variant, ...props }, ref) => {
	const context = useContext(ToggleGroupContext);

	return (
		<ToggleGroupPrimitive.Item
			className={cn(
				toggleVariants({
					size: context.size || size,
					variant: context.variant || variant,
				}),
				className,
			)}
			ref={ref}
			{...props}
		>
			{children}
		</ToggleGroupPrimitive.Item>
	);
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
