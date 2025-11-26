<script lang="ts">
	const logos = [
		{ src: '/assets/altmo.png', alt: 'AltMo' },
		{ src: '/assets/wri.png', alt: 'WRI India' }
	];
</script>

<div
	class="absolute right-0 bottom-0 left-0 border-t border-white/20 bg-white/70 py-6 backdrop-blur-md"
>
	<div class="mx-auto max-w-7xl px-6">
		<div class="flex items-center justify-center gap-8">
			{#each logos as logo}
				<div class="flex h-10 w-28 items-center justify-center">
					<img src={logo.src} alt={logo.alt} class="max-h-full max-w-full object-contain" />
				</div>
			{/each}
		</div>
	</div>
</div>
