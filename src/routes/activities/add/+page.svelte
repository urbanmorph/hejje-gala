<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/landing/Header.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { isMobile as checkIsMobile } from '$lib/utils';
	import { _, locale } from 'svelte-i18n';
	import { CalendarDays, Clock, MapPin, Link, FileText, User, ImagePlus } from '@lucide/svelte';

	let isMobile = $state(false);

	// Form fields
	let title = $state('');
	let type = $state('Walk');
	let startDate = $state('');
	let startTime = $state('');
	let endDate = $state('');
	let endTime = $state('');
	let venue = $state('');
	let mapsUrl = $state('');
	let description = $state('');
	let rsvpUrl = $state('');
	let websiteUrl = $state('');
	let organizer = $state('');
	let posterFile: File | null = $state(null);
	let posterPreview = $state('');
	let honeypot = $state('');

	// Form state
	let isSubmitting = $state(false);
	let submitted = $state(false);
	let errorMessage = $state('');

	const EVENT_TYPES = [
		{ value: 'Walk', label: 'events.form.typeWalk', color: '#22c55e' },
		{ value: 'Cycle', label: 'events.form.typeCycle', color: '#3b82f6' },
		{ value: 'Other', label: 'events.form.typeOther', color: '#f59e0b' }
	];

	function checkMobile() {
		isMobile = checkIsMobile();
	}

	const MAX_POSTER_SIZE = 2 * 1024 * 1024; // 2MB
	const MAX_DIMENSION = 1600;
	const JPEG_QUALITY = 0.8;

	function compressImage(file: File): Promise<File> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				let { width, height } = img;

				// Scale down if either dimension exceeds max
				if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
					const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
					width = Math.round(width * ratio);
					height = Math.round(height * ratio);
				}

				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) { resolve(file); return; }

				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (!blob) { resolve(file); return; }
						resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
					},
					'image/jpeg',
					JPEG_QUALITY
				);
			};
			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = URL.createObjectURL(file);
		});
	}

	async function handlePosterChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			let processed = file;

			// Compress if it's over 2MB or not a JPEG
			if (file.size > MAX_POSTER_SIZE || !file.type.includes('jpeg')) {
				processed = await compressImage(file);
			}

			// If still over 2MB after compression, try again with lower quality
			if (processed.size > MAX_POSTER_SIZE) {
				const canvas = document.createElement('canvas');
				const img = new Image();
				await new Promise<void>((resolve) => {
					img.onload = () => resolve();
					img.src = URL.createObjectURL(processed);
				});
				let { width, height } = img;
				const ratio = Math.min(1200 / width, 1200 / height, 1);
				canvas.width = Math.round(width * ratio);
				canvas.height = Math.round(height * ratio);
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.6));
				if (blob) {
					processed = new File([blob], processed.name, { type: 'image/jpeg' });
				}
			}

			if (processed.size > MAX_POSTER_SIZE) {
				errorMessage = $_('events.form.posterTooLarge');
				return;
			}

			posterFile = processed;
			const reader = new FileReader();
			reader.onload = () => { posterPreview = reader.result as string; };
			reader.readAsDataURL(processed);
		} catch {
			errorMessage = $_('events.form.submitError');
		}
	}

	function removePoster() {
		posterFile = null;
		posterPreview = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		// Honeypot check
		if (honeypot) return;

		if (!title.trim() || !startDate || !startTime || !venue.trim() || !organizer.trim()) {
			errorMessage = $_('events.form.requiredFields');
			return;
		}

		isSubmitting = true;
		errorMessage = '';

		try {
			const formData = new FormData();
			formData.append('title', title.trim());
			formData.append('type', type);
			formData.append('startDate', startDate);
			formData.append('startTime', startTime);
			if (endDate) formData.append('endDate', endDate);
			if (endTime) formData.append('endTime', endTime);
			formData.append('venue', venue.trim());
			if (mapsUrl.trim()) formData.append('mapsUrl', mapsUrl.trim());
			formData.append('organizer', organizer.trim());
			if (description.trim()) formData.append('description', description.trim());
			if (rsvpUrl.trim()) formData.append('rsvpUrl', rsvpUrl.trim());
			if (websiteUrl.trim()) formData.append('websiteUrl', websiteUrl.trim());
			if (posterFile) formData.append('poster', posterFile);
			formData.append('website_url_confirm', honeypot);

			const res = await fetch('/api/events', {
				method: 'POST',
				body: formData
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				errorMessage = data.error || $_('events.form.submitError');
				return;
			}

			submitted = true;
		} catch (err) {
			errorMessage = $_('events.form.submitError');
		} finally {
			isSubmitting = false;
		}
	}

	onMount(() => {
		checkMobile();
		const resizeHandler = () => checkMobile();
		window.addEventListener('resize', resizeHandler);
		return () => window.removeEventListener('resize', resizeHandler);
	});
</script>

<svelte:head>
	<title>{$_('events.form.pageTitle')} - Hejje Gala</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFCF8]">
	<Header {isMobile} />

	<section class="{isMobile ? 'py-6 sm:py-8' : 'py-16'}">
		<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-2xl'} px-3 sm:px-4 md:px-6">
			<div class="rounded-lg border bg-white {isMobile ? 'p-4 sm:p-6' : 'p-8 lg:p-10'}">

				{#if submitted}
					<!-- Success state -->
					<div class="py-12 text-center">
						<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
							<CalendarDays class="h-8 w-8 text-[#00A63E]" />
						</div>
						<h2 class="mb-2 text-2xl font-bold text-gray-900">{$_('events.form.successTitle')}</h2>
						<p class="mb-6 text-gray-600">{$_('events.form.successMessage')}</p>
						<a
							href="/activities"
							class="inline-flex items-center rounded-full bg-[#00A63E] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#008f35]"
						>
							{$_('events.form.backToEvents')}
						</a>
					</div>
				{:else}
					<!-- Form header -->
					<div class="mb-8 text-center">
						<h2 class="{isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-bold text-gray-900 mb-2">
							{$_('events.form.title')}
						</h2>
						<p class="text-sm text-gray-500">{$_('events.form.subtitle')}</p>
					</div>

					<form onsubmit={handleSubmit} class="space-y-6">
						<!-- Honeypot (hidden from users) -->
						<div class="absolute -left-[9999px]" aria-hidden="true">
							<input type="text" name="website_url_confirm" bind:value={honeypot} tabindex="-1" autocomplete="off" />
						</div>

						<!-- Event Title -->
						<div>
							<Label for="title">{$_('events.form.eventTitle')} <span class="text-red-500">*</span></Label>
							<Input
								id="title"
								type="text"
								placeholder={$_('events.form.eventTitlePlaceholder')}
								bind:value={title}
								required
							/>
						</div>

						<!-- Event Type -->
						<div>
							<Label>{$_('events.form.eventType')} <span class="text-red-500">*</span></Label>
							<div class="flex gap-2">
								{#each EVENT_TYPES as t}
									<button
										type="button"
										onclick={() => (type = t.value)}
										class="flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all {type === t.value
											? 'text-white shadow-sm'
											: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}"
										style={type === t.value ? `background-color: ${t.color}; border-color: ${t.color}` : ''}
									>
										{$_(t.label)}
									</button>
								{/each}
							</div>
						</div>

						<!-- Date & Time row -->
						<div class="grid gap-4 {isMobile ? 'grid-cols-1' : 'grid-cols-2'}">
							<div>
								<Label for="startDate">
									<span class="flex items-center gap-1.5">
										<CalendarDays class="h-3.5 w-3.5" />
										{$_('events.form.startDate')} <span class="text-red-500">*</span>
									</span>
								</Label>
								<Input id="startDate" type="date" bind:value={startDate} required />
							</div>
							<div>
								<Label for="startTime">
									<span class="flex items-center gap-1.5">
										<Clock class="h-3.5 w-3.5" />
										{$_('events.form.startTime')} <span class="text-red-500">*</span>
									</span>
								</Label>
								<Input id="startTime" type="time" bind:value={startTime} required />
							</div>
						</div>

						<div class="grid gap-4 {isMobile ? 'grid-cols-1' : 'grid-cols-2'}">
							<div>
								<Label for="endDate">
									<span class="flex items-center gap-1.5">
										<CalendarDays class="h-3.5 w-3.5" />
										{$_('events.form.endDate')}
									</span>
								</Label>
								<Input id="endDate" type="date" bind:value={endDate} />
							</div>
							<div>
								<Label for="endTime">
									<span class="flex items-center gap-1.5">
										<Clock class="h-3.5 w-3.5" />
										{$_('events.form.endTime')}
									</span>
								</Label>
								<Input id="endTime" type="time" bind:value={endTime} />
							</div>
						</div>

						<!-- Venue -->
						<div>
							<Label for="venue">
								<span class="flex items-center gap-1.5">
									<MapPin class="h-3.5 w-3.5" />
									{$_('events.form.venue')} <span class="text-red-500">*</span>
								</span>
							</Label>
							<Input
								id="venue"
								type="text"
								placeholder={$_('events.form.venuePlaceholder')}
								bind:value={venue}
								required
							/>
						</div>

						<!-- Google Maps Link -->
						<div>
							<Label for="mapsUrl">
								<span class="flex items-center gap-1.5">
									<MapPin class="h-3.5 w-3.5" />
									{$_('events.form.mapsUrl')}
								</span>
							</Label>
							<Input
								id="mapsUrl"
								type="url"
								placeholder={$_('events.form.mapsUrlPlaceholder')}
								bind:value={mapsUrl}
							/>
							<p class="mt-1 text-xs text-gray-400">{$_('events.form.mapsUrlHint')}</p>
						</div>

						<!-- Organizer -->
						<div>
							<Label for="organizer">
								<span class="flex items-center gap-1.5">
									<User class="h-3.5 w-3.5" />
									{$_('events.form.organizer')} <span class="text-red-500">*</span>
								</span>
							</Label>
							<Input
								id="organizer"
								type="text"
								placeholder={$_('events.form.organizerPlaceholder')}
								bind:value={organizer}
								required
							/>
						</div>

						<!-- Description -->
						<div>
							<Label for="description">
								<span class="flex items-center gap-1.5">
									<FileText class="h-3.5 w-3.5" />
									{$_('events.form.description')}
								</span>
							</Label>
							<textarea
								id="description"
								rows="4"
								placeholder={$_('events.form.descriptionPlaceholder')}
								bind:value={description}
								class="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:border-[#39BC36] focus-visible:ring-2 focus-visible:ring-[#39BC36]/40 focus-visible:outline-none resize-none"
							></textarea>
						</div>

						<!-- RSVP URL -->
						<div>
							<Label for="rsvpUrl">
								<span class="flex items-center gap-1.5">
									<Link class="h-3.5 w-3.5" />
									{$_('events.form.rsvpUrl')}
								</span>
							</Label>
							<Input
								id="rsvpUrl"
								type="url"
								placeholder={$_('events.form.rsvpUrlPlaceholder')}
								bind:value={rsvpUrl}
							/>
						</div>

						<!-- Website URL -->
						<div>
							<Label for="websiteUrl">
								<span class="flex items-center gap-1.5">
									<Link class="h-3.5 w-3.5" />
									{$_('events.form.websiteUrl')}
								</span>
							</Label>
							<Input
								id="websiteUrl"
								type="url"
								placeholder={$_('events.form.websiteUrlPlaceholder')}
								bind:value={websiteUrl}
							/>
						</div>

						<!-- Poster Upload -->
						<div>
							<Label>{$_('events.form.poster')}</Label>
							{#if posterPreview}
								<div class="relative rounded-lg border border-gray-200 overflow-hidden">
									<img src={posterPreview} alt="Poster preview" class="w-full max-h-64 object-contain bg-gray-50" />
									<button
										type="button"
										onclick={removePoster}
										class="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
									</button>
								</div>
							{:else}
								<label
									for="poster"
									class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition-colors hover:border-gray-400 hover:bg-gray-100"
								>
									<ImagePlus class="h-8 w-8 text-gray-400" />
									<span class="text-sm text-gray-500">{$_('events.form.posterUpload')}</span>
									<span class="text-xs text-gray-400">{$_('events.form.posterHint')}</span>
								</label>
								<input
									id="poster"
									type="file"
									accept="image/*"
									onchange={handlePosterChange}
									class="hidden"
								/>
							{/if}
						</div>

						<!-- Error message -->
						{#if errorMessage}
							<div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
								{errorMessage}
							</div>
						{/if}

						<!-- Submit -->
						<button
							type="submit"
							disabled={isSubmitting}
							class="w-full rounded-lg bg-[#00A63E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#008f35] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if isSubmitting}
								<span class="flex items-center justify-center gap-2">
									<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
									{$_('events.form.submitting')}
								</span>
							{:else}
								{$_('events.form.submit')}
							{/if}
						</button>

						<p class="text-center text-xs text-gray-400">
							{$_('events.form.reviewNote')}
						</p>
					</form>
				{/if}
			</div>
		</div>
	</section>

	<Footer {isMobile} />
</div>
