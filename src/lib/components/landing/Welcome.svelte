<script lang="ts">
	import { welcomeConfig } from '$lib/config/landing';
	import CTAButton from './CTAButton.svelte';
	import OrbitalRing from './OrbitalRing.svelte';
</script>

<section class="relative bg-[#FFFCF8] py-16">
	<div class="mx-auto max-w-7xl px-6">
		<div class="mb-12 text-center">
			<h2 class="text-3xl leading-tight font-bold text-gray-900 lg:text-4xl">
				{welcomeConfig.title}
			</h2>
			<div class="relative mt-2 flex items-center justify-center gap-3">
				<svg
					class="relative z-20 h-6 w-16 text-gray-400"
					viewBox="0 0 64 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M0 12 L52 12" stroke="currentColor" stroke-width="2" />
					<path d="M48 8 L56 12 L48 16" stroke="currentColor" stroke-width="2" fill="none" />
				</svg>
				<span class="relative z-10 text-3xl font-bold text-pink-500 lg:text-4xl">
					<div
						class="absolute top-1/2 right-[calc(-2vw)] left-[calc(-50vw+50%-1.5rem-4rem)] z-[-1] h-6 -translate-y-1/2 bg-gradient-to-r from-[#22D394] via-[#143DE8] to-transparent opacity-20"
					></div>
					{welcomeConfig.highlightText}
				</span>
			</div>
		</div>

		<div class="grid items-center gap-12 lg:grid-cols-2">
			<div class="relative flex justify-center lg:justify-end">
				<div class="relative z-10 flex h-72 w-72 items-center justify-center lg:h-96 lg:w-96">
					<img src="/assets/circle.png" alt="Active Mobility" class="h-3/4 w-3/4 object-contain" />
					<OrbitalRing />
				</div>
			</div>

			<div class="space-y-6">
				<div class="space-y-5">
					{#each welcomeConfig.features as feature}
						<div>
							<h3 class="font-[Manrope] font-bold">{feature.title}</h3>
							<p class="font-[Manrope] text-base font-medium">{feature.description}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="mt-12 flex justify-center">
			<CTAButton text="REGISTER NOW" variant="green" href="/register" />
		</div>
	</div>
</section>
