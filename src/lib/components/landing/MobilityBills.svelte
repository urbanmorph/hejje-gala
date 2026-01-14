<script lang="ts">
	import { _ } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	const currentInfrastructure = $derived(
		($_('mobilityBills.currentInfrastructure') as unknown as string[]) || []
	);
	const futurePlans = $derived(($_('mobilityBills.futurePlans') as unknown as string[]) || []);

	// Map future plan items to their URLs by index (order is consistent across languages)
	const futurePlanLinks: string[] = [
		'https://dult.karnataka.gov.in/assets/front/pdf/Comprehensive_Mobility_Plan.pdf', // 2020 Comprehensive Mobility Plan
		'https://dult.karnataka.gov.in/uploads/media_to_upload1640773786.pdf', // Active Mobility Bill
		'https://www.sci.gov.in/view-pdf/?diary_no=203762012&type=o&order_date=2025-08-01&from=latest_judgements_order' // Supreme Court's Right to Walk Ruling
	];

	function getFuturePlanLink(index: number): string | null {
		return futurePlanLinks[index] || null;
	}

	function handleCardClick(link: string) {
		if (link) {
			window.open(link, '_blank');
		}
	}

	// Parse infrastructure items to extract number, unit, and label
	// Format: "45 Cycle Stands", "10 Metro Stations", "100km Walkable footpath", "8km Cycle Lanes"
	function parseInfrastructureItem(item: string): { number: string; unit: string; label: string } {
		// Split on first space - first part is number (possibly with unit), rest is label
		const firstSpaceIndex = item.indexOf(' ');
		if (firstSpaceIndex === -1) {
			return { number: item, unit: '', label: '' };
		}

		const numberPart = item.substring(0, firstSpaceIndex);
		const label = item.substring(firstSpaceIndex + 1);

		// Check if number part ends with "km"
		if (numberPart.endsWith('km')) {
			return {
				number: numberPart.slice(0, -2), // Remove "km" from the end
				unit: 'km',
				label
			};
		}

		return {
			number: numberPart,
			unit: '',
			label
		};
	}
</script>

<section class="bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-20'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-3 sm:px-4 md:px-6 lg:px-8">
		<div class={isMobile ? 'space-y-12 sm:space-y-16' : 'space-y-36'}>
			<!-- Current Infrastructure Section -->
			<div class="space-y-4 sm:space-y-6">
				<h2
					class="{isMobile
						? 'text-xl sm:text-2xl'
						: 'text-3xl'} font-bold text-[#DB3E3E] lg:text-5xl xl:text-6xl text-center {isMobile
						? 'mb-6 sm:mb-8'
						: 'mb-12'} break-words px-2"
				>
					{$_('mobilityBills.currentInfrastructureTitle')}
				</h2>
				<div class="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{#each currentInfrastructure as item}
						{@const parsed = parseInfrastructureItem(item)}
						<div
							class="relative flex flex-col rounded-lg border border-[#00A640] bg-white {isMobile
								? 'p-3 sm:p-4'
								: 'p-6'} min-h-[120px] sm:min-h-[140px]"
						>
							<!-- Vertical red bar positioned 10% from the left border of the card -->
							<div
								class="absolute left-[10%] w-1.5 sm:w-2 bg-[#DB3E3E] rounded-md"
								style="height: 30%; top: 35%; transform: translateY(-50%);"
							></div>
							<!-- Content -->
							<div class="flex-1 flex flex-col justify-center items-center text-center">
								<!-- Number with red bar on the left -->
								<div class="relative flex items-center justify-center mb-1 sm:mb-2">
									<div
										class="font-bold text-[#00A640] {isMobile
											? 'text-2xl sm:text-3xl'
											: 'text-4xl'} lg:text-5xl xl:text-6xl leading-tight break-words"
									>
										{parsed.number}
										{#if parsed.unit}
											<span
												class="text-[#00A640] {isMobile
													? 'text-lg sm:text-xl'
													: 'text-2xl'} lg:text-3xl xl:text-4xl">{parsed.unit}</span
											>
										{/if}
									</div>
								</div>
								<div
									class="text-[#00A640] {isMobile
										? 'text-xs sm:text-sm px-1'
										: 'text-base'} lg:text-3xl font-bold leading-tight text-center break-words"
								>
									{parsed.label}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Future Plans Section -->
			<div class="space-y-4 sm:space-y-6">
				<h2
					class="{isMobile
						? 'text-xl sm:text-2xl'
						: 'text-3xl'} font-bold text-[#DB3E3E] lg:text-5xl xl:text-6xl text-center {isMobile
						? 'mb-6 sm:mb-8'
						: 'mb-12'} break-words px-2"
				>
					{$_('mobilityBills.futurePlansTitle')}
				</h2>
				<div
					class="grid grid-cols-1 gap-8 sm:gap-12 md:gap-16 sm:grid-cols-2 lg:grid-cols-3 mx-auto"
				>
					{#each futurePlans as item, index}
						{@const link = getFuturePlanLink(index)}
						{#if link}
							<button
								type="button"
								class="flex items-center justify-center w-full rounded-full bg-[#00A640] {isMobile
									? 'p-3 sm:p-4'
									: 'p-6'} text-center text-white transition-all duration-200 cursor-pointer hover:bg-[#008A35] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#00A640] focus:ring-offset-2 min-h-[100px] sm:min-h-[120px]"
								onclick={() => handleCardClick(link)}
							>
								<p
									class="{isMobile
										? 'text-sm sm:text-base px-2'
										: 'text-lg'} font-semibold lg:text-2xl break-words"
								>
									{item}
								</p>
							</button>
						{:else}
							<div
								class="flex items-center justify-center w-full rounded-full bg-[#00A640] {isMobile
									? 'p-3 sm:p-4'
									: 'p-6'} text-center text-white min-h-[100px] sm:min-h-[120px]"
							>
								<p
									class="{isMobile
										? 'text-sm sm:text-base px-2'
										: 'text-lg'} font-semibold lg:text-2xl break-words"
								>
									{item}
								</p>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>
