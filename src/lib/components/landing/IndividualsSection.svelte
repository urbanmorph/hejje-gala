<script lang="ts">
	import { onMount } from 'svelte';
	import { urls } from '$lib/config/urls';
	import { _, locale } from 'svelte-i18n';
	import type { CommunityEvent, EventsData } from '$lib/types/event';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	let upcomingEvents = $state<CommunityEvent[]>([]);
	let isLoading = $state(true);

	const typeColors: Record<string, string> = {
		Walk: 'bg-green-100 text-green-700 border-green-200',
		Cycle: 'bg-blue-100 text-blue-700 border-blue-200',
		Other: 'bg-amber-100 text-amber-700 border-amber-200'
	};

	const typeIcons: Record<string, string> = {
		Walk: '🚶',
		Cycle: '🚴',
		Other: '📅'
	};

	const getDateFormatLocale = (i18nLocale: string | null | undefined): string => {
		const localeMap: Record<string, string> = { en: 'en-IN', kn: 'kn-IN' };
		return localeMap[i18nLocale || 'en'] || 'en-IN';
	};

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;
		return date.toLocaleDateString(getDateFormatLocale($locale), {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		});
	}

	async function fetchEvents() {
		try {
			const isLocal = typeof window !== 'undefined' &&
				(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

			let data: EventsData | null = null;

			if (!isLocal) {
				try {
					const res = await fetch(urls.eventsJson);
					if (res.ok) data = await res.json();
				} catch {
					// Remote failed, try local
				}
			}

			if (!data && isLocal) {
				const res = await fetch('/data/sample-events.json');
				if (res.ok) data = await res.json();
			}

			if (!data) return;

			const now = new Date();
			now.setHours(0, 0, 0, 0);

			upcomingEvents = data.events
				.filter((e) => new Date(e.startDate) >= now)
				.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
				.slice(0, 4);
		} catch (err) {
			console.error('Error fetching events:', err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchEvents();
	});
</script>

<div class="flex flex-col h-full">
	<div class="mb-3 sm:mb-4">
		<h3 class="text-lg sm:text-xl xl:text-2xl font-bold text-gray-900">
			<span class="text-[#00A63E]">{$_('citizenLeaders.title')}</span>
		</h3>
		<p class="text-xs sm:text-sm xl:text-base font-semibold text-gray-900 mt-1">
			{$_('citizenLeaders.subtitle')}
		</p>
	</div>

	<!-- Upcoming events -->
	<div class="flex-1">
		<h4 class="text-xs sm:text-sm xl:text-base font-semibold text-gray-800 mb-2 sm:mb-3">{$_('citizenLeaders.upcomingEvents')}</h4>

		{#if isLoading}
			<div class="space-y-2 sm:space-y-3">
				{#each Array(4) as _}
					<div class="h-12 sm:h-16 animate-pulse rounded-lg bg-gray-100"></div>
				{/each}
			</div>
		{:else if upcomingEvents.length > 0}
			<div class="space-y-2 sm:space-y-3">
				{#each upcomingEvents as event}
					{@const date = new Date(event.startDate)}
					<div class="flex items-start gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white p-2 sm:p-3 xl:p-4 hover:shadow-sm transition-shadow">
						<!-- Date badge -->
						<div class="flex-shrink-0 flex flex-col items-center justify-center rounded-lg bg-gray-50 w-10 h-10 sm:w-12 sm:h-12 xl:w-14 xl:h-14 text-xs sm:text-sm">
							<span class="font-bold text-gray-900">
								{date.getDate()}
							</span>
							<span class="text-gray-500 text-[9px] sm:text-[10px] xl:text-xs uppercase">
								{date.toLocaleDateString(getDateFormatLocale($locale), { month: 'short' })}
							</span>
						</div>
						<!-- Event info -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-1 sm:gap-2 mb-0.5">
								<span class="text-xs sm:text-sm">{typeIcons[event.type]}</span>
								<span class="inline-block rounded-full border px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium {typeColors[event.type]}">
									{event.type === 'Walk' ? $_('calendar.walk') : event.type === 'Cycle' ? $_('calendar.cycle') : $_('calendar.event')}
								</span>
							</div>
							<p class="text-xs sm:text-sm font-medium text-gray-900 truncate">{event.title}</p>
							<p class="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">{formatDate(event.startDate)}</p>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="rounded-lg border border-gray-200 bg-gradient-to-br from-[#00A63E]/5 to-[#00A63E]/10 p-4 sm:p-5 text-center">
				<p class="text-2xl sm:text-3xl mb-2">🚶‍♂️ 🚴‍♀️</p>
				<p class="text-sm sm:text-base font-semibold text-gray-800 mb-1">{$_('citizenLeaders.beTheFirst')}</p>
				<p class="text-xs sm:text-sm text-gray-600 mb-3">
					{$_('citizenLeaders.encouragement')}
				</p>
				<a
					href="/activities/add"
					class="inline-flex items-center gap-1.5 rounded-full bg-[#00A63E] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#008a33] transition-colors"
				>
					{$_('citizenLeaders.createEvent')}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
					</svg>
				</a>
			</div>
		{/if}
	</div>

	<!-- CTA -->
	<div class="mt-4 sm:mt-6">
		<a
			href="/activities"
			class="inline-flex items-center gap-2 text-sm xl:text-base font-semibold text-[#00A63E] hover:text-[#008a33] transition-colors"
		>
			{$_('citizenLeaders.viewAllEvents')}
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
			</svg>
		</a>
	</div>
</div>
