<script lang="ts">
	import { onMount } from 'svelte';
	import { X, ImagePlus, Trash2, Pencil, Plus } from '@lucide/svelte';
	import type { CommunityEvent } from '$lib/types/event';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	const { data } = $props<{ data: { token: string } }>();
	const token = data.token;

	const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
	const MAX_DIMENSION = 1600;
	const JPEG_QUALITY = 0.8;

	const TYPE_COLORS: Record<string, string> = {
		Walk: '#22c55e',
		Cycle: '#3b82f6',
		Other: '#f59e0b'
	};

	type Mode = 'create' | 'edit' | null;

	let events = $state<CommunityEvent[]>([]);
	let loading = $state(true);
	let listError = $state('');

	let mode = $state<Mode>(null);
	let editingId = $state<string | null>(null);
	let form = $state(emptyForm());
	let posterFile: File | null = $state(null);
	let posterPreview = $state('');
	let recapPhotoFile: File | null = $state(null);
	let recapPhotoPreview = $state('');
	let clearPoster = $state(false);
	let clearRecapPhoto = $state(false);
	let submitting = $state(false);
	let formError = $state('');

	let pendingDelete = $state<CommunityEvent | null>(null);
	let deleting = $state(false);

	function emptyForm() {
		return {
			title: '',
			type: 'Walk' as CommunityEvent['type'],
			startDate: '',
			startTime: '',
			endDate: '',
			endTime: '',
			venue: '',
			mapsUrl: '',
			description: '',
			rsvpUrl: '',
			websiteUrl: '',
			organizer: '',
			recapDescription: ''
		};
	}

	async function loadEvents() {
		loading = true;
		listError = '';
		try {
			const res = await fetch('/api/events/admin', {
				headers: { authorization: `Bearer ${token}` }
			});
			const json = (await res.json()) as {
				success: boolean;
				events?: CommunityEvent[];
				error?: string;
			};
			if (!res.ok || !json.success) {
				listError = json.error || 'Failed to load events';
				return;
			}
			events = json.events ?? [];
		} catch (err) {
			console.error(err);
			listError = 'Failed to load events';
		} finally {
			loading = false;
		}
	}

	function compressImage(file: File): Promise<File> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				let { width, height } = img;
				if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
					const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
					width = Math.round(width * ratio);
					height = Math.round(height * ratio);
				}
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					resolve(file);
					return;
				}
				ctx.drawImage(img, 0, 0, width, height);
				canvas.toBlob(
					(blob) => {
						if (!blob) {
							resolve(file);
							return;
						}
						resolve(
							new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
						);
					},
					'image/jpeg',
					JPEG_QUALITY
				);
			};
			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = URL.createObjectURL(file);
		});
	}

	async function processPhoto(file: File): Promise<File | null> {
		let processed = file;
		if (file.size > MAX_PHOTO_BYTES || !file.type.includes('jpeg')) {
			processed = await compressImage(file);
		}
		if (processed.size > MAX_PHOTO_BYTES) {
			formError = 'Image is too large even after compression. Please use a smaller image.';
			return null;
		}
		return processed;
	}

	async function handlePosterChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const processed = await processPhoto(file);
		if (!processed) return;
		posterFile = processed;
		clearPoster = false;
		posterPreview = await readDataUrl(processed);
	}

	async function handleRecapPhotoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const processed = await processPhoto(file);
		if (!processed) return;
		recapPhotoFile = processed;
		clearRecapPhoto = false;
		recapPhotoPreview = await readDataUrl(processed);
	}

	function readDataUrl(file: File): Promise<string> {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.readAsDataURL(file);
		});
	}

	function openCreate() {
		mode = 'create';
		editingId = null;
		form = emptyForm();
		posterFile = null;
		posterPreview = '';
		recapPhotoFile = null;
		recapPhotoPreview = '';
		clearPoster = false;
		clearRecapPhoto = false;
		formError = '';
	}

	function openEdit(ev: CommunityEvent) {
		mode = 'edit';
		editingId = ev.id;
		form = {
			title: ev.title,
			type: ev.type,
			startDate: ev.startDate.slice(0, 10),
			startTime: ev.startDate.slice(11, 16),
			endDate: ev.endDate ? ev.endDate.slice(0, 10) : '',
			endTime: ev.endDate ? ev.endDate.slice(11, 16) : '',
			venue: ev.venue,
			mapsUrl: ev.mapsUrl || '',
			description: ev.description || '',
			rsvpUrl: ev.rsvpUrl || '',
			websiteUrl: ev.websiteUrl || '',
			organizer: ev.organizer,
			recapDescription: ev.recapDescription || ''
		};
		posterFile = null;
		posterPreview = ev.posterUrl || '';
		recapPhotoFile = null;
		recapPhotoPreview = ev.recapPhotoUrl || '';
		clearPoster = false;
		clearRecapPhoto = false;
		formError = '';
	}

	function closeModal() {
		mode = null;
		editingId = null;
	}

	function removePoster() {
		posterFile = null;
		posterPreview = '';
		clearPoster = true;
	}

	function removeRecapPhoto() {
		recapPhotoFile = null;
		recapPhotoPreview = '';
		clearRecapPhoto = true;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (
			!form.title.trim() ||
			!form.startDate ||
			!form.startTime ||
			!form.venue.trim() ||
			!form.organizer.trim()
		) {
			formError = 'Please fill in all required fields.';
			return;
		}

		submitting = true;
		formError = '';

		try {
			const fd = new FormData();
			fd.append('title', form.title.trim());
			fd.append('type', form.type);
			fd.append('startDate', form.startDate);
			fd.append('startTime', form.startTime);
			if (form.endDate) fd.append('endDate', form.endDate);
			if (form.endTime) fd.append('endTime', form.endTime);
			fd.append('venue', form.venue.trim());
			if (form.mapsUrl.trim()) fd.append('mapsUrl', form.mapsUrl.trim());
			fd.append('organizer', form.organizer.trim());
			if (form.description.trim()) fd.append('description', form.description.trim());
			if (form.rsvpUrl.trim()) fd.append('rsvpUrl', form.rsvpUrl.trim());
			if (form.websiteUrl.trim()) fd.append('websiteUrl', form.websiteUrl.trim());
			if (form.recapDescription.trim()) fd.append('recapDescription', form.recapDescription.trim());
			if (posterFile) fd.append('poster', posterFile);
			if (recapPhotoFile) fd.append('recapPhoto', recapPhotoFile);
			if (mode === 'edit' && clearPoster) fd.append('clearPoster', '1');
			if (mode === 'edit' && clearRecapPhoto) fd.append('clearRecapPhoto', '1');

			const url = mode === 'edit' ? `/api/events/admin/${editingId}` : '/api/events/admin';
			const method = mode === 'edit' ? 'PUT' : 'POST';

			const res = await fetch(url, {
				method,
				headers: { authorization: `Bearer ${token}` },
				body: fd
			});
			const json = (await res.json()) as { success: boolean; error?: string };
			if (!res.ok || !json.success) {
				formError = json.error || 'Save failed';
				return;
			}
			closeModal();
			await loadEvents();
		} catch (err) {
			console.error(err);
			formError = 'Save failed';
		} finally {
			submitting = false;
		}
	}

	async function confirmDelete() {
		if (!pendingDelete) return;
		deleting = true;
		try {
			const res = await fetch(`/api/events/admin/${pendingDelete.id}`, {
				method: 'DELETE',
				headers: { authorization: `Bearer ${token}` }
			});
			const json = (await res.json()) as { success: boolean; error?: string };
			if (!res.ok || !json.success) {
				alert(json.error || 'Delete failed');
				return;
			}
			pendingDelete = null;
			await loadEvents();
		} catch (err) {
			console.error(err);
			alert('Delete failed');
		} finally {
			deleting = false;
		}
	}

	function isPast(ev: CommunityEvent): boolean {
		const end = new Date(ev.endDate || ev.startDate);
		return end.getTime() < Date.now();
	}

	let upcoming = $derived(
		events
			.filter((e) => !isPast(e))
			.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
	);

	let past = $derived(
		events
			.filter(isPast)
			.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
	);

	function formatWhen(ev: CommunityEvent): string {
		const d = new Date(ev.startDate);
		if (isNaN(d.getTime())) return ev.startDate;
		return d.toLocaleString('en-IN', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	onMount(loadEvents);
</script>

<svelte:head>
	<title>Event admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-screen bg-[#FFFCF8] px-4 py-8">
	<div class="mx-auto max-w-3xl">
		<header class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Event admin</h1>
				<p class="text-xs text-gray-500">Unpublished link. Share carefully.</p>
			</div>
			<button
				type="button"
				onclick={openCreate}
				class="inline-flex items-center gap-1.5 rounded-full bg-[#00A63E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#008f35]"
			>
				<Plus class="h-4 w-4" />
				New event
			</button>
		</header>

		{#if loading}
			<div class="rounded-lg border bg-white py-12 text-center text-sm text-gray-500">
				Loading events…
			</div>
		{:else if listError}
			<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
				{listError}
			</div>
		{:else}
			<section class="mb-8">
				<h2 class="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
					Upcoming ({upcoming.length})
				</h2>
				{#if upcoming.length === 0}
					<p class="rounded-lg border bg-white px-4 py-6 text-sm text-gray-400">
						No upcoming events.
					</p>
				{:else}
					<ul class="space-y-2">
						{#each upcoming as ev (ev.id)}
							{@render eventRow(ev)}
						{/each}
					</ul>
				{/if}
			</section>

			<section>
				<h2 class="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
					Past ({past.length})
				</h2>
				{#if past.length === 0}
					<p class="rounded-lg border bg-white px-4 py-6 text-sm text-gray-400">No past events.</p>
				{:else}
					<ul class="space-y-2">
						{#each past as ev (ev.id)}
							{@render eventRow(ev)}
						{/each}
					</ul>
				{/if}
			</section>
		{/if}
	</div>
</div>

{#snippet eventRow(ev: CommunityEvent)}
	<li class="rounded-lg border bg-white p-4">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0 flex-1">
				<div class="mb-1 flex items-center gap-2">
					<span
						class="inline-block h-2.5 w-2.5 rounded-full"
						style="background-color: {TYPE_COLORS[ev.type] || TYPE_COLORS.Other}"
					></span>
					<span class="text-xs font-medium text-gray-500">{ev.type}</span>
					<span class="text-xs text-gray-400">·</span>
					<span class="text-xs text-gray-500">{formatWhen(ev)}</span>
				</div>
				<h3 class="truncate text-sm font-semibold text-gray-900">{ev.title}</h3>
				<p class="mt-0.5 truncate text-xs text-gray-500">
					{ev.venue} · {ev.organizer}
				</p>
				<div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
					{#if ev.posterUrl}<span>📷 poster</span>{/if}
					{#if ev.description}<span>📝 description</span>{/if}
					{#if ev.recapPhotoUrl}<span>📸 recap photo</span>{/if}
					{#if ev.recapDescription}<span>📰 recap</span>{/if}
					{#if isPast(ev) && !ev.recapPhotoUrl && !ev.recapDescription}
						<span class="text-amber-600">no recap yet</span>
					{/if}
				</div>
			</div>
			<div class="flex shrink-0 gap-1">
				<button
					type="button"
					onclick={() => openEdit(ev)}
					class="rounded-full p-2 text-gray-500 hover:bg-gray-100"
					aria-label="Edit"
				>
					<Pencil class="h-4 w-4" />
				</button>
				<button
					type="button"
					onclick={() => (pendingDelete = ev)}
					class="rounded-full p-2 text-red-500 hover:bg-red-50"
					aria-label="Delete"
				>
					<Trash2 class="h-4 w-4" />
				</button>
			</div>
		</div>
	</li>
{/snippet}

{#if mode}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm px-4 py-8"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeModal();
		}}
	>
		<div
			class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="form-title"
		>
			<button
				type="button"
				onclick={closeModal}
				class="absolute top-4 right-4 rounded-full p-2 hover:bg-gray-100"
				aria-label="Close"
			>
				<X class="h-5 w-5 text-gray-600" />
			</button>

			<h2 id="form-title" class="mb-4 text-xl font-bold text-gray-900">
				{mode === 'edit' ? 'Edit event' : 'New event'}
			</h2>

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<Label for="title">Title <span class="text-red-500">*</span></Label>
					<Input id="title" type="text" bind:value={form.title} required />
				</div>

				<div>
					<Label>Type <span class="text-red-500">*</span></Label>
					<div class="flex gap-2">
						{#each ['Walk', 'Cycle', 'Other'] as t (t)}
							<button
								type="button"
								onclick={() => (form.type = t as CommunityEvent['type'])}
								class="flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all {form.type ===
								t
									? 'text-white shadow-sm'
									: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}"
								style={form.type === t
									? `background-color: ${TYPE_COLORS[t]}; border-color: ${TYPE_COLORS[t]}`
									: ''}
							>
								{t}
							</button>
						{/each}
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<Label for="startDate">Start date <span class="text-red-500">*</span></Label>
						<Input id="startDate" type="date" bind:value={form.startDate} required />
					</div>
					<div>
						<Label for="startTime">Start time <span class="text-red-500">*</span></Label>
						<Input id="startTime" type="time" bind:value={form.startTime} required />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<Label for="endDate">End date</Label>
						<Input id="endDate" type="date" bind:value={form.endDate} />
					</div>
					<div>
						<Label for="endTime">End time</Label>
						<Input id="endTime" type="time" bind:value={form.endTime} />
					</div>
				</div>

				<div>
					<Label for="venue">Venue <span class="text-red-500">*</span></Label>
					<Input id="venue" type="text" bind:value={form.venue} required />
				</div>

				<div>
					<Label for="mapsUrl">Maps URL</Label>
					<Input id="mapsUrl" type="url" bind:value={form.mapsUrl} />
				</div>

				<div>
					<Label for="organizer">Organizer <span class="text-red-500">*</span></Label>
					<Input id="organizer" type="text" bind:value={form.organizer} required />
				</div>

				<div>
					<Label for="description">Description</Label>
					<textarea
						id="description"
						rows="3"
						bind:value={form.description}
						class="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus-visible:border-[#39BC36] focus-visible:ring-2 focus-visible:ring-[#39BC36]/40 focus-visible:outline-none resize-none"
					></textarea>
				</div>

				<div>
					<Label for="rsvpUrl">RSVP URL</Label>
					<Input id="rsvpUrl" type="url" bind:value={form.rsvpUrl} />
				</div>

				<div>
					<Label for="websiteUrl">Website URL</Label>
					<Input id="websiteUrl" type="url" bind:value={form.websiteUrl} />
				</div>

				<div>
					<Label>Poster (event)</Label>
					{@render photoPicker(posterPreview, 'poster-upload', handlePosterChange, removePoster)}
				</div>

				<div class="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
					<p class="mb-3 text-xs font-semibold text-amber-700">
						Post-event recap (shown on past events only)
					</p>
					<div class="space-y-3">
						<div>
							<Label for="recapDescription">Recap text</Label>
							<textarea
								id="recapDescription"
								rows="4"
								bind:value={form.recapDescription}
								placeholder="How did the event go? Add details, highlights, attendance…"
								class="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus-visible:border-[#39BC36] focus-visible:ring-2 focus-visible:ring-[#39BC36]/40 focus-visible:outline-none resize-none"
							></textarea>
						</div>
						<div>
							<Label>Recap photo</Label>
							{@render photoPicker(
								recapPhotoPreview,
								'recap-upload',
								handleRecapPhotoChange,
								removeRecapPhoto
							)}
						</div>
					</div>
				</div>

				{#if formError}
					<div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
				{/if}

				<div class="flex justify-end gap-2 pt-2">
					<button
						type="button"
						onclick={closeModal}
						class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={submitting}
						class="rounded-lg bg-[#00A63E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#008f35] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create event'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#snippet photoPicker(
	preview: string,
	inputId: string,
	onChange: (e: Event) => void,
	onRemove: () => void
)}
	{#if preview}
		<div class="relative rounded-lg border border-gray-200 overflow-hidden">
			<img src={preview} alt="Preview" class="w-full max-h-48 object-contain bg-gray-50" />
			<button
				type="button"
				onclick={onRemove}
				class="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
				aria-label="Remove photo"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{:else}
		<label
			for={inputId}
			class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:border-gray-400"
		>
			<ImagePlus class="h-6 w-6 text-gray-400" />
			<span class="text-xs text-gray-500">Click to upload (≤2 MB)</span>
		</label>
		<input id={inputId} type="file" accept="image/*" onchange={onChange} class="hidden" />
	{/if}
{/snippet}

{#if pendingDelete}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) pendingDelete = null;
		}}
	>
		<div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
			<h3 class="mb-2 text-lg font-bold text-gray-900">Delete event?</h3>
			<p class="mb-4 text-sm text-gray-600">
				This will permanently remove <span class="font-semibold">{pendingDelete.title}</span> and its
				uploaded photos. This can't be undone.
			</p>
			<div class="flex justify-end gap-2">
				<button
					type="button"
					onclick={() => (pendingDelete = null)}
					class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmDelete}
					disabled={deleting}
					class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
				>
					{deleting ? 'Deleting…' : 'Delete'}
				</button>
			</div>
		</div>
	</div>
{/if}
