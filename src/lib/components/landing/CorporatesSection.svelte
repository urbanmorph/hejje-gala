<script lang="ts">
	import { onMount } from 'svelte';
	import AppStoreButtons from './AppStoreButtons.svelte';
	import { _, locale } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	type LeaderboardRow = {
		rank: number;
		name: string;
		companies?: number;
		employees?: number;
		activities: number;
		co2OffsetKg: number;
		fuelSavedL: number;
		moneySaved?: number;
	};

	let allCorporations = $state<LeaderboardRow[]>([]);
	let isLoading = $state(true);

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

	const allZero = $derived(totalActivities === 0 && totalCo2 === 0 && totalFuel === 0);

	const getNumberFormatLocale = (i18nLocale: string | null | undefined): string => {
		const localeMap: Record<string, string> = { en: 'en-IN', kn: 'kn-IN' };
		return localeMap[i18nLocale || 'en'] || 'en-IN';
	};

	const numberFormatter = $derived(
		new Intl.NumberFormat(getNumberFormatLocale($locale), { maximumFractionDigits: 0 })
	);

	function formatNumber(value: number): string {
		if (!Number.isFinite(value)) return '0';
		return numberFormatter.format(Math.round(value));
	}

	function formatCompact(value: number): string {
		if (!Number.isFinite(value) || value === 0) return '0';
		if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(1)} Cr`;
		if (value >= 100_000) return `${(value / 100_000).toFixed(1)} L`;
		if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
		return formatNumber(value);
	}

	// Aggregated stats
	const totalActivities = $derived(allCorporations.reduce((sum, c) => sum + c.activities, 0));
	const totalCo2 = $derived(allCorporations.reduce((sum, c) => sum + c.co2OffsetKg, 0));
	const totalFuel = $derived(allCorporations.reduce((sum, c) => sum + c.fuelSavedL, 0));
	const totalEmployees = $derived(allCorporations.reduce((sum, c) => sum + (c.employees || 0), 0));
	const totalCompanies = $derived(allCorporations.reduce((sum, c) => sum + (c.companies || 0), 0));
	const leader = $derived(allCorporations.length > 0 ? allCorporations[0] : null);

	async function fetchLeaderboard() {
		try {
			const res = await fetch('https://assets.hejjegala.in/leaderboard/city.json');
			if (!res.ok) throw new Error(`Failed to load leaderboard (${res.status})`);
			const data = await res.json();

			const dimensions = data?.dimensions || {};
			const commuteAll = dimensions.commuteAll || dimensions.recreationAll || Object.values(dimensions)[0];
			const rows = commuteAll?.rows || [];

			allCorporations = rows.sort((a: LeaderboardRow, b: LeaderboardRow) => a.rank - b.rank);
		} catch (err) {
			console.error('Error fetching leaderboard:', err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchLeaderboard();
		updateCountdown();
		countdownInterval = setInterval(updateCountdown, 60000);
		return () => { if (countdownInterval) clearInterval(countdownInterval); };
	});
</script>

<div class="flex flex-col h-full">
	<div class="mb-3 sm:mb-4">
		<h3 class="text-lg sm:text-xl xl:text-2xl font-bold text-gray-900">
			<span class="text-[#0D6BA3]">Corporate Leaders</span>
		</h3>
		<p class="text-xs sm:text-sm xl:text-base font-semibold text-gray-900 mt-1">
			How companies in Bengaluru are stepping up
		</p>
	</div>

	<div class="flex-1">
		{#if isLoading}
			<div class="space-y-3">
				<div class="h-20 animate-pulse rounded-lg bg-gray-100"></div>
				<div class="grid grid-cols-2 gap-2">
					{#each Array(4) as _}
						<div class="h-14 animate-pulse rounded-lg bg-gray-100"></div>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Challenge-wide impact -->
			<p class="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
				Challenge Impact — {allCorporations.length} corporations, {formatNumber(totalCompanies)} companies
			</p>
			{#if allZero && !countdownDone}
				<div class="rounded-lg border border-gray-200 bg-gradient-to-br from-[#0D6BA3]/5 to-[#0D6BA3]/10 p-4 sm:p-5 mb-4 sm:mb-5 text-center">
					<p class="text-xs sm:text-sm text-gray-500 mb-2">Challenge beginning in</p>
					<div class="flex items-center justify-center gap-3 sm:gap-4">
						<div class="flex flex-col items-center">
							<span class="text-xl sm:text-2xl xl:text-3xl font-bold text-[#0D6BA3]">{days}</span>
							<span class="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider">days</span>
						</div>
						<span class="text-xl sm:text-2xl font-bold text-[#0D6BA3]/40">:</span>
						<div class="flex flex-col items-center">
							<span class="text-xl sm:text-2xl xl:text-3xl font-bold text-[#0D6BA3]">{hours}</span>
							<span class="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider">hours</span>
						</div>
						<span class="text-xl sm:text-2xl font-bold text-[#0D6BA3]/40">:</span>
						<div class="flex flex-col items-center">
							<span class="text-xl sm:text-2xl xl:text-3xl font-bold text-[#0D6BA3]">{minutes}</span>
							<span class="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider">mins</span>
						</div>
					</div>
					<p class="text-[10px] sm:text-xs text-gray-400 mt-2">{formatNumber(totalEmployees)} participants registered</p>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-5">
					<div class="rounded-lg border border-gray-200 bg-white p-2 sm:p-3 text-center">
						<p class="text-base sm:text-lg xl:text-xl font-bold text-gray-900">{formatNumber(totalEmployees)}</p>
						<p class="text-[9px] sm:text-[10px] xl:text-xs text-gray-500 mt-0.5">Participants</p>
					</div>
					<div class="rounded-lg border border-gray-200 bg-white p-2 sm:p-3 text-center">
						<p class="text-base sm:text-lg xl:text-xl font-bold text-gray-900">{formatCompact(totalActivities)}</p>
						<p class="text-[9px] sm:text-[10px] xl:text-xs text-gray-500 mt-0.5">Activities</p>
					</div>
					<div class="rounded-lg border border-gray-200 bg-white p-2 sm:p-3 text-center">
						<p class="text-base sm:text-lg xl:text-xl font-bold text-gray-900">{formatCompact(totalCo2)}</p>
						<p class="text-[9px] sm:text-[10px] xl:text-xs text-gray-500 mt-0.5">kg CO₂ offset</p>
					</div>
					<div class="rounded-lg border border-gray-200 bg-white p-2 sm:p-3 text-center">
						<p class="text-base sm:text-lg xl:text-xl font-bold text-gray-900">{formatCompact(totalFuel)}</p>
						<p class="text-[9px] sm:text-[10px] xl:text-xs text-gray-500 mt-0.5">Litres fuel saved</p>
					</div>
				</div>
			{/if}

			<!-- Leading corporation -->
			{#if leader}
				<p class="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
					Leading the pack
				</p>
				<div class="rounded-lg bg-gradient-to-r from-[#0D6BA3] to-[#1a85c7] p-3 sm:p-4">
					<div class="flex items-center gap-2 mb-1">
						<span class="text-base sm:text-lg">🏆</span>
						<p class="text-sm sm:text-base xl:text-lg font-bold text-white">{leader.name}</p>
					</div>
					<div class="flex gap-3 sm:gap-4 mt-1 text-white/90">
						<span class="text-[10px] sm:text-xs"><span class="font-bold text-white">{formatNumber(leader.activities)}</span> activities</span>
						<span class="text-[10px] sm:text-xs"><span class="font-bold text-white">{formatCompact(leader.co2OffsetKg)}</span> kg CO₂</span>
						<span class="text-[10px] sm:text-xs"><span class="font-bold text-white">{formatNumber(leader.employees || 0)}</span> participants</span>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<!-- CTAs -->
	<div class="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
		<a
			href="/leaderboard"
			class="inline-flex items-center gap-2 text-sm xl:text-base font-semibold text-[#0D6BA3] hover:text-[#0a5a8a] transition-colors"
		>
			View Full Leaderboard
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
			</svg>
		</a>
		<div>
			<p class="text-xs xl:text-sm text-gray-600 mb-2">Can your company lead the way? Get on the leaderboard.</p>
			<AppStoreButtons size="sm" />
		</div>
	</div>
</div>
