<script lang="ts">
	import { _ } from 'svelte-i18n';

	interface Props {
		mode: 'city' | 'corporation' | 'company';
		name?: string;
		description?: string;
		image?: string;
		location?: string;
		sector?: string;
		employees?: number;
		metrics?: Array;
		isMobile?: boolean;
	}

	let {
		mode,
		name = '',
		description = '',
		image = '/assets/circle.webp',
		location = '',
		sector = '',
		employees,
		metrics = [],
		isMobile = false
	}: Props = $props();

	// Default placeholder content based on mode
	let displayName = $derived(
		name ||
			(mode === 'city'
				? $_('cityCorporationCompany.city')
				: mode === 'corporation'
					? $_('cityCorporationCompany.corporation')
					: $_('cityCorporationCompany.company'))
	);
	let displaySector = $derived(sector || '');
</script>

<section class="py-8 bg-[#FFFCF8]">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-6xl'} px-6">
		<!-- Centered Title and Subtitle -->
		<div class="text-center mb-12">
			<h2 class="{isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-gray-900 mb-2 lg:text-5xl">
				{#if mode === 'city'}
					{$_('about.aboutTheCity')}
				{:else if displayName == 'Central'}
					{$_('about.aboutX')} Central Corporation
				{:else if displayName == 'South'}
					{$_('about.aboutX')} South Corporation
				{:else if displayName == 'East'}
					{$_('about.aboutX')} East Corporation
				{:else if displayName == 'North'}
					{$_('about.aboutX')} North Corporation
				{:else if displayName == 'West'}
					{$_('about.aboutX')} West Corporation
				{:else if displayName == 'ELCITA'}
					{$_('about.aboutX')} ELCITA
				{:else}
					{$_('about.aboutX')} {displayName}
				{/if}
			</h2>
		</div>

		<!-- White Card Container -->
		<div class="bg-white rounded-2xl shadow-sm {isMobile ? 'p-4' : 'p-8 lg:p-12'}">
			<div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
				<!-- Left: Red Placeholder Image (40% width) -->
				<div class="w-full lg:w-[40%] flex-shrink-0">
					<div class="w-full aspect-[4/3] bg-red-500 rounded-lg"></div>
				</div>

				<!-- Right: Content (60% width) -->
				<div class="w-full lg:w-[60%] flex-1">
					<p class="{isMobile ? 'text-sm' : 'text-base'} font-normal text-gray-900 leading-relaxed">
						{#if mode === 'city'}
							{$_('about.cityDescription')}
						{:else if mode === 'corporation'}
							{$_('about.corporationDescription')}
						{:else}
							{$_('about.companyDescription')}
						{/if}
					</p>

					{#if displaySector}
						<p class="{isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mt-4">
							🏢 {$_('about.sector')}: {displaySector}
						</p>
					{/if}

					{#if employees !== undefined && employees !== null}
						<p class="{isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mt-4">
							👥 {$_('about.employees')}: {employees.toLocaleString()}
						</p>
					{/if}

					{#if metrics && metrics.length > 0}
						<div class="grid {isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mt-8">
							{#each metrics as metric}
								<div class="rounded-lg bg-gray-50 {isMobile ? 'p-3' : 'p-4'}">
									<p class="{isMobile ? 'text-xl' : 'text-2xl'} font-bold text-[#00A640]">
										{metric.value}
									</p>
									<p class="{isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-900">
										{metric.label}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>
