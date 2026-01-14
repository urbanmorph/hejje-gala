<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { citySectionConfig, type CityViewMode } from '$lib/config/landing';
	import Leaderboard from './Leaderboard.svelte';
	import About from './About.svelte';
	import CompanyStats from './CompanyStats.svelte';
	import { _ } from 'svelte-i18n';

	type CityLeaderboardRow = {
		rank: number;
		corporationId: string;
		name: string;
		activities: number;
		co2OffsetKg: number;
		fuelSavedL: number;
	};

	type CityLeaderboard = {
		city: string;
		updatedAt?: string;
		rows?: CityLeaderboardRow[];
		dimensions?: {
			recreationAll: { rows: CityLeaderboardRow[] };
			recreationWalk: { rows: CityLeaderboardRow[] };
			recreationCycle: { rows: CityLeaderboardRow[] };
			commuteAll: { rows: CityLeaderboardRow[] };
			commuteWalk: { rows: CityLeaderboardRow[] };
			commuteCycle: { rows: CityLeaderboardRow[] };
			transitAll: { rows: CityLeaderboardRow[] };
			transitWalk: { rows: CityLeaderboardRow[] };
			transitCycle: { rows: CityLeaderboardRow[] };
		};
	};

	type Metric = {
		label: string;
		value: string;
		helperText?: string;
	};

	type CorporationLeaderboardRow = {
		rank: number;
		companyId: string;
		name: string;
		activities: number;
		co2OffsetKg: number;
		fuelSavedL: number;
		employees?: number;
		sector?: string;
		location?: string;
		description?: string;
		metrics?: Metric[];
	};

	type CorporationLeaderboard = {
		corporationId: string;
		corporationName: string;
		city: string;
		rows?: CorporationLeaderboardRow[];
		dimensions?: {
			recreationAll: { rows: CorporationLeaderboardRow[] };
			recreationWalk: { rows: CorporationLeaderboardRow[] };
			recreationCycle: { rows: CorporationLeaderboardRow[] };
			commuteAll: { rows: CorporationLeaderboardRow[] };
			commuteWalk: { rows: CorporationLeaderboardRow[] };
			commuteCycle: { rows: CorporationLeaderboardRow[] };
			transitAll: { rows: CorporationLeaderboardRow[] };
			transitWalk: { rows: CorporationLeaderboardRow[] };
			transitCycle: { rows: CorporationLeaderboardRow[] };
		};
	};

	// City-level leaderboard state
	let cityLeaderboard: CityLeaderboard | null = null;
	let cityLeaderboardLoading = true;
	let cityLeaderboardError: string | null = null;

	// Corporation-level leaderboard state, keyed by corporation id
	let corporationLeaderboards: Record = {};
	let corporationLeaderboardLoading: Record = {};
	let corporationLeaderboardError: Record = {};

	// Selections - initialized from URL params, then synced to URL
	let selectedCorporationId: string | null = null;
	let selectedCompanyId: string | null = null;

	// Dimension filters
	type ActivityType = 'commute' | 'recreation' | 'transit';
	type ModeType = 'all' | 'walk' | 'cycle';
	let selectedActivityType: ActivityType = 'commute';
	let selectedModeType: ModeType = 'all';

	// Mode - derived from URL params or selections
	$: mode =
		($page.url.searchParams.get('view') as CityViewMode) ||
		(selectedCompanyId ? 'company' : selectedCorporationId ? 'corporation' : 'city');

	// Helper function to get dimension key
	const getDimensionKey = (activityType: ActivityType, modeType: ModeType): string => {
		return `${activityType}${modeType.charAt(0).toUpperCase() + modeType.slice(1)}` as string;
	};

	// Helper function to get current rows from city leaderboard
	const getCurrentCityRows = (leaderboard: CityLeaderboard | null): CityLeaderboardRow[] => {
		if (!leaderboard) return [];

		// Check if new dimensions structure exists
		if (leaderboard.dimensions) {
			const dimensionKey = getDimensionKey(selectedActivityType, selectedModeType);
			const dimension = leaderboard.dimensions[dimensionKey as keyof typeof leaderboard.dimensions];
			return dimension?.rows || [];
		}

		// Fallback to old structure
		return leaderboard.rows || [];
	};

	// Helper function to get current rows from corporation leaderboard
	const getCurrentCorporationRows = (
		leaderboard: CorporationLeaderboard | null
	): CorporationLeaderboardRow[] => {
		if (!leaderboard) return [];

		// Check if new dimensions structure exists
		if (leaderboard.dimensions) {
			const dimensionKey = getDimensionKey(selectedActivityType, selectedModeType);
			const dimension = leaderboard.dimensions[dimensionKey as keyof typeof leaderboard.dimensions];
			return dimension?.rows || [];
		}

		// Fallback to old structure
		return leaderboard.rows || [];
	};

	// Derived state from JSON data
	$: currentCityRows = getCurrentCityRows(cityLeaderboard);
	$: selectedCorporationRow =
		currentCityRows.find((row) => row.corporationId === selectedCorporationId) ??
		currentCityRows[0] ??
		null;

	$: selectedCorporationLeaderboard = selectedCorporationId
		? corporationLeaderboards[selectedCorporationId]
		: null;
	$: currentCorporationRows = getCurrentCorporationRows(selectedCorporationLeaderboard);

	$: selectedCompanyRow =
		currentCorporationRows.find((row) => row.companyId === selectedCompanyId) ??
		currentCorporationRows[0] ??
		null;

	const updateURL = (
		view: CityViewMode,
		corpId?: string | null,
		companyId?: string | null,
		replaceState = false
	) => {
		const params = new URLSearchParams();

		if (view !== 'city') {
			params.set('view', view);
		}

		if (corpId) {
			params.set('corp', corpId);
		}

		if (companyId) {
			params.set('company', companyId);
		}

		const queryString = params.toString();
		const newUrl = queryString ? `?${queryString}` : '';

		// Use replaceState only for initial sync, otherwise create history entries for back/forward
		goto(newUrl, { replaceState, noScroll: true });
	};

	const setMode = (nextMode: CityViewMode) => {
		updateURL(nextMode, selectedCorporationId, selectedCompanyId);
	};

	const handleCorporationChange = (corporationId: string) => {
		selectedCorporationId = corporationId;
		selectedCompanyId = null; // Reset company when changing corporation
		loadCorporationLeaderboard(corporationId);
		updateURL('corporation', corporationId, null);
	};

	const handleCompanyChange = (companyId: string) => {
		selectedCompanyId = companyId;
		updateURL('company', selectedCorporationId, companyId);
	};

	const navigateToCity = () => {
		selectedCorporationId = null;
		selectedCompanyId = null;
		// Navigate to base URL (no query params) for city view
		goto($page.url.pathname, { replaceState: false, noScroll: true });
	};

	const navigateToCorporation = (corporationId: string) => {
		selectedCorporationId = corporationId;
		selectedCompanyId = null;
		loadCorporationLeaderboard(corporationId);
		updateURL('corporation', corporationId, null);
	};

	const loadCorporationLeaderboard = async (corporationId: string) => {
		// Avoid refetching if already in the middle of loading
		if (corporationLeaderboardLoading[corporationId]) {
			return;
		}

		corporationLeaderboardLoading = {
			...corporationLeaderboardLoading,
			[corporationId]: true
		};

		try {
			// Handle "all" as a special case to load All.json
			const filename = corporationId === 'all' ? 'All.json' : `${corporationId}.json`;
			const res = await fetch(`https://assets.hejjegala.in/leaderboard/${filename}`);
			if (!res.ok) {
				throw new Error(`Failed to load leaderboard for ${corporationId}`);
			}

			const data: CorporationLeaderboard = await res.json();
			corporationLeaderboards = {
				...corporationLeaderboards,
				[corporationId]: data
			};
			corporationLeaderboardError = { ...corporationLeaderboardError, [corporationId]: '' };

			// Set default company selection if not already set
			const rows = getCurrentCorporationRows(data);
			if (!selectedCompanyId && rows.length > 0) {
				selectedCompanyId = rows[0].companyId;
			}
		} catch (error) {
			console.error(error);
			corporationLeaderboardError = {
				...corporationLeaderboardError,
				[corporationId]: 'Could not load corporation leaderboard.'
			};
		} finally {
			corporationLeaderboardLoading = {
				...corporationLeaderboardLoading,
				[corporationId]: false
			};
		}
	};

	// Sync state from URL params when URL changes (for browser back/forward)
	$: {
		if (cityLeaderboard) {
			const urlCorpId = $page.url.searchParams.get('corp');
			const urlCompanyId = $page.url.searchParams.get('company');
			const urlView = $page.url.searchParams.get('view') as CityViewMode | null;

			// Only update if URL params differ from current state (to avoid loops)
			if (urlCorpId && urlCorpId !== selectedCorporationId) {
				selectedCorporationId = urlCorpId;
				loadCorporationLeaderboard(urlCorpId);
			} else if (
				!urlCorpId &&
				selectedCorporationId &&
				urlView !== 'corporation' &&
				urlView !== 'company'
			) {
				// Reset if no corp in URL and not in corporation/company view
				selectedCorporationId = null;
				selectedCompanyId = null;
			}

			if (urlCompanyId && urlCompanyId !== selectedCompanyId) {
				selectedCompanyId = urlCompanyId;
			} else if (!urlCompanyId && selectedCompanyId && urlView !== 'company') {
				selectedCompanyId = null;
			}
		}
	}

	onMount(async () => {
		try {
			const res = await fetch('https://assets.hejjegala.in/leaderboard/city.json');
			if (!res.ok) {
				throw new Error('Failed to load city leaderboard');
			}

			const data: CityLeaderboard = await res.json();
			cityLeaderboard = data;
			cityLeaderboardError = null;

			// Initialize from URL params if present
			const urlCorpId = $page.url.searchParams.get('corp');
			const urlCompanyId = $page.url.searchParams.get('company');

			// Get current rows (handles both old and new structure)
			const rows = getCurrentCityRows(cityLeaderboard);

			// Handle "all" as a special case (Overall option)
			if (urlCorpId === 'all') {
				selectedCorporationId = 'all';
				await loadCorporationLeaderboard('all');

				// After loading corporation, set company if specified
				if (urlCompanyId && corporationLeaderboards['all']) {
					const corpData = corporationLeaderboards['all'];
					const corpRows = getCurrentCorporationRows(corpData);
					if (corpRows.some((row: CorporationLeaderboardRow) => row.companyId === urlCompanyId)) {
						selectedCompanyId = urlCompanyId;
					}
				}
			} else if (urlCorpId && rows.some((row) => row.corporationId === urlCorpId)) {
				selectedCorporationId = urlCorpId;
				await loadCorporationLeaderboard(urlCorpId);

				// After loading corporation, set company if specified
				if (urlCompanyId && corporationLeaderboards[urlCorpId]) {
					const corpData = corporationLeaderboards[urlCorpId];
					const corpRows = getCurrentCorporationRows(corpData);
					if (corpRows.some((row: CorporationLeaderboardRow) => row.companyId === urlCompanyId)) {
						selectedCompanyId = urlCompanyId;
					}
				}
			} else if (rows.length > 0) {
				// Set default corporation selection if no URL params
				selectedCorporationId = rows[0].corporationId;
				loadCorporationLeaderboard(rows[0].corporationId);
			}
		} catch (error) {
			console.error(error);
			cityLeaderboardError = 'Could not load city leaderboard.';
		} finally {
			cityLeaderboardLoading = false;
		}
	});
