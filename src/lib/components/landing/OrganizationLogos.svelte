<script lang="ts">
	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	const logos = [
		{ name: 'GBA', src: '/assets/gba.png', alt: 'GBA' },
		{ name: 'WRI INDIA', src: '/assets/wri.png', alt: 'WRI India' },
		{ name: 'altmo', src: '/assets/altmo.png', alt: 'AltMo' },
		{ name: 'Walkaluru', src: '/assets/walkaluru.png', alt: 'Walkaluru' }
	];
</script>

{#if isMobile}
	<!-- Mobile: 2 rows layout with larger size and spacing -->
	<div class="grid grid-cols-2 gap-8 lg:gap-16 items-center justify-center">
		{#each logos as logo}
			<div class="flex h-12 w-auto items-center justify-center">
				<img src={logo.src} alt={logo.alt} class="h-full w-auto object-contain scale-60" />
			</div>
		{/each}
	</div>
{:else}
	<!-- Desktop: single row layout -->
	<div class="flex items-center gap-4 lg:gap-6 xl:gap-8">
		{#each logos as logo}
			<div class="flex h-8 w-auto items-center justify-center">
				<img src={logo.src} alt={logo.alt} class="scale-80" />
			</div>
		{/each}
	</div>
{/if}
