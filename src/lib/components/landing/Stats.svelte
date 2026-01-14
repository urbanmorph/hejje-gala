<script lang="ts">
	import { onMount } from 'svelte';
	import { statsConfig, type StatsMetricKey } from '$lib/config/landing';
	import AnimatedNumber from './AnimatedNumber.svelte';
	import AppStoreButtons from './AppStoreButtons.svelte';
	import { _, locale } from 'svelte-i18n';
	import { isDesktop as checkIsDesktop } from '$lib/utils';

	type OverallStatistics = {
		people: number;
		activitiesCount: number;
		distance: number;
		co2Offset: number;
		fuelSaved: number;
		moneySaved: number;
	};

	type StatsMetric = (typeof statsConfig.metrics)[number] & {
		numericValue?: number;
	};

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	let metrics = $state(statsConfig.metrics);
	let isLoading = $state(true);
	let isDesktop = $state(false);

	// Map i18n locale codes to Intl.NumberFormat locale strings
	const getNumberFormatLocale = (i18nLocale: string | null | undefined): string => {
		// Map 'en' -> 'en-IN', 'kn' -> 'kn-IN', default to 'en-IN'
		const localeMap: Record = {
			en: 'en-IN',
			kn: 'kn-IN'
		};
		return localeMap[i18nLocale || 'en'] || 'en-IN';
	};

	// Create a reactive number formatter based on current locale
	const numberFormatter = $derived(
		new Intl.NumberFormat(getNumberFormatLocale($locale), {
			maximumFractionDigits: 0
		})
	);

	function formatNumber(value: number): string {
		if (!Number.isFinite(value)) return '-';
		const rounded = Math.round(value);
		const ONE_CRORE = 10_000_000;

		// If value is 1 crore or more, format in crores
		if (rounded >= ONE_CRORE) {
			const crores = rounded / ONE_CRORE;
			// Format with up to 2 decimal places for crores
			const croreFormatter = new Intl.NumberFormat(getNumberFormatLocale($locale), {
				maximumFractionDigits: 0,
				minimumFractionDigits: 0
			});
			return `${croreFormatter.format(crores)} Cr`;
		}

		return numberFormatter.format(rounded);
	}

	function mapStatsToMetrics(stats: OverallStatistics): StatsMetric[] {
		const byKey: Record = {
			co2Offset: stats.co2Offset,
			fuelSaved: stats.fuelSaved,
			people: stats.people,
			distance: stats.distance
		};

		return statsConfig.metrics.map((metric) => {
			const value = byKey[metric.key as StatsMetricKey];
			return {
				...metric,
				numericValue: value,
				value: formatNumber(value)
			};
		});
	}

	function getNumericValue(stat: StatsMetric): number {
		if (typeof stat.numericValue === 'number' && Number.isFinite(stat.numericValue)) {
			return stat.numericValue;
		}

		const raw = String(stat.value ?? '').replace(/[^\d.-]/g, '');
		const parsed = Number.parseFloat(raw);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	function checkDesktop() {
		isDesktop = checkIsDesktop();
	}

	async function fetchStats() {
		try {
			// Fetch from R2 bucket
			const response = await fetch('https://assets.hejjegala.in/other/stats.json');

			if (!response.ok) {
				throw new Error(`Failed to load stats (${response.status})`);
			}

			const data = (await response.json()) as {
				success: boolean;
				overall_statistics?: OverallStatistics;
				error?: string;
			};

			if (!data.success || !data.overall_statistics) {
				throw new Error(data.error || 'Unknown error loading stats');
			}

			metrics = mapStatsToMetrics(data.overall_statistics);
		} catch (err) {
			// If fetching fails, keep showing the last known or default values
			console.error('Error fetching stats', err);
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		// Initial load
		fetchStats();

		// Poll every minute
		const interval = setInterval(fetchStats, 60_000);

		// Check desktop on mount and resize
		checkDesktop();
		const resizeHandler = () => checkDesktop();
		window.addEventListener('resize', resizeHandler);

		return () => {
			clearInterval(interval);
			window.removeEventListener('resize', resizeHandler);
		};
	});
</script>

<section class="bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-16 lg:py-24'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-3 sm:px-4 md:px-6">
		<!-- White card container -->
		<div class="bg-white border-1 rounded-lg {isMobile ? 'p-3 sm:p-4' : 'p-8 lg:p-12'}">
			<div class="grid items-center gap-8 sm:gap-12 lg:grid-cols-1 xl:grid-cols-2">
				<!-- Left side: Text and Stats -->
				<div class="space-y-6 sm:space-y-8 text-center lg:text-left xl:text-left">
					<div class="space-y-2 sm:space-y-3">
						<h2
							class="{isMobile
								? 'text-xl sm:text-2xl'
								: 'text-3xl'} font-bold leading-tight lg:text-4xl break-words"
						>
							<span class="text-[#DB3E3E]">{$_('stats.title')}</span>
							<span class="text-black font-bold">{$_('stats.altmo')}</span>
						</h2>
						<p class="{isMobile ? 'text-xs sm:text-sm' : 'text-base'} font-base lg:text-lg">
							{$_('stats.description')}
						</p>
					</div>

					<!-- Stats Grid - 2 columns on desktop and mobile -->
					<div
						class="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6 max-w-2xl mx-auto lg:max-w-none lg:mx-0 xl:max-w-none xl:mx-0"
					>
						{#each metrics as stat}
							<div
								class="rounded-xl sm:rounded-2xl border-1 border-[#00A63E] bg-white {isMobile
									? 'p-1.5 sm:p-2'
									: 'p-4 lg:p-6'} shadow-sm transition-shadow hover:shadow-md min-w-0"
							>
								<div class="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-4">
									<!-- Icon on the left -->
									<div
										class="flex {isMobile
											? 'h-5 w-5 sm:h-6 sm:w-6'
											: 'h-8 w-12'} items-center justify-center flex-shrink-0 lg:h-8 lg:w-8"
									>
										<img src={stat.icon} alt={stat.label} class="h-full w-full object-contain" />
									</div>
									<!-- Number and label on the right -->
									<div class="flex-1 text-left min-w-0">
										<div
											class="{isMobile
												? 'text-sm sm:text-base'
												: 'text-2xl'} font-bold text-[#00A63E] lg:text-3xl break-words"
										>
											{#if isLoading}
												<span
													class="inline-block h-6 sm:h-8 w-12 sm:w-20 animate-pulse rounded bg-gray-200"
												></span>
											{:else}
												<AnimatedNumber value={getNumericValue(stat)} format={formatNumber} />
											{/if}
										</div>
										<div
											class="text-[10px] sm:text-xs text-black mt-0.5 sm:mt-1 lg:text-base break-words leading-tight"
										>
											{stat.label.split('(')[0]}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- CTA Section -->
					<div class="pt-2">
						<div
							class="flex flex-col {isMobile
								? 'items-center gap-3 sm:gap-4'
								: 'items-center gap-4 lg:flex-row lg:items-center lg:gap-6 xl:flex-row xl:items-center xl:gap-6'}"
						>
							<p
								class="{isMobile
									? 'text-xs sm:text-sm px-2'
									: 'text-base'} font-base lg:text-lg text-center lg:text-left xl:text-left break-words"
							>
								{$_('stats.downloadAltmo')} <span class="font-bold">{$_('stats.altmo')}</span>
								{$_('stats.downloadAltmoToday')}
							</p>
							<AppStoreButtons size="md" invert={true} />
						</div>
					</div>
				</div>

				{#if isDesktop && !isMobile}
					<!-- Right side: Phone mockup with decorative elements -->
					<div class="relative flex items-center justify-center lg:justify-end">
						<div class="relative">
							<!-- Large yellow circular graphic with star masks - behind phone, centered slightly left -->
							<div
								class="absolute left-1/2 top-1/2 z-0 h-96 w-96 -translate-x-[calc(50%+1.5rem)] -translate-y-1/2 lg:h-[28rem] lg:w-[28rem]"
							>
								<div class="starburst-circle">
									<!-- Two star-shaped masks on the circle - scaled 200% -->
									<img
										src="/assets/star.svg"
										alt="Star"
										class="absolute left-0 top-1/2 h-16 w-24 -translate-y-1/2 -translate-x-4"
									/>
									<img
										src="/assets/star.svg"
										alt="Star"
										class="absolute right-0 top-1/2 h-12 w-24 translate-y-1/2 translate-x-4"
									/>
								</div>
							</div>
							<!-- Phone image in front -->
							<div class="relative z-20">
								<img
									src="/assets/phone.png"
									alt="App Screen"
									class="h-[500px] w-auto object-contain drop-shadow-2xl lg:h-[550px]"
								/>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
	.starburst-circle {
		position: relative;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: radial-gradient(circle, #f8d57e 0%);
	}
</style>
