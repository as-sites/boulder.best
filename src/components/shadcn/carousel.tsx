'use client';

import type { ComponentProps, KeyboardEvent } from 'react';
import useEmblaCarousel, { type UseEmblaCarouselType } from 'embla-carousel-react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

type CarouselApi = UseEmblaCarouselType[1];
type CarouselContextProps = CarouselProps & {
	api: ReturnType<typeof useEmblaCarousel>[1];
	canScrollNext: boolean;
	canScrollPrev: boolean;
	carouselRef: ReturnType<typeof useEmblaCarousel>[0];
	scrollNext: () => void;
	scrollPrev: () => void;
};
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

interface CarouselProps {
	opts?: CarouselOptions;
	orientation?: 'horizontal' | 'vertical';
	plugins?: CarouselPlugin;
	setApi?: (api: CarouselApi) => void;
}

type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;

const CarouselContext = createContext<CarouselContextProps | null>(null);

const Carousel = ({
	children,
	className,
	opts,
	orientation = 'horizontal',
	plugins,
	setApi,
	...props
}: CarouselProps & ComponentProps<'div'>) => {
	const [carouselRef, api] = useEmblaCarousel(
		{
			...opts,
			axis: orientation === 'horizontal' ? 'x' : 'y',
		},
		plugins,
	);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	const onSelect = useCallback((api: CarouselApi) => {
		if (!api) return;
		setCanScrollPrev(api.canScrollPrev());
		setCanScrollNext(api.canScrollNext());
	}, []);

	const scrollPrev = useCallback(() => {
		api?.scrollPrev();
	}, [api]);

	const scrollNext = useCallback(() => {
		api?.scrollNext();
	}, [api]);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				scrollPrev();
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				scrollNext();
			}
		},
		[scrollPrev, scrollNext],
	);

	useEffect(() => {
		if (!api || !setApi) return;
		setApi(api);
	}, [api, setApi]);

	useEffect(() => {
		if (!api) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		onSelect(api);
		api.on('reInit', onSelect);
		api.on('select', onSelect);

		return () => {
			api?.off('select', onSelect);
		};
	}, [api, onSelect]);

	return (
		<CarouselContext.Provider
			value={{
				api,
				canScrollNext,
				canScrollPrev,
				carouselRef,
				opts,
				orientation: orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
				scrollNext,
				scrollPrev,
			}}
		>
			<div
				aria-roledescription="carousel"
				className={cn('relative', className)}
				data-slot="carousel"
				onKeyDownCapture={handleKeyDown}
				role="region"
				{...props}
			>
				{children}
			</div>
		</CarouselContext.Provider>
	);
};

const CarouselContent = ({ className, ...props }: ComponentProps<'div'>) => {
	const { carouselRef, orientation } = useCarousel();

	return (
		<div className="overflow-hidden" data-slot="carousel-content" ref={carouselRef}>
			<div
				className={cn(
					'flex',
					orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
					className,
				)}
				{...props}
			/>
		</div>
	);
};

const CarouselItem = ({ className, ...props }: ComponentProps<'div'>) => {
	const { orientation } = useCarousel();

	return (
		<div
			aria-roledescription="slide"
			className={cn(
				'min-w-0 shrink-0 grow-0 basis-full',
				orientation === 'horizontal' ? 'pl-4' : 'pt-4',
				className,
			)}
			data-slot="carousel-item"
			role="group"
			{...props}
		/>
	);
};

const CarouselNext = ({
	className,
	size = 'icon-sm',
	variant = 'outline',
	...props
}: ComponentProps<typeof Button>) => {
	const { canScrollNext, orientation, scrollNext } = useCarousel();

	return (
		<Button
			className={cn(
				'rounded-full absolute touch-manipulation',
				orientation === 'horizontal'
					? 'top-1/2 -right-12 -translate-y-1/2'
					: '-bottom-12 left-1/2 -translate-x-1/2 rotate-90',
				className,
			)}
			data-slot="carousel-next"
			disabled={!canScrollNext}
			onClick={scrollNext}
			size={size}
			variant={variant}
			{...props}
		>
			<ChevronRightIcon />
			<span className="sr-only">Next slide</span>
		</Button>
	);
};

const CarouselPrevious = ({
	className,
	size = 'icon-sm',
	variant = 'outline',
	...props
}: ComponentProps<typeof Button>) => {
	const { canScrollPrev, orientation, scrollPrev } = useCarousel();

	return (
		<Button
			className={cn(
				'rounded-full absolute touch-manipulation',
				orientation === 'horizontal'
					? 'top-1/2 -left-12 -translate-y-1/2'
					: '-top-12 left-1/2 -translate-x-1/2 rotate-90',
				className,
			)}
			data-slot="carousel-previous"
			disabled={!canScrollPrev}
			onClick={scrollPrev}
			size={size}
			variant={variant}
			{...props}
		>
			<ChevronLeftIcon />
			<span className="sr-only">Previous slide</span>
		</Button>
	);
};

function useCarousel() {
	const context = useContext(CarouselContext);

	if (!context) {
		throw new Error('useCarousel must be used within a <Carousel />');
	}

	return context;
}

export {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	useCarousel,
};
