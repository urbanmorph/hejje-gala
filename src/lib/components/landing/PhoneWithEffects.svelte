<script lang="ts">
	interface Props {
		variant?: 'starburst' | 'blur';
		className?: string;
	}

	let { variant = 'blur', className = '' }: Props = $props();
</script>

<div
	class="relative z-20 flex items-center justify-center lg:-ml-[225px] lg:justify-start {className}"
>
	{#if variant === 'starburst'}
		<!-- Starburst Effects -->
		<div class="absolute top-16 -left-8">
			<div
				class="h-8 w-8 bg-white"
				style="clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);"
			></div>
		</div>
		<div class="absolute top-8 left-4">
			<div
				class="h-6 w-6 bg-white"
				style="clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);"
			></div>
		</div>
		<div class="absolute bottom-20 left-16">
			<div
				class="h-8 w-8 bg-white"
				style="clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);"
			></div>
		</div>
	{:else}
		<!-- Blur Effects -->
		<div class="absolute top-12 -left-12 h-32 w-32 rounded-full bg-white opacity-60 blur-2xl"></div>
		<div
			class="absolute -right-12 bottom-12 h-32 w-32 rounded-full bg-white opacity-60 blur-2xl"
		></div>
	{/if}
	<div class="relative z-10">
		<img
			src="/assets/phone.png"
			alt="App Screen"
			class="h-[450px] w-auto object-contain drop-shadow-2xl"
		/>
	</div>
</div>
