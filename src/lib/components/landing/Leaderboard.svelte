<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { _ } from 'svelte-i18n';

	type ActivityFilter = 'all' | 'recreation' | 'cycling' | 'walking';
	type ActivityType = 'commute' | 'recreation' | 'transit';

	export interface LeaderboardRow {
		rank: number;
		name: string;
		corporationId?: string;
		companyId?: string;
		activities: number;
		co2OffsetKg: number;
		fuelSavedL: number;
		location?: string;
		campus?: string;
		companies?: number;
		employees?: number;
	}

	export interface LeaderboardData {
		dimensions: {
			recreationAll?: { rows: LeaderboardRow[] };
			recreationWalk?: { rows: LeaderboardRow[] };
			recreationCycle?: { rows: LeaderboardRow[] };
			commuteAll?: { rows: LeaderboardRow[] };
			commuteWalk?: { rows: LeaderboardRow[] };
			commuteCycle?: { rows: LeaderboardRow[] };
			transitAll?: { rows: LeaderboardRow[] };
			transitWalk?: { rows: LeaderboardRow[] };
			transitCycle?: { rows: LeaderboardRow[] };
		};
	}

	// Props
	type LeaderboardContext = 'city' | 'corporation' | 'company';

	interface Props {
		dataUrl?: string | null;
		initialFilter?: ActivityFilter;
		showSearch?: boolean;
		showFilters?: boolean;
		title?: string;
		context?: LeaderboardContext;
		isMobile?: boolean;
	}

	let {
		dataUrl = null,
		initialFilter = 'cycling',
		showSearch = true,
		showFilters = true,
		title = 'Corp Leaderboard',
		context = 'city',
		isMobile = false
	}: Props = $props();

	// Get the appropriate name column header based on context
	let nameColumnHeader = $derived(
		context === 'city'
			? $_('leaderboard.corporationName')
			: context === 'corporation'
				? $_('leaderboard.companyName')
				: $_('leaderboard.employeeName')
	);

	let leaderboardData: LeaderboardData | null = $state(null);
	let error: string | null = $state(null);
	let isLoading = $state(true);

	let lastUpdated = $state<Date | null>(null);

	const lastUpdatedText = $derived.by(() => {
		if (!lastUpdated) return '';
		const totalMins = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
		if (totalMins < 1) return $_('leaderboard.justUpdated');
		if (totalMins < 60) return $_('leaderboard.updatedAgo', { values: { time: `${totalMins} min` } });
		const hrs = Math.floor(totalMins / 60);
		const mins = totalMins % 60;
		if (mins === 0) return $_('leaderboard.updatedAgo', { values: { time: `${hrs}h` } });
		return $_('leaderboard.updatedAgo', { values: { time: `${hrs}h ${mins}m` } });
	});

	let searchQuery = $state('');
	let selectedFilter: ActivityFilter = $state(initialFilter);
	let activityTypeDropdownOpen = $state(false);
	let selectedActivityType: ActivityType = $state('commute');

	// Mode toggles (All, Walk, Cycle) - only one can be selected at a time
	type ModeType = 'all' | 'walk' | 'cycle';
	let selectedMode: ModeType = $state('all');

	// Pagination state
	const rowsPerPage = 10;
	let currentPage = $state(1);

	// Helper function to convert URL to assets.hejjegala.in format
	function getAssetsUrl(url: string | null): string | null {
		if (!url) return null;

		// If it's already a full URL, return as is
		if (url.startsWith('http')) {
			return url;
		}

		// If it's an API endpoint, convert to assets.hejjegala.in
		if (url.startsWith('/api/leaderboard/')) {
			const filename = url.replace('/api/leaderboard/', '');
			return `https://assets.hejjegala.in/leaderboard/${filename}`;
		}

		// Extract filename from old URL format
		const match = url.match(/leaderboard\/([^\/]+\.json)$/);
		if (match) {
			return `https://assets.hejjegala.in/leaderboard/${match[1]}`;
		}

		// Return original URL if pattern doesn't match
		return url;
	}

	// Fetch leaderboard data
	async function loadLeaderboard() {
		if (!dataUrl) {
			isLoading = false;
			return;
		}

		try {
			isLoading = true;
			error = null;

			const assetsUrl = getAssetsUrl(dataUrl);
			const response = await fetch(assetsUrl || dataUrl);
			if (!response.ok) {
				throw new Error(`Failed to load leaderboard (${response.status})`);
			}

			const lastModified = response.headers.get('last-modified');
			if (lastModified) {
				lastUpdated = new Date(lastModified);
			}

			const data: LeaderboardData = await response.json();
			leaderboardData = data;
		} catch (err) {
			console.error('Error loading leaderboard:', err);
			error = err instanceof Error ? err.message : 'Failed to load leaderboard data';
		} finally {
			isLoading = false;
		}
	}

	// Reload when dataUrl changes
	$effect(() => {
		if (dataUrl) {
			loadLeaderboard();
		}
	});

	// Get current rows based on selected activity type and mode
	let rows = $derived.by(() => {
		if (!leaderboardData) return [];

		// Get the dimension key based on selected mode
		const modeKey = selectedMode === 'all' ? 'All' : selectedMode === 'walk' ? 'Walk' : 'Cycle';
		const key = `${selectedActivityType}${modeKey}` as keyof LeaderboardData['dimensions'];
		const dimension = leaderboardData.dimensions[key];

		const rawRows = dimension?.rows || [];

		// Sort by score (activities as proxy), then participants, then re-rank
		return [...rawRows]
			.sort((a, b) => {
				const scoreA = a.activities + a.co2OffsetKg + a.fuelSavedL;
				const scoreB = b.activities + b.co2OffsetKg + b.fuelSavedL;
				if (scoreB !== scoreA) return scoreB - scoreA;
				return (b.employees ?? 0) - (a.employees ?? 0);
			})
			.map((row, i) => ({ ...row, rank: i + 1 }));
	});

	// Handle activity type selection
	function selectActivityType(activityType: ActivityType) {
		selectedActivityType = activityType;
		selectedFilter = 'recreation'; // Keep filter as recreation to use the dropdown logic
		activityTypeDropdownOpen = false;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.activity-type-dropdown')) {
			activityTypeDropdownOpen = false;
		}
	}

	// Set up click outside listener
	$effect(() => {
		if (activityTypeDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});

	let filteredRows = $derived.by(() => {
		let filtered: LeaderboardRow[] = rows;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(row: LeaderboardRow) =>
					row.name.toLowerCase().includes(query) ||
					row.location?.toLowerCase().includes(query) ||
					row.campus?.toLowerCase().includes(query)
			);
		}

		return filtered;
	});

	// Paginated rows
	let paginatedRows = $derived.by(() => {
		const startIndex = (currentPage - 1) * rowsPerPage;
		const endIndex = startIndex + rowsPerPage;
		return filteredRows.slice(startIndex, endIndex);
	});

	// Total pages
	let totalPages = $derived(Math.ceil(filteredRows.length / rowsPerPage));

	// Get page numbers to display
	let pageNumbers = $derived.by(() => {
		if (totalPages <= 7) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		const pages: number[] = [];

		// Always show first page
		pages.push(1);

		// Calculate range around current page
		let start = Math.max(2, currentPage - 1);
		let end = Math.min(totalPages - 1, currentPage + 1);

		// Adjust if we're near the start
		if (currentPage <= 3) {
			end = Math.min(4, totalPages - 1);
		}

		// Adjust if we're near the end
		if (currentPage >= totalPages - 2) {
			start = Math.max(2, totalPages - 3);
		}

		// Add pages in range
		for (let i = start; i <= end; i++) {
			if (i > 1 && i < totalPages) {
				pages.push(i);
			}
		}

		// Always show last page
		if (totalPages > 1) {
			pages.push(totalPages);
		}

		return pages;
	});

	// Reset to page 1 when search query or filters change
	$effect(() => {
		// Access reactive values to track them - Svelte will automatically track these
		searchQuery;
		selectedActivityType;
		selectedMode;
		// Reset to page 1 when any of these change
		// We only write to currentPage, so this won't cause an infinite loop
		currentPage = 1;
	});

	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	// Handle row click to navigate to company/corporation page
	function handleRowClick(row: LeaderboardRow) {
		if (context === 'corporation' && row.companyId) {
			// Get corporationId from URL params or from row data
			const corpId = row.corporationId || $page.url.searchParams.get('corp');
			if (corpId) {
				// Navigate to company view from corporation leaderboard
				goto(`/leaderboard?view=company&corp=${corpId}&company=${row.companyId}`, {
					noScroll: true
				});
			}
		} else if (context === 'city' && row.corporationId) {
			// Navigate to corporation view from city leaderboard
			goto(`/leaderboard?view=corporation&corp=${row.corporationId}`, { noScroll: true });
		}
	}
