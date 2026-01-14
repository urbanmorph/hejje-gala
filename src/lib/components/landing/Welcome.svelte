<script lang="ts">
	import { welcomeConfig } from '$lib/config/landing';
	import CTAButton from './CTAButton.svelte';
	import OrbitalRing from './OrbitalRing.svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();
</script>

<section id="about" class="relative bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-16'}">
	<div
		class="mx-auto {isMobile
			? 'max-w-[95%]'
			: ''} px-3 sm:px-4 md:px-6 overflow-hidden overflow-x-hidden"
	>
		<div class="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 xl:grid-cols-2">
			{#if !isMobile}
				<div
					class="relative flex ml-32 justify-center lg:justify-start xl:justify-start scale-125 hidden xl:block"
				>
					<div
						class="relative z-10 flex h-80 w-80 items-center justify-center lg:h-[500px] lg:w-[500px]"
					>
						<img
							src="/assets/circle.png"
							alt="Active Mobility"
							class="h-3/5 w-3/5 object-contain"
						/>
						<OrbitalRing />
					</div>
				</div>
			{/if}

			<div
				class="space-y-4 sm:space-y-6 {isMobile
					? 'text-center'
					: 'text-center lg:text-left xl:text-left'}"
			>
				<div class="space-y-3 sm:space-y-4 relative">
					<h2
						class="relative inline-block {isMobile
							? 'text-2xl sm:text-3xl'
							: 'text-4xl'} leading-tight font-bold text-gray-900 lg:text-7xl"
					>
						{#if !isMobile}
							<span
								class="absolute left-[calc(-50%-12rem)] right-[calc(-17vw)] top-1/2 h-12 -translate-y-1/2 bg-gradient-to-r from-[#22D394] to-[#143DE8] opacity-20"
								style="mask-image: radial-gradient(ellipse 250px 300px at left center, transparent 0%, transparent 30%, black 50%, black 100%); -webkit-mask-image: radial-gradient(ellipse 250px 300px at left center, transparent 0%, transparent 30%, black 50%, black 100%);"
							></span>
						{/if}
						<span class="relative z-10 break-words">
							{$_('welcome.about')} <span class="text-red-500">{$_('welcome.highlightText')}</span>
						</span>
					</h2>
					<p
						class="{isMobile
							? 'text-lg sm:text-xl'
							: 'text-3xl'} font-semibold text-gray-900 break-words"
					>
						{$_('welcome.subtitle')}
					</p>
					<p
						class="{isMobile
							? 'text-sm sm:text-base'
							: 'text-2xl'} font-medium text-gray-700 leading-relaxed {isMobile
							? 'max-w-full px-1'
							: 'max-w-[80%]'}"
					>
						{$_('welcome.description')}
					</p>
				</div>
				<div
					class="pt-2 sm:pt-4 {isMobile
						? 'flex justify-center'
						: 'flex justify-center lg:justify-start xl:justify-start'}"
				>
					<CTAButton text={$_('common.knowMore')} variant="green" href="/about" />
				</div>
			</div>
		</div>
	</div>
</section>
