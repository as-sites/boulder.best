'use client';

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@boulder.best/shadcn/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Trash2 } from 'lucide-react';
import { useEffect, useReducer } from 'react';
import { useForm } from 'react-hook-form';

import { type Climb, climbSchema, gyms, typedKeys } from '../../lib/gyms';

const STORAGE_KEY_FORM = 'climbing-form-state';
const STORAGE_KEY_CLIMBS = 'climbing-climbs';

// Reducer for managing climbs list without useState
type ClimbsAction =
	| { payload: Climb; type: 'ADD' }
	| { payload: Climb[]; type: 'SET' }
	| { payload: number; type: 'REMOVE' };

export default function TrackPage() {
	const [climbs, dispatchClimbs] = useReducer(climbsReducer, []);

	const form = useForm<Climb>({
		defaultValues: {
			attempts: 1,
			climbName: '',
			completed: false,
			difficulty: undefined,
			gym: undefined,
			location: undefined,
			notes: '',
		},
		resolver: zodResolver(climbSchema),
	});

	const selectedGym = form.watch('gym');

	// Load saved form state and climbs from localStorage on mount
	useEffect(() => {
		if (typeof window === 'undefined') return;

		// Load climbs
		const savedClimbs = localStorage.getItem(STORAGE_KEY_CLIMBS);
		if (savedClimbs) {
			try {
				const parsed = JSON.parse(savedClimbs);
				dispatchClimbs({ payload: parsed, type: 'SET' });
			} catch (e) {
				console.error('Failed to parse saved climbs', e);
			}
		}

		// Load form state
		const savedForm = localStorage.getItem(STORAGE_KEY_FORM);
		if (savedForm) {
			try {
				const parsed = JSON.parse(savedForm);
				form.reset(parsed);
			} catch (e) {
				console.error('Failed to parse saved form', e);
			}
		}
	}, [form]);

	// Save form state to localStorage on every change
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const subscription = form.watch((value) => {
			localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(value));
		});

		return () => subscription.unsubscribe();
	}, [form]);

	// Reset location and difficulty when gym changes
	useEffect(() => {
		const currentLocation = form.getValues('location');
		const currentDifficulty = form.getValues('difficulty');
		const selectedGymData = gyms[selectedGym];

		if (
			selectedGymData &&
			currentLocation &&
			!selectedGymData.locations.includes(currentLocation)
		) {
			form.setValue('location', '');
		}

		if (
			selectedGymData &&
			currentDifficulty &&
			!selectedGymData.difficulties.includes(currentDifficulty)
		) {
			form.setValue('difficulty', '');
		}
	}, [selectedGym, form]);

	const onSubmit = (data: Climb) => {
		const climb: Climb = {
			...data,
			climbedAt: new Date(),
		};

		// Add to climbs list
		dispatchClimbs({ payload: climb, type: 'ADD' });

		// Save to localStorage
		const updatedClimbs = [climb, ...climbs];
		localStorage.setItem(STORAGE_KEY_CLIMBS, JSON.stringify(updatedClimbs));

		// Reset form but keep gym and location persistent
		form.reset({
			attempts: 1,
			climbName: '',
			completed: false,
			difficulty: '',
			gym: data.gym,
			location: data.location,
			notes: '',
		});
	};

	const handleDeleteClimb = (index: number) => {
		const updatedClimbs = climbs.filter((_, i) => i !== index);
		dispatchClimbs({ payload: index, type: 'REMOVE' });
		localStorage.setItem(STORAGE_KEY_CLIMBS, JSON.stringify(updatedClimbs));
	};

	return (
		<div className="container mx-auto max-w-2xl py-8 space-y-6">
			{/* Climbs History */}
			{climbs.length > 0 && (
				<Collapsible defaultOpen>
					<Card>
						<CardHeader>
							<CollapsibleTrigger className="flex items-center justify-between w-full group">
								<div className="text-left">
									<CardTitle>Climbing History</CardTitle>
									<CardDescription>
										{climbs.length} climb(s) logged
									</CardDescription>
								</div>
								<ChevronDown className="h-5 w-5 transition-transform group-data-[state=open]:rotate-180" />
							</CollapsibleTrigger>
						</CardHeader>
						<CollapsibleContent>
							<CardContent className="space-y-4">
								{climbs.map((climb, index) => (
									<Card className="p-4" key={index}>
										<div className="flex items-start justify-between">
											<div className="space-y-1 flex-1">
												<div className="flex items-center gap-2">
													<span className="font-semibold">
														{gyms[climb.gym].name} - {climb.location}
													</span>
													{climb.completed && (
														<span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
															Completed
														</span>
													)}
												</div>
												<div className="text-sm text-muted-foreground">
													<span className="font-medium">
														{climb.difficulty}
													</span>{' '}
													• {climb.attempts} attempt
													{climb.attempts !== 1 ? 's' : ''}
												</div>
												<div className="text-sm">
													<span className="text-muted-foreground">
														Climb:
													</span>{' '}
													{climb.climbName}
												</div>
												{climb.notes && (
													<div className="text-sm text-muted-foreground italic">
														{climb.notes}
													</div>
												)}
												{climb.climbedAt && (
													<div className="text-xs text-muted-foreground">
														{new Date(climb.climbedAt).toLocaleString()}
													</div>
												)}
											</div>
											<Button
												className="text-destructive hover:text-destructive"
												onClick={() => handleDeleteClimb(index)}
												size="icon"
												variant="ghost"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</Card>
								))}
							</CardContent>
						</CollapsibleContent>
					</Card>
				</Collapsible>
			)}

			{/* Climbing Form */}
			<Card>
				<CardHeader>
					<CardTitle>Log a Climb</CardTitle>
					<CardDescription>Track your climbing progress</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
							{/* Gym Selection */}
							<FormField
								control={form.control}
								name="gym"
								render={({ field }) => {
									const handleGymChange = (value: string) => {
										field.onChange(value);
									};

									return (
										<FormItem>
											<FormLabel>Gym</FormLabel>
											<Select
												onValueChange={handleGymChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a gym" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{typedKeys(gyms).map((gymKey) => (
														<SelectItem key={gymKey} value={gymKey}>
															{gyms[gymKey].name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							{/* Location Selection */}
							<FormField
								control={form.control}
								name="location"
								render={({ field }) => {
									const handleLocationChange = (value: string) => {
										field.onChange(value);
									};

									return (
										<FormItem>
											<FormLabel>Location</FormLabel>
											<Select
												disabled={!selectedGym}
												onValueChange={handleLocationChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a location" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{selectedGym &&
														gyms[selectedGym].locations.map(
															(location) => (
																<SelectItem
																	key={location}
																	value={location}
																>
																	{location}
																</SelectItem>
															),
														)}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							{/* Difficulty Selection */}
							<FormField
								control={form.control}
								name="difficulty"
								render={({ field }) => {
									const handleDifficultyChange = (value: string) => {
										field.onChange(value);
									};

									return (
										<FormItem>
											<FormLabel>Colour / Difficulty</FormLabel>
											<Select
												disabled={!selectedGym}
												onValueChange={handleDifficultyChange}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a difficulty" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{selectedGym &&
														gyms[selectedGym].difficulties.map(
															(difficulty) => (
																<SelectItem
																	key={difficulty}
																	value={difficulty}
																>
																	{difficulty}
																</SelectItem>
															),
														)}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									);
								}}
							/>

							{/* Climb Name */}
							<FormField
								control={form.control}
								name="climbName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Climb Name/Description</FormLabel>
										<FormControl>
											<Input
												placeholder="Climb name/description"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Attempts */}
							<FormField
								control={form.control}
								name="attempts"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Attempts</FormLabel>
										<FormControl>
											<Input
												max="500"
												min="1"
												type="number"
												{...field}
												onChange={(e) =>
													field.onChange(e.target.valueAsNumber)
												}
											/>
										</FormControl>
										<FormDescription>
											Number of attempts to complete
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Completed Checkbox */}
							<FormField
								control={form.control}
								name="completed"
								render={({ field }) => {
									const handleCompletedChange = (checked: boolean) => {
										field.onChange(checked);
									};

									return (
										<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={handleCompletedChange}
												/>
											</FormControl>
											<div
												className="space-y-1 leading-none cursor-pointer"
												onClick={() => handleCompletedChange(!field.value)}
											>
												<FormLabel className="cursor-pointer">
													Completed
												</FormLabel>
												<FormDescription>
													Check this if you successfully completed the
													climb
												</FormDescription>
											</div>
										</FormItem>
									);
								}}
							/>

							{/* Optional Notes */}
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes (Optional)</FormLabel>
										<FormControl>
											<Input placeholder="Add any notes..." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button className="w-full" type="submit">
								Log Climb
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}

function climbsReducer(state: Climb[], action: ClimbsAction): Climb[] {
	switch (action.type) {
		case 'ADD':
			return [action.payload, ...state];
		case 'REMOVE':
			return state.filter((_, index) => index !== action.payload);
		case 'SET':
			return action.payload;
		default:
			return state;
	}
}