</script>

<div class="mb-16 bg-[#FFFCF8] {isMobile ? 'px-4 py-3' : 'px-6 py-4'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'}">
		{#if showSearch || showFilters}
			<div
				class="flex items-center {isMobile ? 'gap-2' : 'gap-4'} flex-wrap {isMobile
					? 'justify-center'
					: 'justify-end'} mb-4"
			>
				{#if showSearch}
					<!-- Search Bar -->
					<div class="relative">
						<svg
							class="absolute left-3 top-1/2 transform -translate-y-1/2 {isMobile
								? 'w-4 h-4'
								: 'w-5 h-5'} text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<input
							type="text"
							placeholder={$_('common.search')}
							bind:value={searchQuery}
							class="pl-10 pr-4 {isMobile
								? 'py-1.5 text-sm w-full max-w-[280px]'
								: 'py-2 w-60'} rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
						/>
					</div>
				{/if}

				{#if showFilters}
					<!-- Activity Filters -->
					<div class="flex {isMobile ? 'gap-1 flex-wrap justify-center' : 'gap-2'}">
						<!-- Activity Type Dropdown -->
						<div class="relative activity-type-dropdown">
							<button
								onclick={(e) => {
									e.stopPropagation();
									activityTypeDropdownOpen = !activityTypeDropdownOpen;
								}}
								class="{isMobile
									? 'px-3 py-1.5 text-xs'
									: 'px-4 py-2 text-sm'} rounded-full border border-gray-300 font-medium transition-colors flex items-center gap-2 bg-gray-800 text-white border-gray-800"
							>
								{#if selectedActivityType === 'recreation'}
									{$_('leaderboard.recreation')}
								{:else if selectedActivityType === 'commute'}
									{$_('leaderboard.commute')}
								{:else if selectedActivityType === 'transit'}
									{$_('leaderboard.transit')}
								{/if}
								<svg
									class="w-4 h-4 transition-transform {activityTypeDropdownOpen
										? 'rotate-180'
										: ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
							{#if activityTypeDropdownOpen}
								<div
									class="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
								>
									<button
										onclick={(e) => {
											e.stopPropagation();
											selectActivityType('commute');
										}}
										class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg {selectedActivityType ===
										'commute'
											? 'bg-gray-100 font-medium'
											: ''}"
									>
										{$_('leaderboard.commute')}
									</button>
									<button
										onclick={(e) => {
											e.stopPropagation();
											selectActivityType('transit');
										}}
										class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg {selectedActivityType ===
										'transit'
											? 'bg-gray-100 font-medium'
											: ''}"
									>
										{$_('leaderboard.transit')}
									</button>
									<button
										onclick={(e) => {
											e.stopPropagation();
											selectActivityType('recreation');
										}}
										class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg {selectedActivityType ===
										'recreation'
											? 'bg-gray-100 font-medium'
											: ''}"
									>
										{$_('leaderboard.recreation')}
									</button>
								</div>
							{/if}
						</div>
						<!-- Mode Toggle Buttons (mutually exclusive) -->
						<button
							onclick={() => (selectedMode = 'all')}
							class="{isMobile
								? 'px-3 py-1.5 text-xs'
								: 'px-4 py-2 text-sm'} rounded-full border border-gray-300 font-medium transition-colors {selectedMode ===
							'all'
								? 'bg-gray-800 text-white border-gray-800'
								: 'bg-white text-gray-700 hover:bg-gray-50'}"
						>
							{$_('leaderboard.all')}
						</button>
						<button
							onclick={() => (selectedMode = 'walk')}
							class="{isMobile
								? 'px-3 py-1.5 text-xs'
								: 'px-4 py-2 text-sm'} rounded-full border border-gray-300 font-medium transition-colors {selectedMode ===
							'walk'
								? 'bg-gray-800 text-white border-gray-800'
								: 'bg-white text-gray-700 hover:bg-gray-50'}"
						>
							{$_('leaderboard.walk')}
						</button>
						<button
							onclick={() => (selectedMode = 'cycle')}
							class="{isMobile
								? 'px-3 py-1.5 text-xs'
								: 'px-4 py-2 text-sm'} rounded-full border border-gray-300 font-medium transition-colors {selectedMode ===
							'cycle'
								? 'bg-gray-800 text-white border-gray-800'
								: 'bg-white text-gray-700 hover:bg-gray-50'}"
						>
							{$_('leaderboard.cycle')}
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Drill-down hint -->
		{#if context === 'city' || context === 'corporation'}
			<p class="text-[10px] sm:text-xs text-gray-400 mb-2 text-right">
				{$_('leaderboard.clickToExplore')}
			</p>
		{/if}

		<!-- Leaderboard Table -->
		<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 border-b border-gray-200">
						<tr>
							<th
								class="{isMobile
									? 'px-2 py-2 text-xs'
									: 'px-3 py-3 text-sm'} text-left font-semibold text-[#0F172A] tracking-wider"
							>
								#
							</th>
							<th
								class="{isMobile
									? 'px-2 py-2 text-xs'
									: 'px-3 py-3 text-sm'} text-left font-semibold text-[#0F172A] tracking-wider"
							>
								{nameColumnHeader}
							</th>
							{#if context === 'city'}
								<th
									class="{isMobile
										? 'px-2 py-2 text-xs'
										: 'px-3 py-3 text-sm'} text-left font-semibold text-[#0F172A] tracking-wider"
								>
									{$_('leaderboard.companies')}
								</th>
							{/if}
							{#if context !== 'city'}
								<th
									class="{isMobile
										? 'px-2 py-2 text-xs'
										: 'px-3 py-3 text-sm'} text-left font-semibold text-[#0F172A] tracking-wider"
								>
									{$_('leaderboard.campus')}
								</th>
							{/if}
							{#if context === 'corporation'}
								<th
									class="{isMobile
										? 'px-2 py-2 text-xs'
										: 'px-3 py-3 text-sm'} text-left font-semibold text-[#0F172A] tracking-wider"
								>
									{$_('leaderboard.employees')}
								</th>
							{/if}
							<th
								class="{isMobile
									? 'px-2 py-2 text-xs'
									: 'px-3 py-3 text-sm'} text-left font-semibold text-[#0F172A] tracking-wider"
							>
								{$_('leaderboard.activities')}
							</th>
							{#if selectedActivityType !== 'recreation'}
								<th
									class="{isMobile
										? 'px-2 py-2 text-xs'
										: 'px-3 py-3 text-sm'} text-left font-semibold text-[#0F172A] tracking-wider"
								>
									{$_('leaderboard.co2Offset')}
								</th>
								<th
									class="{isMobile
										? 'px-2 py-2 text-xs'
										: 'px-3 py-3 text-sm'} text-left font-semibold text-[#0F172A] tracking-wider"
								>
									{$_('leaderboard.fuelSaved')}
								</th>
							{/if}
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#if isLoading}
							<tr>
								<td
									colspan={(() => {
										let cols = context === 'city' ? 4 : context === 'corporation' ? 5 : 4; // #, Name, (Companies/Campus/Employees), Activities
										if (selectedActivityType !== 'recreation') cols += 2; // CO2, Fuel
										return cols;
									})()}
									class="px-6 py-8 text-center text-gray-500"
								>
									{$_('common.loading')}
								</td>
							</tr>
						{:else if error}
							<tr>
								<td
									colspan={(() => {
										let cols = context === 'city' ? 4 : context === 'corporation' ? 5 : 4; // #, Name, (Companies/Campus/Employees), Activities
										if (selectedActivityType !== 'recreation') cols += 2; // CO2, Fuel
										return cols;
									})()}
									class="px-6 py-8 text-center text-gray-500"
								>
									{error}
								</td>
							</tr>
						{:else if filteredRows.length === 0}
							<tr>
								<td
									colspan={(() => {
										let cols = context === 'city' ? 4 : context === 'corporation' ? 5 : 4; // #, Name, (Companies/Campus/Employees), Activities
										if (selectedActivityType !== 'recreation') cols += 2; // CO2, Fuel
										return cols;
									})()}
									class="px-6 py-8 text-center text-gray-500"
								>
									{$_('common.noDataAvailable')}
								</td>
							</tr>
						{:else}
							{#each paginatedRows as row (row.rank)}
								{@const isClickable =
									(context === 'corporation' && row.companyId) ||
									(context === 'city' && row.corporationId)}
								<tr
									class="hover:bg-gray-50 transition-colors {isClickable ? 'cursor-pointer' : ''}"
									onclick={() => handleRowClick(row)}
									role={isClickable ? 'button' : undefined}
									tabindex={isClickable ? 0 : undefined}
									onkeydown={(e) => {
										if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
											e.preventDefault();
											handleRowClick(row);
										}
									}}
								>
									<!-- Rank -->
									<td class="{isMobile ? 'px-2 py-2' : 'px-3 py-3'} whitespace-nowrap">
										<div class="flex items-center">
											{#if row.rank === 1}
												<svg
													class={isMobile ? 'w-6 h-6' : 'w-8 h-8'}
													viewBox="0 0 24 24"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<circle cx="12" cy="12" r="10" fill="#FFD700" />
													<text
														x="12"
														y="16"
														text-anchor="middle"
														class="text-xs font-bold fill-white"
														style="font-size: 12px;"
													>
														1
													</text>
												</svg>
											{:else if row.rank === 2}
												<svg
													class={isMobile ? 'w-6 h-6' : 'w-8 h-8'}
													viewBox="0 0 24 24"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<circle cx="12" cy="12" r="10" fill="#C0C0C0" />
													<text
														x="12"
														y="16"
														text-anchor="middle"
														class="text-xs font-bold fill-white"
														style="font-size: 12px;"
													>
														2
													</text>
												</svg>
											{:else if row.rank === 3}
												<svg
													class={isMobile ? 'w-6 h-6' : 'w-8 h-8'}
													viewBox="0 0 24 24"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<circle cx="12" cy="12" r="10" fill="#CD7F32" />
													<text
														x="12"
														y="16"
														text-anchor="middle"
														class="text-xs font-bold fill-white"
														style="font-size: 12px;"
													>
														3
													</text>
												</svg>
											{:else}
												<span class="{isMobile ? 'text-xs' : 'text-sm'} text-gray-600 font-medium"
													>{row.rank}</span
												>
											{/if}
										</div>
									</td>

									<!-- Employee Name (placeholder) -->
									<td class="{isMobile ? 'px-2 py-2' : 'px-3 py-3'} max-w-[200px] lg:max-w-[300px]">
										<div class="flex items-center {isMobile ? 'gap-1.5' : 'gap-2'}">
											<div
												class="{isMobile
													? 'w-6 h-6'
													: 'w-8 h-8'} rounded-full bg-green-500 flex-shrink-0"
											></div>
											<span class="{isMobile ? 'text-xs' : 'text-sm'} text-gray-900 font-medium truncate"
												>{row.name}</span
											>
										</div>
									</td>

									{#if context === 'city'}
										<!-- Companies -->
										<td class="{isMobile ? 'px-2 py-2' : 'px-3 py-3'} whitespace-nowrap">
											<span class="{isMobile ? 'text-xs' : 'text-sm'} text-gray-700"
												>{row.companies ?? 0}</span
											>
										</td>
									{/if}

									{#if context !== 'city'}
										<!-- Campus -->
										<td class="{isMobile ? 'px-2 py-2' : 'px-3 py-3'} whitespace-nowrap">
											<span class="{isMobile ? 'text-xs' : 'text-sm'} text-gray-700 font-medium">
												{row.location || row.campus || 'N/A'}
											</span>
										</td>
									{/if}

									{#if context === 'corporation'}
										<!-- Employees -->
										<td class="{isMobile ? 'px-2 py-2' : 'px-3 py-3'} whitespace-nowrap">
											<span class="{isMobile ? 'text-xs' : 'text-sm'} text-gray-700"
												>{formatNumber(row.employees ?? 0)}</span
											>
										</td>
									{/if}

									<!-- Activities -->
									<td class="{isMobile ? 'px-2 py-2' : 'px-3 py-3'} whitespace-nowrap">
										<div class="flex items-center {isMobile ? 'gap-1' : 'gap-2'}">
											<img
												src="/assets/icons/activities.svg"
												alt={$_('leaderboard.activities')}
												class={isMobile ? 'w-4 h-4' : 'w-5 h-5'}
											/>
											<span class="{isMobile ? 'text-xs' : 'text-sm'} text-gray-700"
												>{row.activities}</span
											>
										</div>
									</td>

									{#if selectedActivityType !== 'recreation'}
										<!-- CO2 Offset -->
										<td class="{isMobile ? 'px-2 py-2' : 'px-3 py-3'} whitespace-nowrap">
											<div class="flex items-center {isMobile ? 'gap-1' : 'gap-2'}">
												<img
													src="/assets/icons/co2.svg"
													alt={$_('leaderboard.co2Offset')}
													class={isMobile ? 'w-4 h-4' : 'w-5 h-5'}
												/>
												<span class="{isMobile ? 'text-xs' : 'text-sm'} text-gray-700"
													>{formatNumber(row.co2OffsetKg)}</span
												>
											</div>
										</td>

										<!-- Fuel Saved -->
										<td class="{isMobile ? 'px-2 py-2' : 'px-3 py-3'} whitespace-nowrap">
											<div class="flex items-center {isMobile ? 'gap-1' : 'gap-2'}">
												<img
													src="/assets/icons/fuel.svg"
													alt={$_('leaderboard.fuelSaved')}
													class={isMobile ? 'w-4 h-4' : 'w-5 h-5'}
												/>
												<span class="{isMobile ? 'text-xs' : 'text-sm'} text-gray-700"
													>{formatNumber(row.fuelSavedL)}</span
												>
											</div>
										</td>
									{/if}

										{#if isClickable}
											<td class="{isMobile ? 'px-1 py-2' : 'px-2 py-3'} whitespace-nowrap">
												<svg xmlns="http://www.w3.org/2000/svg" class="{isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400" viewBox="0 0 20 20" fill="currentColor">
													<path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
												</svg>
											</td>
										{/if}
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex items-center justify-center {isMobile ? 'gap-1' : 'gap-2'} mt-6">
				<button
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
					class="{isMobile
						? 'px-2 py-1.5 text-xs'
						: 'px-4 py-2 text-sm'} rounded border border-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 {currentPage ===
					1
						? 'bg-gray-100 text-gray-400'
						: 'bg-white text-gray-700'}"
				>
					&lt;
				</button>

				{#each pageNumbers as pageNum, i}
					{#if i > 0 && pageNum - pageNumbers[i - 1] > 1}
						<span class="{isMobile ? 'px-1 text-xs' : 'px-2'} text-gray-500">...</span>
					{/if}
					<button
						onclick={() => (currentPage = pageNum)}
						class="{isMobile
							? 'px-2 py-1.5 text-xs'
							: 'px-4 py-2 text-sm'} rounded border border-gray-300 font-medium transition-colors {currentPage ===
						pageNum
							? 'bg-gray-800 text-white border-gray-800'
							: 'bg-white text-gray-700 hover:bg-gray-50'}"
					>
						{pageNum}
					</button>
				{/each}

				<button
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					disabled={currentPage === totalPages}
					class="{isMobile
						? 'px-2 py-1.5 text-xs'
						: 'px-4 py-2 text-sm'} rounded border border-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 {currentPage ===
					totalPages
						? 'bg-gray-100 text-gray-400'
						: 'bg-white text-gray-700'}"
				>
					&gt;
				</button>
			</div>
		{/if}

		{#if lastUpdatedText}
			<p class="text-[9px] sm:text-[10px] text-gray-400 text-center mt-4">{lastUpdatedText}</p>
		{/if}
	</div>
</div>

<style>
	/* Ensure table cells align properly */
	table {
		border-collapse: collapse;
	}
</style>
