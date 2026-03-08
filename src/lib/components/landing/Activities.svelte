<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { _, locale } from 'svelte-i18n';
	import { urls } from '$lib/config/urls';
	import { parseCSV } from '$lib/utils';
	import { MapPin, Users, Route, Camera, ChevronDown, ChevronUp } from '@lucide/svelte';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	const TYPE_COLORS: Record = {
		Walk: '#22c55e',
		Cycle: '#3b82f6',
		Other: '#f59e0b'
	};

	const TYPE_KEYS: Record = {
		Walk: 'activities.walk',
		Cycle: 'activities.cycle',
		Other: 'activities.other'
	};

	const DATE_LOCALE_MAP: Record = {
		en: 'en-IN',
		kn: 'kn-IN'
	};

	interface Activity {
		id: string;
		type: string;
		date: string;
		groupType: string;
		championName: string;
		participants: string;
		route: string;
		distance: string;
		photos: string[];
		observations: string;
		inputs: string;
	}

	let activities = $state([]);
	let championMap = $state(new Map());
	let loading = $state(true);
	let filterType = $state('all');
	let expandedId = $state(null);

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

	function parseActivities(text: string): Activity[] {
		const rows = parseCSV(text);
		if (rows.length < 2) return [];

		const headers = rows[0].map((h) => h.toLowerCase());
		const typeIdx = headers.findIndex((h) => h.includes('type of activity') || h === 'type');
		const dateIdx = headers.findIndex((h) => h.includes('date'));
		const groupIdx = headers.findIndex((h) => h.includes('group') || h.includes('individual'));
		const partIdx = headers.findIndex((h) => h.includes('participant'));
		const routeIdx = headers.findIndex((h) => h.includes('route') || h.includes('start point'));
		const distIdx = headers.findIndex((h) => h.includes('distance'));
		const startCountIdx = headers.findIndex((h) => h.includes('starting') && h.includes('count'));
		const photoIdx = headers.findIndex((h) => h.includes('photo'));
		const obsIdx = headers.findIndex((h) => h.includes('observation'));
		const inputIdx = headers.findIndex((h) => h.includes('input') && h.includes('authorit'));
		const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));

		return rows
			.slice(1)
			.map((row, i) => {
				const rawType = typeIdx !== -1 ? row[typeIdx] || '' : '';
				let type = 'Other';
				if (rawType.toLowerCase().includes('walk')) type = 'Walk';
				else if (rawType.toLowerCase().includes('cycle') || rawType.toLowerCase().includes('bike'))
					type = 'Cycle';

				const photoStr = photoIdx !== -1 ? row[photoIdx] || '' : '';
				const photos = photoStr
					? photoStr
							.split(/[,;\n]/)
							.map((p) => p.trim())
							.filter(Boolean)
					: [];

				const participants =
					startCountIdx !== -1 && row[startCountIdx]
						? row[startCountIdx]
						: partIdx !== -1
							? row[partIdx] || ''
							: '';

				const email = emailIdx !== -1 ? (row[emailIdx] || '').trim().toLowerCase() : '';

				return {
					id: String(i),
					type,
					date: dateIdx !== -1 ? row[dateIdx] || '' : '',
					groupType: groupIdx !== -1 ? row[groupIdx] || '' : '',
					championName: email && championMap.has(email) ? championMap.get(email)! : '',
					participants,
					route: routeIdx !== -1 ? row[routeIdx] || '' : '',
					distance: distIdx !== -1 ? row[distIdx] || '' : '',
					photos,
					observations: obsIdx !== -1 ? row[obsIdx] || '' : '',
					inputs: inputIdx !== -1 ? row[inputIdx] || '' : ''
				};
			})
			.filter((a) => a.date !== '');
	}

	async function fetchActivities() {
		try {
			const [activitiesRes, championsRes] = await Promise.all([
				fetch(urls.activitiesSheet),
				fetch(urls.championsSheet)
			]);
			const championsText = await championsRes.text();
			championMap = parseChampions(championsText);
			const activitiesText = await activitiesRes.text();
			activities = parseActivities(activitiesText);
		} catch (err) {
			console.error('Failed to fetch activities:', err);
		} finally {
			loading = false;
		}
	}

	let filtered = $derived(
		filterType === 'all' ? activities : activities.filter((a) => a.type === filterType)
	);

	function parseDate(dateStr: string): Date | null {
		const dmy = dateStr.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
		if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
		const fallback = new Date(dateStr);
		return isNaN(fallback.getTime()) ? null : fallback;
	}

	function formatDate(dateStr: string): string {
		const date = parseDate(dateStr);
		if (!date) return dateStr;
		const dateLoc = DATE_LOCALE_MAP[$locale || 'en'] || 'en-IN';
		return date.toLocaleDateString(dateLoc, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function toggleExpand(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	onMount(fetchActivities);
</script>

<section class="bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-16'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-3 sm:px-4 md:px-6">
		<div class="rounded-lg border bg-white {isMobile ? 'p-3 sm:p-4' : 'p-8 lg:p-12'}">
			<h2
				class="text-center leading-tight font-bold {isMobile
					? 'text-xl sm:text-2xl mb-4'
					: 'text-3xl lg:text-4xl mb-8'}"
			>
				<span class="text-[#DB3E3E]">{$_('activities.title')}</span>
			</h2>

			<p
				class="mx-auto max-w-2xl text-center text-gray-600 {isMobile
					? 'text-sm mb-4'
					: 'text-base mb-8'}"
			>
				{$_('activities.description')}
			</p>

			{#if loading}
				<div class="flex items-center justify-center py-20">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#0D6BA3]"
					></div>
				</div>
			{:else if activities.length === 0}
				<div class="py-20 text-center text-gray-400">
					{$_('activities.noActivities')}
				</div>
			{:else}
				<div class="flex flex-wrap items-center justify-center gap-2 {isMobile ? 'mb-4' : 'mb-8'}">
					<button
						type="button"
						onclick={() => (filterType = 'all')}
						class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {filterType ===
						'all'
							? 'bg-gray-900 text-white'
							: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
					>
						{$_('activities.all')}
					</button>
					{#each ['Walk', 'Cycle', 'Other'] as t}
						<button
							type="button"
							onclick={() => (filterType = t)}
							class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors {filterType ===
							t
								? 'text-white'
								: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
							style={filterType === t ? `background-color: ${TYPE_COLORS[t]}` : ''}
						>
							{$_(TYPE_KEYS[t])}
						</button>
					{/each}
				</div>

				<div
					class="grid gap-4 {isMobile
						? 'grid-cols-1 sm:grid-cols-2'
						: 'grid-cols-2 lg:grid-cols-3'}"
				>
					{#each filtered as activity, i (activity.id)}
						<div
							class="group overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm transition-shadow hover:shadow-md"
							in:fade={{ duration: 150, delay: i * 30 }}
						>
							<!-- Photo / Placeholder Header -->
							<button
								type="button"
								onclick={() => toggleExpand(activity.id)}
								class="w-full text-left"
							>
								<div class="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
									{#if activity.photos.length > 0}
										<img
											src={activity.photos[0]}
											alt={$_('activities.photoAlt')}
											class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
											loading="lazy"
										/>
										{#if activity.photos.length > 1}
											<span
												class="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white"
											>
												<Camera class="h-3 w-3" />
												{activity.photos.length}
											</span>
										{/if}
									{:else}
										<div class="flex h-full items-center justify-center">
											<div
												class="flex h-12 w-12 items-center justify-center rounded-full opacity-30"
												style="background-color: {TYPE_COLORS[activity.type] || TYPE_COLORS.Other}"
											>
												<Route class="h-6 w-6 text-white" />
											</div>
										</div>
									{/if}
									<!-- Type badge overlay -->
									<span
										class="absolute top-2 left-2 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
										style="background-color: {TYPE_COLORS[activity.type] || TYPE_COLORS.Other}"
									>
										{$_(TYPE_KEYS[activity.type] || 'activities.other')}
									</span>
								</div>

								<!-- Card Body -->
								<div class="p-4">
									<div class="mb-2 flex items-start justify-between gap-2">
										<h3 class="text-sm font-semibold leading-snug text-gray-900">
											{activity.championName || $_(TYPE_KEYS[activity.type] || 'activities.other')}
										</h3>
										{#if expandedId === activity.id}
											<ChevronUp class="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
										{:else}
											<ChevronDown class="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
										{/if}
									</div>

									<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
										<span>{formatDate(activity.date)}</span>
										{#if activity.participants}
											<span class="flex items-center gap-1">
												<Users class="h-3 w-3" />
												{activity.participants}
											</span>
										{/if}
										{#if activity.distance}
											<span class="flex items-center gap-1">
												<Route class="h-3 w-3" />
												{activity.distance}
											</span>
										{/if}
									</div>
								</div>
							</button>

							<!-- Expanded Details -->
							{#if expandedId === activity.id}
								<div
									class="border-t border-gray-100 px-4 pb-4 pt-3"
									transition:fade={{ duration: 150 }}
								>
									{#if activity.route}
										<div class="mb-3">
											<span class="text-xs font-medium uppercase tracking-wide text-gray-400">
												{$_('activities.route')}
											</span>
											<p class="mt-1 flex items-start gap-1.5 text-sm text-gray-700">
												<MapPin class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
												{activity.route}
											</p>
										</div>
									{/if}

									{#if activity.observations}
										<div class="mb-3">
											<span class="text-xs font-medium uppercase tracking-wide text-gray-400">
												{$_('activities.observations')}
											</span>
											<p class="mt-1 text-sm leading-relaxed text-gray-700">
												{activity.observations}
											</p>
										</div>
									{/if}

									{#if activity.inputs}
										<div class="mb-3">
											<span class="text-xs font-medium uppercase tracking-wide text-gray-400">
												{$_('activities.inputsToAuthorities')}
											</span>
											<p class="mt-1 text-sm leading-relaxed text-gray-700">{activity.inputs}</p>
										</div>
									{/if}

									{#if activity.photos.length > 0}
										<div>
											<span
												class="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400"
											>
												<Camera class="h-3.5 w-3.5" />
												{$_('activities.photos')} ({activity.photos.length})
											</span>
											<div class="mt-2 grid grid-cols-2 gap-2">
												{#each activity.photos as photo, pi}
													<a
														href={photo}
														target="_blank"
														rel="noopener noreferrer"
														class="group/photo relative block aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-all hover:border-gray-300 hover:shadow-md"
													>
														<img
															src={photo}
															alt="{$_('activities.photoAlt')} {pi + 1}"
															class="h-full w-full object-cover transition-transform duration-300 group-hover/photo:scale-105"
															loading="lazy"
														/>
													</a>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>

				{#if filtered.length === 0}
					<div class="py-12 text-center text-gray-400">
						{$_('common.noDataAvailable')}
					</div>
				{/if}
			{/if}
		</div>
	</div>
</section>
