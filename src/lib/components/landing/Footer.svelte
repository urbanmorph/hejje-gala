<script lang="ts">
	import { base } from '$app/paths';
	import { siteConfig, footerConfig } from '$lib/config/landing';
	import SocialIcons from './SocialIcons.svelte';
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
			class="flex flex-col items-center gap-6 md:grid md:grid-cols-[1fr_2fr_1fr] md:items-center md:py-6"
		>
			<div class="flex items-center gap-2 md:justify-start">
				<img
					src="/assets/logo-footer.png"
					alt="{siteConfig.name} Logo"
					class="h-12 w-auto object-contain"
				/>
			</div>

			<nav class="flex flex-wrap items-center justify-center gap-6 md:justify-center">
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

			<div class="flex items-center justify-end md:justify-end">
				<SocialIcons socials={footerConfig.social} />
			</div>
		</div>
	</div>

	<div class="mt-6 max-w-[100%] mx-auto px-6 border-t border-gray-200 pt-4">
		<div
			class="mt-2 {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} mx-auto flex {isMobile
				? 'flex-col gap-4'
				: 'items-center justify-between'}"
		>
			<span class="text-sm font-medium underline text-[#231A36]">
				{$_('footer.license')}
				<a
					href="https://creativecommons.org/licenses/by-sa/4.0/"
					target="_blank"
					rel="noopener noreferrer"
					class="underline hover:text-gray-400 transition-colors"
				>
					{$_('footer.licenseName')}
				</a>
			</span>
			<span class="text-sm text-[#231A36] {isMobile ? 'text-center' : ''}"
				>{$_('footer.builtBy')}
				<a
					href="https://altmo.app/"
					target="_blank"
					rel="noopener noreferrer"
					class="underline hover:text-gray-400 transition-colors">Altmo</a
				></span
			>
		</div>
	</div>
</footer>
