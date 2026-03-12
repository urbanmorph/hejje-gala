<script lang="ts">
	import { _ } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();
</script>

<section class="relative overflow-x-hidden bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-6'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-6xl'} px-3 sm:px-4 md:px-6">
		<!-- Title -->
		<div class="{isMobile ? 'mb-6 sm:mb-8' : 'mb-16'} text-center">
			<h2
				class="relative inline-block {isMobile
					? 'text-xl sm:text-2xl'
					: 'text-4xl'} leading-tight font-bold text-gray-900 lg:text-5xl break-words px-2"
			>
				{#if !isMobile}
					<span
						class="absolute left-[calc(-190%)] right-[calc(-190%)] top-1/2 h-6 -translate-y-1/2 bg-gradient-to-r from-[#22D394] to-[#143DE8] opacity-20"
					></span>
				{/if}
				<span class="relative z-10">
					{$_('whyHejjeGala.title')} <span class="text-red-500">{$_('whyHejjeGala.subtitle')}</span>
				</span>
			</h2>
		</div>

		<!-- Three columns -->
		<div class="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-3 {isMobile ? 'mb-6 sm:mb-8' : 'mb-16'}">
			<!-- Column 1 -->
			<div
				class="space-y-3 sm:space-y-4 {isMobile
					? 'p-3 sm:p-4'
					: 'p-6'} rounded-xl bg-white border border-1 shadow-sm hover:shadow-md transition-shadow"
			>
				<div
					class="{isMobile
						? 'w-8 h-8 sm:w-10 sm:h-10'
						: 'w-12 h-12'} rounded-lg flex items-center justify-center mb-2"
				>
					<svg
						class="{isMobile ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-6 h-6'} text-[#00A63E]"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
				</div>
				<h3
					class="{isMobile ? 'text-base sm:text-lg' : 'text-xl'} font-bold text-black break-words"
				>
					{$_('whyHejjeGala.buildCulture.title')}
				</h3>
				<p
					class="{isMobile
						? 'text-xs sm:text-sm'
						: 'text-base'} text-black leading-relaxed break-words"
				>
					{$_('whyHejjeGala.buildCulture.description')}
				</p>
			</div>

			<!-- Column 2 -->
			<div
				class="space-y-3 sm:space-y-4 {isMobile
					? 'p-3 sm:p-4'
					: 'p-6'} rounded-xl bg-white border border-1 shadow-sm hover:shadow-md transition-shadow"
			>
				<div
					class="{isMobile
						? 'w-8 h-8 sm:w-10 sm:h-10'
						: 'w-12 h-12'} rounded-lg flex items-center justify-center mb-2"
				>
					<svg
						class="{isMobile ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-6 h-6'} text-[#00A63E]"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h3
					class="{isMobile ? 'text-base sm:text-lg' : 'text-xl'} font-bold text-black break-words"
				>
					{$_('whyHejjeGala.supportShift.title')}
				</h3>
				<p
					class="{isMobile
						? 'text-xs sm:text-sm'
						: 'text-base'} text-black leading-relaxed break-words"
				>
					{$_('whyHejjeGala.supportShift.description')}
				</p>
			</div>

			<!-- Column 3 -->
			<div
				class="space-y-3 sm:space-y-4 {isMobile
					? 'p-3 sm:p-4'
					: 'p-6'} rounded-xl bg-white border border-1 shadow-sm hover:shadow-md transition-shadow"
			>
				<div
					class="{isMobile
						? 'w-8 h-8 sm:w-10 sm:h-10'
						: 'w-12 h-12'} rounded-lg flex items-center justify-center mb-2"
				>
					<svg
						class="{isMobile ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-6 h-6'} text-[#00A63E]"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				</div>
				<h3
					class="{isMobile ? 'text-base sm:text-lg' : 'text-xl'} font-bold text-black break-words"
				>
					{$_('whyHejjeGala.measureImpact.title')}
				</h3>
				<p
					class="{isMobile
						? 'text-xs sm:text-sm'
						: 'text-base'} text-black leading-relaxed break-words"
				>
					{$_('whyHejjeGala.measureImpact.description')}
				</p>
			</div>
		</div>

	</div>
</section>
