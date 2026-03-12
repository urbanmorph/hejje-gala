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

<div class="flex flex-wrap items-center justify-center gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
	{#each logos as logo}
		<div class="flex items-center justify-center" style="height: {logo.scale * 24}px">
			<img
				src={logo.src}
				alt={logo.alt}
				class="h-full w-auto object-contain scale-75 sm:scale-80 lg:scale-90 xl:scale-100"
			/>
		</div>
	{/each}
</div>
