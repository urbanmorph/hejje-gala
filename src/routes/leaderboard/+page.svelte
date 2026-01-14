<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Hero from '$lib/components/landing/Hero.svelte';
	import About from '$lib/components/landing/About.svelte';
	import Leaderboard from '$lib/components/landing/Leaderboard.svelte';
	import CompanyStats from '$lib/components/landing/CompanyStats.svelte';
	import Map from '$lib/components/landing/Map.svelte';
	import BlogPosts from '$lib/components/landing/BlogPosts.svelte';
	import SocialActivity from '$lib/components/landing/SocialActivity.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { _ } from 'svelte-i18n';
	import { isMobile as checkIsMobile } from '$lib/utils';

	type Corporation = { id: string; name: string };
	const corporations = $derived([
		{ id: 'central', name: $_('leaderboard.central') },
		{ id: 'south', name: $_('leaderboard.south') },
		{ id: 'east', name: $_('leaderboard.east') },
		{ id: 'north', name: $_('leaderboard.north') },
		{ id: 'west', name: $_('leaderboard.west') },
		{ id: 'elcita', name: $_('leaderboard.elcita') }
	]);

	const selectedCorpId = $derived($page.url.searchParams.get('corp'));
	const selectedCompanyId = $derived($page.url.searchParams.get('company'));
	const view = $derived(
		$page.url.searchParams.get('view') as 'city' | 'corporation' | 'company' | null
	);

	const selectedCorporation = $derived(
		selectedCorpId ? corporations.find((c) => c.id === selectedCorpId) : null
	);
	const selectedCorporationName = $derived(
		selectedCorpId === 'all' ? 'Overall' : selectedCorporation?.name || ''
	);

	// Company data state
	type CompanyRow = {
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
		metrics?: Array;
	};

	type CorporationLeaderboard = {
		corporationId: string;
		corporationName: string;
		city: string;
		dimensions?: {
			recreationAll?: { rows: CompanyRow[] };
			recreationWalk?: { rows: CompanyRow[] };
			recreationCycle?: { rows: CompanyRow[] };
			commuteAll?: { rows: CompanyRow[] };
			commuteWalk?: { rows: CompanyRow[] };
			commuteCycle?: { rows: CompanyRow[] };
			transitAll?: { rows: CompanyRow[] };
			transitWalk?: { rows: CompanyRow[] };
			transitCycle?: { rows: CompanyRow[] };
		};
	};

	let companyData = $state(null);
	let corporationData = $state(null);
	let loadingCompany = $state(false);
	let isMobile = $state(false);

	function checkMobile() {
		isMobile = checkIsMobile();
	}

	const selectedCompanyName = $derived(companyData?.name || '');
	const aboutName = $derived(
		view === 'city'
			? 'Bengaluru'
			: view === 'corporation'
				? selectedCorporationName
				: selectedCompanyName
	);

	// Consistent mock data for all companies
	const getMockCompanyData = (companyId: string, companyName: string): CompanyRow => {
		return {
			rank: 1,
			companyId: companyId,
			name: companyName,
			activities: 6927,
			co2OffsetKg: 5542,
			fuelSavedL: 2448,
			employees: 2400,
			sector: 'Corporate offices',
			location: 'Central business district',
			description: 'Flagship corporate campus with strong walking and cycling culture.',
			metrics: [
				{
					label: 'Active users',
					value: '420',
					helperText: 'Employees regularly logging active commutes.'
				},
				{
					label: 'Average weekly activities',
					value: '3,240',
					helperText: 'Walk, cycle and other sustainable trips per week.'
				},
				{
					label: 'CO₂ offset',
					value: '12,340 kg',
					helperText: 'Compared to equivalent solo car trips.'
				},
				{
					label: 'Fuel saved',
					value: '2,980 ltrs',
					helperText: 'Indicative fuel savings based on avoided trips.'
				}
			]
		};
	};

	async function loadCompanyData(corpId: string, companyId: string) {
		if (!corpId || !companyId) return;

		loadingCompany = true;
		try {
			// Handle "all" as a special case to load All.json
			const filename = corpId === 'all' ? 'All.json' : `${corpId}.json`;
			const res = await fetch(`https://assets.hejjegala.in/leaderboard/${filename}`);
			if (!res.ok) {
				throw new Error(`Failed to load corporation leaderboard for ${corpId}`);
			}

			const data: CorporationLeaderboard = await res.json();
			corporationData = data;

			// Find the company in all dimensions to get the company name
			let companyName = companyId;
			for (const dimension of Object.values(data.dimensions || {})) {
				const company = dimension?.rows?.find((row) => row.companyId === companyId);
				if (company) {
					companyName = company.name;
					break;
				}
			}

			// Use consistent mock data for all companies
			companyData = getMockCompanyData(companyId, companyName);
		} catch (error) {
			console.error('Error loading company data:', error);
			// Use mock data on error
			companyData = getMockCompanyData(companyId, companyId);
		} finally {
			loadingCompany = false;
		}
	}

	// Load company data when company is selected
	$effect(() => {
		if (view === 'company' && selectedCorpId && selectedCompanyId) {
			loadCompanyData(selectedCorpId, selectedCompanyId);
		} else {
			companyData = null;
			corporationData = null;
		}
	});

	function selectCorporation(corpId: string | null) {
		if (corpId) {
			goto(`/leaderboard?view=corporation&corp=${corpId}`, { noScroll: true });
		} else {
			goto('/leaderboard', { noScroll: true });
		}
	}

	function goBack() {
		if (view === 'company' && selectedCorpId) {
			// Go back to corporation view
			goto(`/leaderboard?view=corporation&corp=${selectedCorpId}`, { noScroll: true });
		} else if (view === 'corporation') {
			// Go back to city view
			goto('/leaderboard', { noScroll: true });
		}
	}

	onMount(() => {
		checkMobile();
		const resizeHandler = () => checkMobile();
		window.addEventListener('resize', resizeHandler);
		return () => {
			window.removeEventListener('resize', resizeHandler);
		};
	});
