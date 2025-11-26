<script lang="ts">
	import { siteConfig, footerConfig } from '$lib/config/landing';
	import SocialIcons from './SocialIcons.svelte';
</script>

<footer class="border-t border-gray-200 bg-white py-6">
	<div class="mx-auto max-w-7xl px-6">
		<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
			<div class="flex items-center gap-2">
				<img
					src="/assets/logo.png"
					alt="{siteConfig.name} Logo"
					class="h-9 w-auto object-contain invert-100"
				/>
			</div>

			<nav class="flex flex-wrap items-center justify-center gap-5">
				{#each footerConfig.links as link}
					<a
						href={link.href}
						class="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<SocialIcons socials={footerConfig.social} />
		</div>
	</div>
</footer>
