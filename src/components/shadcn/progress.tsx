'use client';

import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cn } from '@/lib/utils';

const Progress = ({ children, className, value, ...props }: ProgressPrimitive.Root.Props) => (
	<ProgressPrimitive.Root
		className={cn('flex flex-wrap gap-3', className)}
		data-slot="progress"
		value={value}
		{...props}
	>
		{children}
		<ProgressTrack>
			<ProgressIndicator />
		</ProgressTrack>
	</ProgressPrimitive.Root>
);

const ProgressTrack = ({ className, ...props }: ProgressPrimitive.Track.Props) => (
	<ProgressPrimitive.Track
		className={cn(
			'bg-muted h-1 rounded-full relative flex w-full items-center overflow-x-hidden',
			className,
		)}
		data-slot="progress-track"
		{...props}
	/>
);

const ProgressIndicator = ({ className, ...props }: ProgressPrimitive.Indicator.Props) => (
	<ProgressPrimitive.Indicator
		className={cn('bg-primary h-full transition-all', className)}
		data-slot="progress-indicator"
		{...props}
	/>
);

const ProgressLabel = ({ className, ...props }: ProgressPrimitive.Label.Props) => (
	<ProgressPrimitive.Label
		className={cn('text-sm font-medium', className)}
		data-slot="progress-label"
		{...props}
	/>
);

const ProgressValue = ({ className, ...props }: ProgressPrimitive.Value.Props) => (
	<ProgressPrimitive.Value
		className={cn('text-muted-foreground ml-auto text-sm tabular-nums', className)}
		data-slot="progress-value"
		{...props}
	/>
);

export { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue };
