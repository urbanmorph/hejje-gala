<script lang="ts">
	import { Calendar, DayGrid, Interaction } from '@event-calendar/core';
	import '@event-calendar/core/index.css';
	import { fade, fly } from 'svelte/transition';
	import { X, MapPin, ExternalLink } from '@lucide/svelte';
	import { _, locale } from 'svelte-i18n';
	import type { CommunityEvent } from '$lib/types/event';

	interface Props {
		isMobile?: boolean;
		events: CommunityEvent[];
		onDateClick?: (date: Date) => void;
	}

	let { isMobile = false, events = [], onDateClick }: Props = $props();

	const EVENT_COLORS: Record<string, string> = {
		Walk: '#22c55e',
		Cycle: '#3b82f6',
		Other: '#f59e0b'
	};

	const KIND_KEYS: Record<string, string> = {
		Walk: 'calendar.walk',
		Cycle: 'calendar.cycle',
		Other: 'calendar.event'
	};

	function linkify(text: string): string {
		const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return escaped
			.replace(
				/(https?:\/\/[^\s<]+)/g,
				'<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#0D6BA3] underline">$1</a>'
			)
			.replace(
				/([\w.+-]+@[\w-]+\.[\w.-]+)/g,
				'<a href="mailto:$1" class="text-[#0D6BA3] underline">$1</a>'
			)
			.replace(
				/(?<![@:\/\/\w])((?:www\.)?[\w-]+\.(?:com|in|net|org|io|co|dev|app|info|biz)(?:\.[\w]{2,3})?(?:\/[^\s<]*)?)/gi,
				(match) => {
					if (match.includes('href=')) return match;
					return `<a href="https://${match}" target="_blank" rel="noopener noreferrer" class="text-[#0D6BA3] underline">${match}</a>`;
				}
			);
	}

	const DATE_LOCALE_MAP: Record<string, string> = {
		en: 'en-IN',
		kn: 'kn-IN'
	};

	let plugins = [DayGrid, Interaction];
	let selectedEvent = $state<CommunityEvent | null>(null);

	let calendarEvents = $derived(
		events.map((e) => ({
			id: e.id,
			title: e.title,
			start: e.startDate,
			end: e.endDate,
			backgroundColor: EVENT_COLORS[e.type] || EVENT_COLORS.Other
		}))
	);

	let eventMap = $derived(new Map(events.map((e) => [e.id, e])));

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

	let options = $derived({
		view: 'dayGridMonth',
		date: new Date(),
		events: calendarEvents,
		headerToolbar: {
			start: 'prev',
			center: 'title',
			end: 'next'
		},
		dayMaxEvents: true,
		eventClick: (info: { event: { id: string } }) => {
			const event = eventMap.get(info.event.id);
			if (event) selectedEvent = event;
		},
		dateClick: (info: { date: Date }) => {
			if (onDateClick) onDateClick(info.date);
		}
	});

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

<div class="calendar-wrapper">
	<Calendar {plugins} {options} />
</div>

{#if selectedEvent}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		onkeydown={handleKeyDown}
		role="presentation"
	>
		<div
			class="relative mx-4 w-full max-w-md"
			transition:fly={{ y: 20, duration: 200 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="event-modal-title"
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
							style="background-color: {EVENT_COLORS[selectedEvent.type] || EVENT_COLORS.Other}"
						></span>
						<span class="text-sm font-medium text-gray-500">
							{$_(KIND_KEYS[selectedEvent.type] || 'calendar.event')}
						</span>
					</div>

					<h3 id="event-modal-title" class="mb-2 text-xl font-bold text-gray-900">
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
					{:else}
						<p class="mb-4 text-sm italic text-gray-400">{$_('calendar.noDescription')}</p>
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

<style>
	.calendar-wrapper :global(.ec) {
		--ec-border-color: #e5e7eb;
		--ec-today-bg-color: rgba(0, 166, 62, 0.08);
		--ec-button-bg-color: #f3f4f6;
		--ec-button-active-bg-color: #e5e7eb;
		font-family: inherit;
	}

	.calendar-wrapper :global(.ec-toolbar) {
		padding: 0 0 0.75rem;
	}

	.calendar-wrapper :global(.ec-title) {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
	}

	.calendar-wrapper :global(.ec-day) {
		cursor: pointer;
	}

	.calendar-wrapper :global(.ec-day:hover) {
		background-color: rgba(0, 166, 62, 0.04);
	}

	.calendar-wrapper :global(.ec-event) {
		border-radius: 4px;
		font-size: 0.75rem;
		padding: 2px 6px;
		cursor: pointer;
	}

	.calendar-wrapper :global(.ec-event:hover) {
		opacity: 0.85;
	}

	.calendar-wrapper :global(.ec-button) {
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	@media (max-width: 640px) {
		.calendar-wrapper :global(.ec-title) {
			font-size: 1rem;
		}

		.calendar-wrapper :global(.ec-event) {
			font-size: 0.65rem;
			padding: 1px 3px;
		}

		.calendar-wrapper :global(.ec-day-head) {
			font-size: 0.75rem;
		}
	}
</style>
