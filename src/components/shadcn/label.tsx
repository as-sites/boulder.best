'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const Label = ({ className, ...props }: ComponentProps<'label'>) => (
	<label
		className={cn(
			'gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed',
			className,
		)}
		data-slot="label"
		{...props}
	/>
);

export { Label };