</script>

<svelte:head>
	<title>Hejje Gala</title>
</svelte:head>

<div class="min-h-screen bg-[#FFFCF8]">
	<Hero
		title={$_('hero.leaderboardTitle')}
		showCountdown={false}
		showCTA={false}
		compact={true}
		disabledLabels={new Set([])}
		postRegistration={true}
		{isMobile}
	/>

	<About
		mode={view || 'city'}
		name={aboutName}
		description={view === 'city'
			? $_('about.cityDescription')
			: view === 'corporation'
				? $_('about.corporationDescription')
				: $_('about.companyDescription')}
		{isMobile}
	/>

	{#if view === 'company' && selectedCorpId && selectedCompanyId}
		{@const employeeDataUrl = `https://assets.hejjegala.in/leaderboard/${selectedCompanyId}-employee.json`}
		<div class="bg-[#FFFCF8] {isMobile ? 'px-3 sm:px-4 py-2 sm:py-3' : 'px-6 py-4'}">
			<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'}">
				<div
					class="flex items-center justify-center {isMobile
						? 'mb-3 sm:mb-4'
						: 'mb-8'} flex-wrap gap-2 sm:gap-4"
				>
					<h1
						class="{isMobile
							? 'text-xl sm:text-2xl'
							: 'text-4xl'} font-bold text-[#DB3E3E] text-center"
					>
						{$_('leaderboard.employeeLeaderboard')}
					</h1>
				</div>
			</div>
		</div>
		<div class="mx-auto {isMobile ? 'max-w-[95%] px-3 sm:px-4' : 'max-w-[80%] px-6'}">
			<button
				onclick={goBack}
				class="flex items-center gap-1.5 sm:gap-2 text-gray-700 hover:text-gray-900 transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 sm:h-5 sm:w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				<span class="{isMobile ? 'text-xs sm:text-sm' : 'text-sm'} font-medium"
					>{$_('leaderboard.back')}</span
				>
			</button>
		</div>
		<CompanyStats dataUrl={employeeDataUrl} companyId={selectedCompanyId} {isMobile} />
		<Map {selectedCorpId} {selectedCompanyId} name={selectedCompanyName} {isMobile} />
		<BlogPosts corporationId={selectedCorpId} companyId={selectedCompanyId} limit={2} {isMobile} />
		<SocialActivity entityName={selectedCompanyName} {isMobile} />
	{:else if selectedCorpId}
		{@const corpId = selectedCorpId}
		{@const leaderboardUrl = `https://assets.hejjegala.in/leaderboard/${corpId === 'all' ? 'All.json' : `${corpId}.json`}`}
		<div class="bg-[#FFFCF8] {isMobile ? 'px-4 py-3' : 'px-6 py-4'}">
			<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'}">
				<div class="flex items-center justify-center {isMobile ? 'mb-4' : 'mb-8'} flex-wrap gap-4">
					<h1 class="{isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-[#DB3E3E]">
						{$_('leaderboard.companyLeaderboard')}
					</h1>
				</div>
			</div>
		</div>
		<div
			class="mx-auto {isMobile ? 'max-w-[95%] px-3 sm:px-4 mb-2 sm:mb-3' : 'max-w-[80%] px-6 mb-4'}"
		>
			<button
				onclick={goBack}
				class="flex items-center gap-1.5 sm:gap-2 text-gray-700 hover:text-gray-900 transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 sm:h-5 sm:w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				<span class="{isMobile ? 'text-xs sm:text-sm' : 'text-md'} font-medium"
					>{$_('leaderboard.back')}</span
				>
			</button>
		</div>
		<!-- Corporation Selection Buttons -->
		<div class="bg-[#FFFCF8] {isMobile ? 'py-3 sm:py-4' : 'py-8'}">
			<div class="mx-auto {isMobile ? 'max-w-[95%] px-3 sm:px-4' : 'max-w-[80%] px-6'}">
				<div
					class="flex w-full flex-wrap items-center justify-center gap-0 rounded-full border border-[#00A640] bg-white {isMobile
						? 'p-0.5'
						: 'p-0.5'}"
				>
					{#each corporations as corp, i}
						<button
							onclick={() => selectCorporation(corp.id)}
							class="flex-1 min-w-0 {isMobile
								? 'px-1.5 py-1.5 sm:px-2 sm:py-2 text-[10px] sm:text-xs'
								: 'px-6 py-4 text-md'} font-semibold transition-all
								{selectedCorpId === corp.id ? ' bg-[#00A640] text-white' : ' text-slate-900 bg-transparent'}
								{i < corporations.length - 1 ? ' border-r border-[#00A640]' : ''}
								{i === 0 ? ' rounded-l-full' : ''}
								{i === corporations.length - 1 ? ' rounded-r-full' : ''}"
						>
							{corp.name}
						</button>
					{/each}
				</div>
			</div>
		</div>
		<Leaderboard
			dataUrl={leaderboardUrl}
			initialFilter="cycling"
			showSearch
			showFilters
			context="corporation"
			{isMobile}
		/>
		<Map {selectedCorpId} {selectedCompanyId} name={selectedCorporationName} {isMobile} />
		<SocialActivity entityName={selectedCorporationName} {isMobile} />
	{:else}
		<div class="bg-[#FFFCF8] {isMobile ? 'px-3 sm:px-4 py-2 sm:py-3' : 'px-6 py-4'}">
			<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'}">
				<div
					class="flex items-center justify-center {isMobile
						? 'mb-3 sm:mb-4'
						: 'mb-8'} flex-wrap gap-2 sm:gap-4"
				>
					<h1
						class="{isMobile
							? 'text-xl sm:text-2xl'
							: 'text-4xl'} font-bold text-[#DB3E3E] text-center"
					>
						{$_('leaderboard.corpLeaderboard')}
					</h1>
				</div>
			</div>
		</div>
		<Leaderboard
			dataUrl="https://assets.hejjegala.in/leaderboard/city.json"
			initialFilter="cycling"
			showSearch={false}
			showFilters={false}
			context="city"
			{isMobile}
		/>
		<div class="bg-[#FFFCF8] {isMobile ? 'px-3 sm:px-4 py-2 sm:py-3' : 'px-6 py-4'}">
			<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'}">
				<div
					class="flex items-center justify-center {isMobile
						? 'mb-3 sm:mb-4'
						: 'mb-8'} flex-wrap gap-2 sm:gap-4"
				>
					<h1
						class="{isMobile
							? 'text-xl sm:text-2xl'
							: 'text-4xl'} font-bold text-[#DB3E3E] text-center"
					>
						{$_('leaderboard.companyLeaderboard')}
					</h1>
				</div>
			</div>
		</div>
		<Leaderboard
			dataUrl="https://assets.hejjegala.in/leaderboard/All.json"
			initialFilter="cycling"
			showSearch={true}
			showFilters={false}
			context="corporation"
			{isMobile}
		/>
	{/if}
	<Footer {isMobile} />
</div>

<style>
	:global(.prose) {
		color: inherit;
	}

	:global(.prose p) {
		margin-top: 1em;
		margin-bottom: 1em;
	}

	:global(.prose p:first-child) {
		margin-top: 0;
	}

	:global(.prose p:last-child) {
		margin-bottom: 0;
	}

	:global(.prose h2) {
		font-size: 1.5em;
		font-weight: 600;
		margin-top: 1.5em;
		margin-bottom: 0.5em;
	}

	:global(.prose strong) {
		font-weight: 600;
	}

	:global(.prose em) {
		font-style: italic;
	}
</style>
