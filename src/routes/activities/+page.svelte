<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/landing/Header.svelte';
	import Calendar from '$lib/components/landing/Calendar.svelte';
	import Activities from '$lib/components/landing/Activities.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { isMobile as checkIsMobile } from '$lib/utils';
	import { _, locale } from 'svelte-i18n';
	import { urls } from '$lib/config/urls';
	import { CalendarDays, LayoutGrid, Plus } from '@lucide/svelte';
	import type { CommunityEvent, EventsData } from '$lib/types/event';

	let isMobile = $state(false);
	let activeView = $state<'calendar' | 'events'>('events');
	let events = $state<CommunityEvent[]>([]);
	let loading = $state(true);

	function checkMobile() {
		isMobile = checkIsMobile();
	}

	async function fetchEvents() {
		try {
			const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

			let data: EventsData | null = null;

			if (!isLocal) {
				try {
					const res = await fetch(urls.eventsJson);
					if (res.ok) data = await res.json();
				} catch {
					// Remote fetch failed, will try local
				}
			}

			if (!data) {
				const res = await fetch('/data/sample-events.json');
				if (res.ok) data = await res.json();
			}

			events = data?.events ?? [];
		} catch (err) {
			console.error('Failed to fetch events:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		checkMobile();
		const resizeHandler = () => checkMobile();
		window.addEventListener('resize', resizeHandler);
		fetchEvents();
		return () => {
			window.removeEventListener('resize', resizeHandler);
		};
	});
</script>

<svelte:head>
	<title>{$_('events.title')} - Hejje Gala</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFCF8]">
	<Header {isMobile} />

	<section class="bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-16'}">
		<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-3 sm:px-4 md:px-6">
			<div class="rounded-lg border bg-white {isMobile ? 'p-3 sm:p-4' : 'p-8 lg:p-12'}">
				<!-- Title -->
				<h2
					class="text-center leading-tight font-bold {isMobile
						? 'text-xl sm:text-2xl mb-4'
						: 'text-3xl lg:text-4xl mb-6'}"
				>
					<span class="text-[#DB3E3E]">{$_('events.title')}</span>
				</h2>

				<p
					class="mx-auto max-w-2xl text-center text-gray-600 {isMobile
						? 'text-sm mb-4'
						: 'text-base mb-8'}"
				>
					{$_('events.description')}
				</p>

				<!-- View toggle + Add Event -->
				<div
					class="flex flex-wrap items-center justify-center gap-3 {isMobile ? 'mb-4' : 'mb-8'}"
				>
					<div class="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
						<button
							type="button"
							onclick={() => (activeView = 'calendar')}
							class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeView ===
							'calendar'
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-500 hover:text-gray-700'}"
						>
							<CalendarDays class="h-4 w-4" />
							{$_('events.calendarView')}
						</button>
						<button
							type="button"
							onclick={() => (activeView = 'events')}
							class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeView ===
							'events'
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-500 hover:text-gray-700'}"
						>
							<LayoutGrid class="h-4 w-4" />
							{$_('events.eventsView')}
						</button>
					</div>

					<a
						href="/activities/add"
						class="flex items-center gap-1.5 rounded-full bg-[#00A63E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#008f35]"
					>
						<Plus class="h-4 w-4" />
						{$_('events.addEvent')}
					</a>
				</div>

				<!-- Content -->
				{#if loading}
					<div class="flex items-center justify-center py-20">
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00A63E]"
						></div>
					</div>
				{:else if events.length === 0}
					<div class="py-20 text-center text-gray-400">
						{$_('events.noEvents')}
					</div>
				{:else if activeView === 'calendar'}
					<Calendar {isMobile} {events} />
				{:else}
					<Activities {isMobile} {events} />
				{/if}
			</div>
		</div>
	</section>

	<Footer {isMobile} />
</div>
