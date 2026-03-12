<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { _, locale } from 'svelte-i18n';
	import { MapPin, ExternalLink, X, CalendarDays, Route } from '@lucide/svelte';
	import type { CommunityEvent } from '$lib/types/event';

	interface Props {
		isMobile?: boolean;
		events: CommunityEvent[];
	}

	let { isMobile = false, events = [] }: Props = $props();

	const TYPE_COLORS: Record<string, string> = {
		Walk: '#22c55e',
		Cycle: '#3b82f6',
		Other: '#f59e0b'
	};

	const TYPE_KEYS: Record<string, string> = {
		Walk: 'activities.walk',
		Cycle: 'activities.cycle',
		Other: 'activities.other'
	};

	const DATE_LOCALE_MAP: Record<string, string> = {
		en: 'en-IN',
		kn: 'kn-IN'
	};

	let filterType = $state('all');
	let selectedEvent = $state<CommunityEvent | null>(null);

	let sortedEvents = $derived(
		[...events].sort(
			(a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
		)
	);

	let filtered = $derived(
		filterType === 'all' ? sortedEvents : sortedEvents.filter((e) => e.type === filterType)
	);

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;
		const dateLoc = DATE_LOCALE_MAP[$locale || 'en'] || 'en-IN';
		return date.toLocaleDateString(dateLoc, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return '';
		const dateLoc = DATE_LOCALE_MAP[$locale || 'en'] || 'en-IN';
		return date.toLocaleTimeString(dateLoc, {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatEventTime(dateStr: string): string {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;
		const dateLoc = DATE_LOCALE_MAP[$locale || 'en'] || 'en-IN';
		return date.toLocaleString(dateLoc, {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function linkify(text: string): string {
		const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return escaped.replace(
			/(https?:\/\/[^\s<]+)/g,
			'<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0D6BA3] underline">$1</a>'
		);
	}

	function truncate(text: string, maxLen: number): string {
		if (text.length <= maxLen) return text;
		return text.slice(0, maxLen).trimEnd() + '...';
	}

	function closeModal() {
		selectedEvent = null;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) closeModal();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeModal();
	}
</script>

<!-- Filter buttons -->
<div class="flex flex-wrap items-center justify-center gap-2 {isMobile ? 'mb-4' : 'mb-8'}">
	<button
		type="button"
		onclick={() => (filterType = 'all')}
		class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {filterType === 'all'
			? 'bg-gray-900 text-white'
			: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
	>
		{$_('activities.all')}
	</button>
	{#each ['Walk', 'Cycle', 'Other'] as t}
		<button
			type="button"
			onclick={() => (filterType = t)}
			class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {filterType === t
				? 'text-white'
				: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
			style={filterType === t ? `background-color: ${TYPE_COLORS[t]}` : ''}
		>
			{$_(TYPE_KEYS[t])}
		</button>
	{/each}
</div>

<!-- Event cards grid -->
{#if filtered.length === 0}
	<div class="py-12 text-center text-gray-400">
		{$_('common.noDataAvailable')}
	</div>
{:else}
	<div
		class="grid gap-4 {isMobile
			? 'grid-cols-1 sm:grid-cols-2'
			: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}"
	>
		{#each filtered as event, i (event.id)}
			<button
				type="button"
				class="group w-full overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 text-left shadow-sm transition-shadow hover:shadow-md"
				in:fade={{ duration: 150, delay: i * 30 }}
				onclick={() => (selectedEvent = event)}
			>
				<!-- Poster / Placeholder -->
				<div class="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
					{#if event.posterUrl}
						<img
							src={event.posterUrl}
							alt={event.title}
							class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							loading="lazy"
						/>
					{:else}
						<div
							class="flex h-full items-center justify-center"
							style="background: linear-gradient(135deg, {TYPE_COLORS[event.type]}15, {TYPE_COLORS[event.type]}30)"
						>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-full opacity-50"
								style="background-color: {TYPE_COLORS[event.type] || TYPE_COLORS.Other}"
							>
								<Route class="h-6 w-6 text-white" />
							</div>
						</div>
					{/if}
					<!-- Type badge -->
					<span
						class="absolute top-2 left-2 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
						style="background-color: {TYPE_COLORS[event.type] || TYPE_COLORS.Other}"
					>
						{$_(TYPE_KEYS[event.type] || 'activities.other')}
					</span>
				</div>

				<!-- Card body -->
				<div class="p-4">
					<h3 class="mb-2 text-sm font-semibold leading-snug text-gray-900">
						{event.title}
					</h3>

					<div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
						<span class="flex items-center gap-1">
							<CalendarDays class="h-3 w-3" />
							{formatDate(event.startDate)}
							{#if formatTime(event.startDate)}
								&middot; {formatTime(event.startDate)}
							{/if}
						</span>
					</div>

					{#if event.venue}
						<p class="mb-2 flex items-start gap-1 text-xs text-gray-500">
							<MapPin class="mt-0.5 h-3 w-3 flex-shrink-0" />
							<span class="line-clamp-1">{event.venue}</span>
						</p>
					{/if}

					{#if event.description}
						<p class="text-xs leading-relaxed text-gray-600">
							{truncate(event.description, 100)}
						</p>
					{/if}

					{#if event.rsvpUrl}
						<div class="mt-3">
							<span
								class="inline-block rounded-full bg-[#00A63E] px-3 py-1 text-xs font-medium text-white"
							>
								{$_('events.rsvp')}
							</span>
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>
{/if}

<!-- Detail Modal -->
{#if selectedEvent}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		role="presentation"
	>
		<div
			class="relative mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto"
			transition:fly={{ y: 20, duration: 200 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="card-modal-title"
			tabindex="-1"
		>
			<div class="overflow-hidden rounded-2xl bg-white shadow-2xl">
				{#if selectedEvent.posterUrl}
					<img
						src={selectedEvent.posterUrl}
						alt={selectedEvent.title}
						class="aspect-video w-full object-cover"
					/>
				{/if}

				<div class="p-6">
					<button
						type="button"
						onclick={closeModal}
						class="absolute top-4 right-4 rounded-full bg-white/80 p-2 transition-colors hover:bg-gray-100"
						aria-label={$_('common.close')}
					>
						<X class="h-5 w-5 text-gray-600" />
					</button>

					<div class="mb-3 flex items-center gap-2">
						<span
							class="inline-block h-3 w-3 rounded-full"
							style="background-color: {TYPE_COLORS[selectedEvent.type] || TYPE_COLORS.Other}"
						></span>
						<span class="text-sm font-medium text-gray-500">
							{$_(TYPE_KEYS[selectedEvent.type] || 'activities.other')}
						</span>
					</div>

					<h3 id="card-modal-title" class="mb-2 text-xl font-bold text-gray-900">
						{selectedEvent.title}
					</h3>

					{#if selectedEvent.organizer}
						<p class="mb-3 text-sm font-medium text-[#0D6BA3]">
							{$_('events.organizer')}: {selectedEvent.organizer}
						</p>
					{/if}

					<p class="mb-3 text-sm text-gray-500">
						{formatEventTime(selectedEvent.startDate)}
						{#if selectedEvent.endDate && selectedEvent.endDate !== selectedEvent.startDate}
							&ndash; {formatEventTime(selectedEvent.endDate)}
						{/if}
					</p>

					{#if selectedEvent.venue}
						{#if selectedEvent.mapsUrl}
							<a
								href={selectedEvent.mapsUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="mb-3 flex items-start gap-1.5 text-sm text-[#0D6BA3] hover:underline"
							>
								<MapPin class="mt-0.5 h-4 w-4 flex-shrink-0" />
								{selectedEvent.venue}
							</a>
						{:else}
							<p class="mb-3 flex items-start gap-1.5 text-sm text-gray-600">
								<MapPin class="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
								{selectedEvent.venue}
							</p>
						{/if}
					{/if}

					{#if selectedEvent.description}
						<p class="mb-4 text-sm leading-relaxed text-gray-700">
							{@html linkify(selectedEvent.description)}
						</p>
					{/if}

					<div class="flex flex-wrap gap-2">
						{#if selectedEvent.rsvpUrl}
							<a
								href={selectedEvent.rsvpUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1.5 rounded-full bg-[#00A63E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#008f35]"
							>
								{$_('events.rsvp')}
							</a>
						{/if}
						{#if selectedEvent.websiteUrl}
							<a
								href={selectedEvent.websiteUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
							>
								<ExternalLink class="h-3.5 w-3.5" />
								{$_('events.moreInfo')}
							</a>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