</script>

<section class="pt-16 pb-0 bg-[#FFFCF8]">
	<div class="mx-auto max-w-[80%] px-6">
		<!-- Section header with pill-style mode selector -->
		<div class="mb-8 flex flex-col items-center gap-4">
			<h2 class="text-2xl font-bold text-[#FF2473]">
				{#if mode === 'city'}
					{cityLeaderboard?.city || 'Bengaluru'} City
				{:else if mode === 'corporation'}
					{selectedCorporationLeaderboard?.corporationName || 'Corporation'}
				{:else}
					{selectedCompanyRow?.name || 'Company'}
				{/if}
			</h2>

			<div class="w-full max-w-3xl">
				<div
					class="flex rounded-full border-2 border-[#00A640] px-1 py-1 shadow-sm text-sm font-semibold text-[#111827]"
				>
					<button
						type="button"
						class="flex-1 rounded-full px-6 py-2 transition-all
							{mode === 'city' ? 'bg-[#00A640] text-white shadow-sm' : 'text-slate-900'}"
						on:click={() => setMode('city')}
					>
						{$_('cityCorporationCompany.city')}
					</button>
					<button
						type="button"
						class="flex-1 border-l border-[#CDEFD8] rounded-full px-6 py-2 transition-all
							{mode === 'corporation' ? 'bg-[#00A640] text-white shadow-sm' : 'text-slate-900'}"
						on:click={() => setMode('corporation')}
					>
						{$_('cityCorporationCompany.corporation')}
					</button>
					<button
						type="button"
						class="flex-1 border-l border-[#CDEFD8] rounded-full px-6 py-2 transition-all
							{mode === 'company' ? 'bg-[#00A640] text-white shadow-sm' : 'text-slate-900'}"
						on:click={() => setMode('company')}
					>
						{$_('cityCorporationCompany.company')}
					</button>
				</div>
			</div>
		</div>

		<!-- Content area -->
		{#if mode === 'city'}
			<!-- City view with selectable corporations -->
			{#if cityLeaderboardLoading}
				<div class="px-4 py-6 text-center text-xs text-gray-500">
					{$_('cityCorporationCompany.loadingCityData')}
				</div>
			{:else if cityLeaderboardError}
				<div class="px-4 py-6 text-center text-xs text-red-500">{cityLeaderboardError}</div>
			{:else if cityLeaderboard}
				<About mode="city" name={cityLeaderboard.city} description={$_('about.cityDescription')} />
				<!-- Overall button to view all companies -->
				<div class="mb-6 flex justify-center">
					<button
						type="button"
						class="rounded-full border-2 border-[#00A640] bg-white px-8 py-3 text-sm font-semibold text-[#00A640] transition-all hover:bg-[#00A640] hover:text-white shadow-sm"
						on:click={() => navigateToCorporation('all')}
					>
						Overall
					</button>
				</div>
				<Leaderboard
					dataUrl="https://assets.hejjegala.in/leaderboard/city.json"
					initialFilter="cycling"
					showSearch
					showFilters
					title={$_('cityCorporationCompany.cityLeaderboard')}
					context="city"
				/>
			{/if}
		{:else if mode === 'corporation'}
			<!-- Corporation view with selectable companies -->
			{#if !selectedCorporationLeaderboard}
				<div class="px-4 py-6 text-center text-xs text-gray-500">
					{$_('cityCorporationCompany.loadingCorporationData')}
				</div>
			{:else if selectedCorporationId}
				{@const leaderboardUrl = `https://assets.hejjegala.in/leaderboard/${selectedCorporationId === 'all' ? 'All.json' : `${selectedCorporationId}.json`}`}
				{@const leaderboardTitle = `${selectedCorporationLeaderboard?.corporationName || $_('cityCorporationCompany.corporation')} ${$_('leaderboard.title')}`}
				<About
					mode="corporation"
					name={selectedCorporationLeaderboard?.corporationName}
					description={$_('about.corporationDescription')}
					location={selectedCorporationLeaderboard?.city}
				/>
				<Leaderboard
					dataUrl={leaderboardUrl}
					initialFilter="cycling"
					showSearch
					showFilters
					title={leaderboardTitle}
					context="corporation"
				/>
			{/if}
		{:else}
			<!-- Company view -->
			{#if !selectedCompanyRow}
				<div class="px-4 py-6 text-center text-xs text-gray-500">
					{$_('cityCorporationCompany.loadingCompanyData')}
				</div>
			{:else}
				<About
					mode="company"
					name={selectedCompanyRow.name}
					description={selectedCompanyRow.description || $_('about.companyDescription')}
					location={selectedCompanyRow.location}
					sector={selectedCompanyRow.sector}
					employees={selectedCompanyRow.employees}
					metrics={selectedCompanyRow.metrics}
				/>
				{#if selectedCompanyId}
					{@const employeeDataUrl = `https://assets.hejjegala.in/leaderboard/${selectedCompanyId}-employee.json`}
					<CompanyStats dataUrl={employeeDataUrl} companyId={selectedCompanyId} />
				{/if}
			{/if}
		{/if}
	</div>
</section>
