<script lang="ts">
	import { onMount } from 'svelte';
	import { Calendar, DayGrid, Interaction } from '@event-calendar/core';
	import '@event-calendar/core/index.css';
	import { fade, fly } from 'svelte/transition';
	import { X, User } from '@lucide/svelte';
	import { urls } from '$lib/config/urls';
	import { parseCSV } from '$lib/utils';
	import { _, locale } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	const EVENT_COLORS: Record = {
		Walk: '#22c55e',
		Cycle: '#3b82f6',
		Other: '#f59e0b'
	};

	const KIND_KEYS: Record = {
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
			)
			.replace(
				/(?<!\d)((?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4})(?!\d)/g,
				'<a href="tel:$1" class="text-[#0D6BA3] underline">$1</a>'
			);
	}

	const DATE_LOCALE_MAP: Record = {
		en: 'en-IN',
		kn: 'kn-IN'
	};

	interface CalendarEvent {
		id: string;
		title: string;
		start: string;
		end: string;
		kind: string;
		description: string;
		championName: string;
	}

	let plugins = [DayGrid, Interaction];
	let allEvents = $state([]);
	let championMap = $state(new Map());
	let loading = $state(true);
	let selectedEvent = $state(null);

	function classifyEvent(title: string): string {
		const lower = title.toLowerCase();
		if (lower.includes('walk')) return 'Walk';
		if (
			lower.includes('cycle') ||
			lower.includes('cycling') ||
			lower.includes('bike') ||
			lower.includes('ride')
		)
			return 'Cycle';
		return 'Other';
	}

	function normalizeDate(raw: string): string {
		const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
		if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
		return raw;
	}

	function parseChampions(text: string): Map {
		const rows = parseCSV(text);
		if (rows.length < 2) return new Map();

		const headers = rows[0].map((h) => h.toLowerCase());
		const nameIdx = headers.findIndex((h) => h.includes('name') && !h.includes('org'));
		const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));

		if (nameIdx === -1 || emailIdx === -1) return new Map();

		const map = new Map();
		for (const row of rows.slice(1)) {
			const email = (row[emailIdx] || '').trim().toLowerCase();
			const name = row[nameIdx] || '';
			if (email && name) map.set(email, name);
		}
		return map;
	}

	function parseSheetEvents(text: string): CalendarEvent[] {
		const rows = parseCSV(text);
		if (rows.length < 2) return [];

		const headers = rows[0].map((h) => h.toLowerCase());
		const titleIdx = headers.findIndex(
			(h) => h === 'title' || h.includes('event name') || h === 'event'
		);
		const startIdx = headers.findIndex(
			(h) => h === 'start' || h === 'start date' || h.includes('event date')
		);
		const endIdx = headers.findIndex(
			(h) => h === 'end' || h === 'end date' || h.includes('end time')
		);
		const kindIdx = headers.findIndex(
			(h) => h === 'kind' || (h.includes('type') && !h.includes('timestamp'))
		);
		const descIdx = headers.findIndex((h) => h.includes('description') || h === 'desc');
		const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));

		if (titleIdx === -1 || startIdx === -1) return [];

		return rows
			.slice(1)
			.map((row, i) => {
				const title = row[titleIdx] || 'Untitled';
				const kind = kindIdx !== -1 && row[kindIdx] ? row[kindIdx] : classifyEvent(title);
				const start = normalizeDate(row[startIdx] || '');
				const end = endIdx !== -1 && row[endIdx] ? normalizeDate(row[endIdx]) : start;
				const email = emailIdx !== -1 ? (row[emailIdx] || '').trim().toLowerCase() : '';
				return {
					id: String(i),
					title,
					start,
					end,
					kind,
					description: descIdx !== -1 && row[descIdx] ? row[descIdx] : '',
					championName: email && championMap.has(email) ? championMap.get(email)! : ''
				};
			})
			.filter((e) => e.start !== '');
	}

	async function fetchEvents() {
		try {
			const [eventsRes, championsRes] = await Promise.all([
				fetch(urls.eventsSheet),
				fetch(urls.championsSheet)
			]);
			const championsText = await championsRes.text();
			championMap = parseChampions(championsText);
			const eventsText = await eventsRes.text();
			allEvents = parseSheetEvents(eventsText);
		} catch (err) {
			console.error('Failed to fetch calendar events:', err);
		} finally {
			loading = false;
		}
	}

	let calendarEvents = $derived(
		allEvents.map((e) => ({
			id: e.id,
			title: e.title,
			start: e.start,
			end: e.end,
			backgroundColor: EVENT_COLORS[e.kind] || EVENT_COLORS.Other
		}))
	);

	let eventMap = $derived(new Map(allEvents.map((e) => [e.id, e])));

	function formatEventTime(dateStr: string): string {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;
		const dateLoc = DATE_LOCALE_MAP[$locale || 'en'] || 'en-IN';
		if (dateStr.length === 10) {
			return date.toLocaleDateString(dateLoc, {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});
		}
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

	onMount(fetchEvents);
</script>

<section class="bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-16'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-3 sm:px-4 md:px-6">
		<div class="rounded-lg border bg-white {isMobile ? 'p-3 sm:p-4' : 'p-8 lg:p-12'}">
			<h2
				class="text-center leading-tight font-bold {isMobile
					? 'text-xl sm:text-2xl mb-4'
					: 'text-3xl lg:text-4xl mb-8'}"
			>
				<span class="text-[#DB3E3E]">{$_('calendar.title')}</span>
			</h2>

			{#if loading}
				<div class="flex items-center justify-center py-20">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00A63E]"
					></div>
				</div>
			{:else}
				<div class="calendar-wrapper">
					<Calendar {plugins} {options} />
				</div>
			{/if}
		</div>
	</div>
</section>

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
			<div class="rounded-2xl bg-white p-6 shadow-2xl">
				<button
					type="button"
					onclick={closeModal}
					class="absolute top-4 right-4 rounded-full p-2 transition-colors hover:bg-gray-100"
					aria-label={$_('common.close')}
				>
					<X class="h-5 w-5 text-gray-600" />
				</button>

				<div class="mb-4 flex items-center gap-2">
					<span
						class="inline-block h-3 w-3 rounded-full"
						style="background-color: {EVENT_COLORS[selectedEvent.kind] || EVENT_COLORS.Other}"
					></span>
					<span class="text-sm font-medium text-gray-500">
						{$_(KIND_KEYS[selectedEvent.kind] || 'calendar.event')}
					</span>
				</div>

				<h3 id="event-modal-title" class="mb-2 text-xl font-bold text-gray-900">
					{selectedEvent.title}
				</h3>

				{#if selectedEvent.championName}
					<p class="mb-3 flex items-center gap-1.5 text-sm font-medium text-[#0D6BA3]">
						<User class="h-4 w-4" />
						{selectedEvent.championName}
					</p>
				{/if}

				<p class="mb-4 text-sm text-gray-500">
					{formatEventTime(selectedEvent.start)}
					{#if selectedEvent.end && selectedEvent.end !== selectedEvent.start}
						&ndash; {formatEventTime(selectedEvent.end)}
					{/if}
				</p>

				{#if selectedEvent.description}
					<p class="text-sm leading-relaxed text-gray-700">
						{@html linkify(selectedEvent.description)}
					</p>
				{:else}
					<p class="text-sm italic text-gray-400">{$_('calendar.noDescription')}</p>
				{/if}
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
