<script lang="ts">
	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	const logos = [
		{
			name: 'GBA',
			src: '/assets/gba-karnataka.png',
			alt: 'Greater Bengaluru Authority',
			scale: 1.5
		},
		{ name: 'WRI INDIA', src: '/assets/wri.png', alt: 'WRI India', scale: 1 },
		{ name: 'altmo', src: '/assets/altmo.png', alt: 'AltMo', scale: 1 },
		{ name: 'Walkaluru', src: '/assets/walkaluru.png', alt: 'Walkaluru', scale: 1 }
	];
</script>

{#if isMobile}
	<!-- Mobile: 2 rows layout with larger size and spacing -->
	<div class="grid grid-cols-2 gap-8 lg:gap-16 items-center justify-center">
		{#each logos as logo}
			<div class="flex w-auto items-center justify-center" style="height: {12 * logo.scale}px">
				<img src={logo.src} alt={logo.alt} class="h-full w-auto object-contain scale-60" />
			</div>
		{/each}
	</div>
{:else}
	<!-- Desktop: single row layout -->
	<div class="flex items-center gap-4 lg:gap-6 xl:gap-8">
		{#each logos as logo}
			<div class="flex w-auto items-center justify-center" style="height: {32 * logo.scale}px">
				<img src={logo.src} alt={logo.alt} class="h-full w-auto object-contain scale-80" />
			</div>
		{/each}
	</div>
{/if}
