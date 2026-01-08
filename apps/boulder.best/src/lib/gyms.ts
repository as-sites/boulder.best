import { z } from 'zod';

export const typedKeys = <T extends object>(obj: T): Array<keyof T> =>
	Object.keys(obj) as Array<keyof T>;

export interface Gym {
	difficulties: string[];
	locations: string[];
	name: string;
}

interface Gyms {
	[gym: string]: Gym;
}

export const gyms = {
	blochaus: {
		difficulties: ['Blue', 'Red', 'Purple', 'Black', 'Yellow', 'White', 'Joker'],
		locations: ['Leichhardt', 'Marrickville'],
		name: 'Blochaus',
	},
	nineDegrees: {
		difficulties: [
			'Yellow (VE)',
			'Green (V0-)',
			'Blue (V0-V1)',
			'Teal (V1-V2)',
			'Pink (V2-V4)',
			'Orange (V4-V6)',
			'Purple (V5-V8)',
			'White (V7+)',
			'Black (Mixed)',
		],
		locations: ['Alexandria', 'Lane Cove', 'Waterloo', 'Chatswood', 'Parramatta'],
		name: '9 Degrees',
	},

	nomad: {
		difficulties: [
			'Blue',
			'Yellow',
			'Orange',
			'Green',
			'Purple',
			'Black',
			'Red',
			'Pink',
			'White/Wildcard',
		],
		locations: ['Annandale', 'Gladesville'],
		name: 'Nomad',
	},
} satisfies Gyms;

export const climbSchema = z
	.object({
		attempts: z
			.number({ coerce: true })
			.int()
			.min(1, 'At least 1 attempt required')
			.max(500, 'Too many attempts'),
		climbedAt: z.date().optional(),
		climbName: z.string().min(1, 'Climber name is required'),
		completed: z.boolean(),
		difficulty: z.string().min(1, 'Please select a difficulty'),
		gym: z.enum(['blochaus', 'nineDegrees', 'nomad'], {
			errorMap: () => ({ message: 'Please select a gym' }),
		}),
		location: z.string().min(1, 'Please select a location'),
		notes: z.string().optional(),
	})
	.refine((data) => gyms[data.gym].locations.includes(data.location), {
		message: 'Invalid location for selected gym',
		path: ['location'],
	})
	.refine((data) => gyms[data.gym].difficulties.includes(data.difficulty), {
		message: 'Invalid difficulty for selected gym',
		path: ['difficulty'],
	});

export type Climb = z.infer<typeof climbSchema>;
