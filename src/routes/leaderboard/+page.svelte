<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Hero from '$lib/components/landing/Hero.svelte';
	import Leaderboard from '$lib/components/landing/Leaderboard.svelte';
	import CompanyStats from '$lib/components/landing/CompanyStats.svelte';
	import Map from '$lib/components/landing/Map.svelte';
	import SocialActivity from '$lib/components/landing/SocialActivity.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import AppStoreButtons from '$lib/components/landing/AppStoreButtons.svelte';
	import { urls } from '$lib/config/urls';
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

	// Countdown timer for challenge start
	const TARGET_DATE = new Date('2026-03-15T00:00:00+05:30');
	let days = $state(0);
	let hours = $state(0);
	let minutes = $state(0);
	let countdownDone = $state(false);
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	function updateCountdown() {
		const diff = TARGET_DATE.getTime() - Date.now();
		if (diff <= 0) {
			countdownDone = true;
			if (countdownInterval) clearInterval(countdownInterval);
			return;
		}
		days = Math.floor(diff / (1000 * 60 * 60 * 24));
		hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
		minutes = Math.floor((diff / (1000 * 60)) % 60);
	}

	function checkMobile() {
		isMobile = checkIsMobile();
	}

	const selectedCompanyName = $derived(companyData?.name || '');

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
					value: '420'
				},
				{
					label: 'Average weekly activities',
					value: '3,240'
				},
				{
					label: 'CO₂ offset',
					value: '12,340 kg'
				},
				{
					label: 'Fuel saved',
					value: '2,980 ltrs'
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
		updateCountdown();
		countdownInterval = setInterval(updateCountdown, 60000);
		const resizeHandler = () => checkMobile();
		window.addEventListener('resize', resizeHandler);
		return () => {
			window.removeEventListener('resize', resizeHandler);
			if (countdownInterval) clearInterval(countdownInterval);
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
		<SocialActivity entityName={selectedCompanyName} {isMobile} />

		<!-- Join CTA (compact) -->
		<section class="bg-[#0D6BA3] py-6 sm:py-8">
			<div class="mx-auto max-w-[95%] xl:max-w-[80%] px-3 sm:px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="text-center sm:text-left">
					<p class="text-base sm:text-lg font-bold text-white">Want to join the challenge?</p>
					<p class="text-xs sm:text-sm text-white/80">Download the altmo app or register your company to get started.</p>
				</div>
				<div class="flex items-center gap-3">
					<a
						href="https://altmo.app/users/sign_up?corporates=true&plan_name=corporate&verification=pending"
						target="_blank"
						rel="noopener noreferrer"
						class="rounded-full bg-white px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-[#0D6BA3] hover:bg-gray-100 transition-colors whitespace-nowrap"
					>
						Get Started with altmo
					</a>
					<AppStoreButtons size="sm" />
				</div>
			</div>
		</section>
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

		<!-- Join CTA (compact) -->
		<section class="bg-[#0D6BA3] py-6 sm:py-8">
			<div class="mx-auto max-w-[95%] xl:max-w-[80%] px-3 sm:px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="text-center sm:text-left">
					<p class="text-base sm:text-lg font-bold text-white">Want to join the challenge?</p>
					<p class="text-xs sm:text-sm text-white/80">Download the altmo app or register your company to get started.</p>
				</div>
				<div class="flex items-center gap-3">
					<a
						href="https://altmo.app/users/sign_up?corporates=true&plan_name=corporate&verification=pending"
						target="_blank"
						rel="noopener noreferrer"
						class="rounded-full bg-white px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-[#0D6BA3] hover:bg-gray-100 transition-colors whitespace-nowrap"
					>
						Get Started with altmo
					</a>
					<AppStoreButtons size="sm" />
				</div>
			</div>
		</section>

		<Map {selectedCorpId} {selectedCompanyId} name={selectedCorporationName} {isMobile} />
		<SocialActivity entityName={selectedCorporationName} {isMobile} />
	{:else}
		{#if !countdownDone}
			<div class="bg-[#FFFCF8] {isMobile ? 'px-3 sm:px-4 pt-3 sm:pt-4' : 'px-6 pt-4'}">
				<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'}">
					<div class="rounded-xl bg-gradient-to-r from-[#0D6BA3] to-[#1a85c7] p-4 sm:p-6 text-center text-white">
						<p class="text-xs sm:text-sm font-medium text-white/80 mb-2">The Hejje Gala Corporate Challenge begins in</p>
						<div class="flex items-center justify-center gap-3 sm:gap-5">
							<div class="flex flex-col items-center">
								<span class="text-2xl sm:text-3xl lg:text-4xl font-bold">{days}</span>
								<span class="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider">days</span>
							</div>
							<span class="text-2xl sm:text-3xl font-bold text-white/40">:</span>
							<div class="flex flex-col items-center">
								<span class="text-2xl sm:text-3xl lg:text-4xl font-bold">{hours}</span>
								<span class="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider">hours</span>
							</div>
							<span class="text-2xl sm:text-3xl font-bold text-white/40">:</span>
							<div class="flex flex-col items-center">
								<span class="text-2xl sm:text-3xl lg:text-4xl font-bold">{minutes}</span>
								<span class="text-[10px] sm:text-xs text-white/70 uppercase tracking-wider">mins</span>
							</div>
						</div>
						<p class="text-xs sm:text-sm text-white/70 mt-2">Scores on the leaderboard will update once the challenge is live.</p>
					</div>
				</div>
			</div>
		{/if}
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

		<!-- Join the Challenge CTA -->
		<section class="bg-gradient-to-br from-[#0D6BA3] via-[#1a7bb8] to-[#0a5a8a] py-8 sm:py-10 lg:py-14">
			<div class="mx-auto max-w-[95%] xl:max-w-[80%] px-3 sm:px-4 md:px-6">
				<div class="text-center mb-6 sm:mb-8">
					<h2 class="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2">
						Your company not on the board yet?
					</h2>
					<p class="text-sm sm:text-base lg:text-lg text-white/80 max-w-2xl mx-auto">
						Sign up on altmo and join the Hejje Gala challenge. Track your walks, rides, and commutes — every step counts.
					</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
					<!-- For Companies -->
					<div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 sm:p-6">
						<div class="flex items-center gap-2 mb-3">
							<span class="text-lg sm:text-xl">🏢</span>
							<h3 class="text-base sm:text-lg font-bold text-white">For Companies</h3>
						</div>
						<p class="text-xs sm:text-sm text-white/80 mb-4">
							Get access to the company dashboard, rally your employees, and climb the leaderboard. Show Bengaluru what your team is made of.
						</p>
						<a
							href="https://altmo.app/users/sign_up?corporates=true&plan_name=corporate&verification=pending"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-full bg-white px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-[#0D6BA3] hover:bg-gray-100 transition-colors"
						>
							Get Started with altmo
							<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</a>
					</div>

					<!-- For Individuals -->
					<div class="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-4 sm:p-6">
						<div class="flex items-center gap-2 mb-3">
							<span class="text-lg sm:text-xl">🚶</span>
							<h3 class="text-base sm:text-lg font-bold text-white">For Individuals</h3>
						</div>
						<p class="text-xs sm:text-sm text-white/80 mb-4">
							Download the altmo app, log your daily walks and rides, and help your company — or your neighbourhood — lead the way.
						</p>
						<AppStoreButtons size="sm" />
					</div>
				</div>
			</div>
		</section>

		<div class="bg-[#FFFCF8] px-3 sm:px-4 md:px-6 py-2 sm:py-3 lg:py-4">
			<div class="mx-auto max-w-[95%] xl:max-w-[80%]">
				<div
					class="flex items-center justify-center mb-3 sm:mb-4 lg:mb-8 flex-wrap gap-2 sm:gap-4"
				>
					<h1
						class="text-xl sm:text-2xl lg:text-4xl font-bold text-[#DB3E3E] text-center"
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
