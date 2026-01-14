<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import CTAButton from './CTAButton.svelte';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	type CorporationRow = {
		rank: number;
		corporationId: string;
		name: string;
		activities: number;
		co2OffsetKg: number;
		fuelSavedL: number;
		moneySaved: number;
		companies: number;
		employees: number;
		score: number;
	};

	type CompanyRow = {
		rank: number;
		companyId: string;
		name: string;
		activities: number;
		co2OffsetKg: number;
		fuelSavedL: number;
		moneySaved: number;
		employees: number;
		score: number;
		sector: string;
		location: string;
		description: string;
		metrics: Array;
		corporationId: string;
		corporationName: string;
	};

	type CityLeaderboard = {
		city: string;
		updatedAt: string;
		dimensions: {
			commuteAll: {
				rows: CorporationRow[];
			};
			commuteCycle: {
				rows: CorporationRow[];
			};
			commuteWalk: {
				rows: CorporationRow[];
			};
		};
	};

	type AllLeaderboard = {
		corporationId: string;
		corporationName: string;
		city: string;
		dimensions: {
			commuteAll: {
				rows: CompanyRow[];
			};
		};
	};

	let topCorporations = $state([]);
	let topCompanies = $state([]);
	let totalCompanies = $state(0);
	let totalCycleActivities = $state(0);
	let totalWalkActivities = $state(0);
	let isLoading = $state(true);
	let error = $state(null);

	async function fetchData() {
		try {
			isLoading = true;
			error = null;

			// Fetch city.json for corporations
			const cityRes = await fetch('https://assets.hejjegala.in/leaderboard/city.json');
			if (!cityRes.ok) {
				throw new Error('Failed to load city leaderboard');
			}
			const cityData: CityLeaderboard = await cityRes.json();

			// Fetch All.json for companies
			const allRes = await fetch('https://assets.hejjegala.in/leaderboard/All.json');
			if (!allRes.ok) {
				throw new Error('Failed to load all leaderboard');
			}
			const allData: AllLeaderboard = await allRes.json();

			// Get top 3 corporations from city.json (commuteAll dimension)
			const corporationRows = cityData.dimensions.commuteAll?.rows || [];
			topCorporations = corporationRows.slice(0, 3);

			// Get top 3 companies from All.json (commuteAll dimension)
			const companyRows = allData.dimensions.commuteAll?.rows || [];
			topCompanies = companyRows.slice(0, 3);

			// Count total companies from All.json
			totalCompanies = companyRows.length;

			// Aggregate cycle activities from city.json across all corporations
			const cycleRows = cityData.dimensions.commuteCycle?.rows || [];
			totalCycleActivities = cycleRows.reduce((sum, row) => sum + (row.activities || 0), 0);

			// Aggregate walk activities from city.json across all corporations
			const walkRows = cityData.dimensions.commuteWalk?.rows || [];
			totalWalkActivities = walkRows.reduce((sum, row) => sum + (row.activities || 0), 0);
		} catch (err) {
			console.error('Error fetching leaderboard data:', err);
			error = err instanceof Error ? err.message : 'Failed to load leaderboard data';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchData();
	});
</script>

<section class="bg-[#FFFCF8] {isMobile ? 'py-8' : 'py-16'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-6xl'} px-6">
		<!-- Title -->
		<h2 class="text-center {isMobile ? 'text-3xl' : 'text-5xl'} font-bold text-[#DB3E3E] mb-8">
			{$_('landingLeaderboard.title')}
		</h2>

		{#if isLoading}
			<div class="text-center py-12">
				<p class="text-gray-600">{$_('landingLeaderboard.loading')}</p>
			</div>
		{:else if error}
			<div class="text-center py-12">
				<p class="text-red-600">{$_('landingLeaderboard.error')}: {error}</p>
			</div>
		{:else}
			<!-- Three Cards Grid -->
			<div class="grid {isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-6 mb-8">
				<!-- Card 1: Top 3 Corporations -->
				<div
					class="rounded-2xl border-1 border-[#00A63E] bg-white {isMobile
						? 'p-4'
						: 'p-6'} shadow-sm transition-shadow hover:shadow-md"
				>
					<h3 class="text-xl font-bold text-gray-900 mb-4 text-center">
						{$_('landingLeaderboard.top3Corporations')}
					</h3>
					<div class="space-y-3 text-center">
						{#if topCorporations.length > 0}
							{#each topCorporations as corporation}
								<div class="text-gray-800 {isMobile ? 'text-base' : 'text-lg'} font-medium">
									{corporation.name}
								</div>
							{/each}
						{:else}
							<div class="text-gray-500 {isMobile ? 'text-sm' : 'text-base'}">
								{$_('landingLeaderboard.noCorporationsAvailable')}
							</div>
						{/if}
					</div>
				</div>

				<!-- Card 2: Top 3 Companies -->
				<div
					class="rounded-2xl border-1 border-[#00A63E] bg-white {isMobile
						? 'p-4'
						: 'p-6'} shadow-sm transition-shadow hover:shadow-md"
				>
					<h3 class="text-xl font-bold text-gray-900 mb-4 text-center">
						{$_('landingLeaderboard.top3Companies')}
					</h3>
					<div class="space-y-3 text-center">
						{#if topCompanies.length > 0}
							{#each topCompanies as company}
								<div class="text-gray-800 {isMobile ? 'text-base' : 'text-lg'} font-medium">
									{company.name}
								</div>
							{/each}
						{:else}
							<div class="text-gray-500 {isMobile ? 'text-sm' : 'text-base'}">
								{$_('landingLeaderboard.noCompaniesAvailable')}
							</div>
						{/if}
					</div>
				</div>

				<!-- Card 3: Statistics (split vertically into 3) -->
				<div
					class="rounded-2xl border-1 border-[#00A63E] bg-white {isMobile
						? 'p-4'
						: 'p-6'} shadow-sm transition-shadow hover:shadow-md flex flex-col"
				>
					<div class="flex-1 space-y-4">
						<!-- Companies Registered -->
						<div class="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
							<p class="text-gray-600 {isMobile ? 'text-sm' : 'text-base'} mb-1">
								{$_('landingLeaderboard.companiesRegistered')}
							</p>
							<p class="text-[#00A63E] {isMobile ? 'text-2xl' : 'text-3xl'} font-bold">
								{totalCompanies}
							</p>
						</div>
						<!-- Walk Activities -->
						<div class="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
							<p class="text-gray-600 {isMobile ? 'text-sm' : 'text-base'} mb-1">
								{$_('landingLeaderboard.walkActivities')}
							</p>
							<p class="text-[#00A63E] {isMobile ? 'text-2xl' : 'text-3xl'} font-bold">
								{totalWalkActivities}
							</p>
						</div>
						<!-- Cycle Activities -->
						<div>
							<p class="text-gray-600 {isMobile ? 'text-sm' : 'text-base'} mb-1">
								{$_('landingLeaderboard.cycleActivities')}
							</p>
							<p class="text-[#00A63E] {isMobile ? 'text-2xl' : 'text-3xl'} font-bold">
								{totalCycleActivities}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- View Leaderboard Button -->
			<div class="flex justify-center">
				<CTAButton
					text={$_('landingLeaderboard.viewLeaderboard')}
					variant="green"
					href="/leaderboard"
				/>
			</div>
		{/if}
	</div>
</section>
