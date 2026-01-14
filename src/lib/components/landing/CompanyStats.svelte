<script lang="ts">
	import AnimatedNumber from './AnimatedNumber.svelte';

	type CompanySummary = {
		totalActivities: number;
		totalCo2Offset: number;
		totalFuelSaved: number;
		totalMoneySaved: number;
		totalParticipants: number;
	};

	type CompanyData = {
		companyId: string;
		companyName: string;
		corporationId: string;
		corporationName: string;
		city: string;
		summary: CompanySummary;
	};

	type CompaniesData = {
		companies: CompanyData[];
	};

	type CompanyStatistics = {
		co2Offset: number;
		fuelSaved: number;
		participants: number;
		activities: number;
	};

	interface Props {
		dataUrl: string;
		companyId?: string;
		isMobile?: boolean;
	}

	let { dataUrl, companyId, isMobile = false }: Props = $props();

	let stats = $state({
		co2Offset: 0,
		fuelSaved: 0,
		participants: 0,
		activities: 0
	});
	let isLoading = $state(true);

	const DEFAULT_LOCALE = 'en-IN';

	const getLocale = () => {
		if (typeof navigator !== 'undefined' && navigator.language) {
			return navigator.language;
		}
		return DEFAULT_LOCALE;
	};

	const integerFormatter = new Intl.NumberFormat(getLocale(), {
		maximumFractionDigits: 0
	});

	const decimalFormatter = new Intl.NumberFormat(getLocale(), {
		maximumFractionDigits: 2,
		minimumFractionDigits: 0
	});

	function formatNumber(value: number): string {
		if (!Number.isFinite(value)) return '-';
		return integerFormatter.format(Math.round(value));
	}

	function formatDecimal(value: number): string {
		if (!Number.isFinite(value)) return '-';
		return decimalFormatter.format(value);
	}

	function aggregateCompanyData(data: CompaniesData, targetCompanyId: string): CompanyStatistics {
		// Find the company in the companies array
		const company = data.companies.find((c) => c.companyId === targetCompanyId);

		if (!company || !company.summary) {
			return {
				co2Offset: 0,
				fuelSaved: 0,
				participants: 0,
				activities: 0
			};
		}

		// Use the single summary directly
		return {
			co2Offset: company.summary.totalCo2Offset || 0,
			fuelSaved: company.summary.totalFuelSaved || 0,
			participants: company.summary.totalParticipants || 0,
			activities: company.summary.totalActivities || 0
		};
	}

	// Extract companyId from dataUrl if not provided
	const extractedCompanyId = $derived(() => {
		if (companyId) return companyId;
		// Try to extract from URL like: .../leaderboard/{companyId}-employee.json
		const match = dataUrl.match(/leaderboard\/([^-]+)-employee\.json/);
		return match ? match[1] : null;
	});

	async function fetchStats() {
		isLoading = true;
		try {
			// Always fetch from companies.json
			const response = await fetch('https://assets.hejjegala.in/leaderboard/companies.json');

			if (!response.ok) {
				throw new Error(`Failed to load companies data (${response.status})`);
			}

			const data: CompaniesData = await response.json();
			const targetCompanyId = extractedCompanyId();

			if (!targetCompanyId) {
				throw new Error('Company ID not found');
			}

			stats = aggregateCompanyData(data, targetCompanyId);
		} catch (err) {
			console.error('Error fetching company stats', err);
		} finally {
			isLoading = false;
		}
	}

	// Fetch stats when companyId or dataUrl changes
	$effect(() => {
		if (extractedCompanyId()) {
			fetchStats();
		}
	});

	const metrics = $derived([
		{
			key: 'co2Offset',
			label: 'CO2 Offset (kgs)',
			icon: '/assets/icon-co2.png',
			value: stats.co2Offset,
			format: formatDecimal
		},
		{
			key: 'fuelSaved',
			label: 'Fuel Saved (ltrs)',
			icon: '/assets/icon-fuel.png',
			value: stats.fuelSaved,
			format: formatDecimal
		},
		{
			key: 'participants',
			label: 'Participants',
			icon: '/assets/icon-users.png',
			value: stats.participants,
			format: formatNumber
		},
		{
			key: 'activities',
			label: 'Activities',
			icon: '/assets/icon-activities.png',
			value: stats.activities,
			format: formatNumber
		}
	]);
</script>

<section class="bg-[#FFFCF8] {isMobile ? 'py-6' : 'py-8'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-6">
		<!-- Stats Grid - 2 columns on desktop and mobile -->
		<div
			class="grid grid-cols-2 {isMobile ? 'gap-3' : 'gap-4 lg:gap-6'} {isMobile
				? ''
				: 'lg:max-w-[60%]'} mx-auto"
		>
			{#each metrics as stat}
				<div
					class="rounded-2xl border-1 border-[#00A63E] bg-white {isMobile
						? 'p-2'
						: 'p-4 lg:p-6'} shadow-sm transition-shadow hover:shadow-md"
				>
					<div class="flex items-center {isMobile ? 'gap-2' : 'gap-4'}">
						<!-- Icon on the left -->
						<div
							class="flex {isMobile
								? 'h-6 w-6'
								: 'h-8 w-12'} items-center justify-center flex-shrink-0 lg:h-8 lg:w-8"
						>
							<img src={stat.icon} alt={stat.label} class="h-full w-full object-contain" />
						</div>
						<!-- Number and label horizontally aligned -->
						<div class="flex-1 flex flex-col {isMobile ? 'gap-0' : 'gap-1'}">
							<div
								class="{isMobile
									? 'text-lg'
									: 'text-2xl'} font-bold text-[#00A63E] lg:text-3xl text-left"
							>
								{#if isLoading}
									<span
										class="inline-block {isMobile
											? 'h-6 w-16'
											: 'h-8 w-20'} animate-pulse rounded bg-gray-200"
									></span>
								{:else}
									<AnimatedNumber value={stat.value} format={stat.format} />
								{/if}
							</div>
							<div class="{isMobile ? 'text-xs' : 'text-sm'} text-black text-left">
								{stat.label.split('(')[0]}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
