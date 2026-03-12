<script lang="ts">
	import { base } from '$app/paths';
	import { siteConfig, footerConfig } from '$lib/config/landing';
	import { _ } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
		disabledLabels?: Set;
	}

	let { isMobile = false, disabledLabels = new Set([]) }: Props = $props();

	// Helper function to get translated navigation label
	function getNavLabel(label: string): string {
		const labelMap: Record = {
			Home: 'common.home',
			Leaderboard: 'common.leaderboard',
			Champions: 'common.champions',
			Activities: 'common.activities',
			'About Challenge': 'common.aboutChallenge',
			FAQs: 'common.faqs'
		};
		return labelMap[label] || label;
	}
</script>

<footer class="bg-[#FFFCF8] py-4 mt-4">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-6">
		<div
			class="flex flex-col items-center gap-6 md:grid md:grid-cols-[1fr_2fr] md:items-center md:py-6"
		>
			<div class="flex items-center gap-2 md:justify-start">
				<img
					src="/assets/logo-footer.png"
					alt="{siteConfig.name} Logo"
					class="h-12 w-auto object-contain"
				/>
			</div>

			<nav class="flex flex-wrap items-center justify-center gap-6 md:justify-end">
				{#each footerConfig.links as link}
					{#if disabledLabels.has(link.label)}
						<span
							class="cursor-not-allowed text-base font-base text-[#231A36]"
							aria-disabled="true"
						>
							{$_(getNavLabel(link.label))}
						</span>
					{:else}
						<a
							href={link.label === 'Home' ? base || '/' : link.href}
							class="text-base font-base text-[#231A36] transition-colors hover:text-gray-400"
						>
							{$_(getNavLabel(link.label))}
						</a>
					{/if}
				{/each}
			</nav>
		</div>
	</div>

	<div class="mt-6 max-w-[100%] mx-auto px-6 border-t border-gray-200 pt-4">
		<div
			class="mt-2 {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} mx-auto flex flex-wrap items-center justify-center gap-4 text-sm text-[#231A36]"
		>
			<!-- CC-BY-SA 4.0 icon -->
			<a
				href="https://creativecommons.org/licenses/by-sa/4.0/"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
				title="CC BY-SA 4.0"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2ZM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Z"/>
					<path d="M10.08 10.86c.05-.33.16-.62.3-.87s.34-.46.59-.62c.24-.15.54-.22.91-.23.23.01.44.05.63.13.2.09.38.21.52.36s.25.33.34.53l.04.09-1.3.74-.01-.04c-.05-.15-.13-.28-.25-.38s-.26-.15-.43-.16c-.27.01-.48.13-.63.37-.15.23-.23.55-.24.95 0 .41.08.73.24.97.16.23.37.35.63.36.17 0 .32-.06.44-.17.13-.12.22-.27.28-.46l.01-.04 1.3.68-.04.09c-.1.23-.23.43-.4.59-.17.17-.37.3-.59.39-.23.09-.48.14-.76.14-.37 0-.69-.08-.96-.23s-.48-.37-.64-.64-.27-.58-.34-.93-.1-.72-.1-1.12c0-.39.03-.76.1-1.1Z"/>
				</svg>
				<span class="font-medium">CC BY-SA 4.0</span>
			</a>

			<span class="text-gray-300">|</span>

			<!-- Instagram -->
			<a
				href="https://www.instagram.com/hejjegala_2026/"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
				aria-label="Instagram"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
					<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
					<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
				</svg>
				<span class="font-medium">Instagram</span>
			</a>

			<span class="text-gray-300">|</span>

			<!-- Built by Urban Morph, Powered by Altmo -->
			<span>
				{$_('footer.builtBy')}
				<a
					href="https://urbanmorph.com/"
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium underline hover:text-gray-400 transition-colors"
				>Urban Morph</a>
				&middot;
				{$_('footer.poweredBy')}
				<a
					href="https://altmo.app/"
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium underline hover:text-gray-400 transition-colors"
				>Altmo</a>
			</span>
		</div>
	</div>
</footer>
