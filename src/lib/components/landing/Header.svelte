<script lang="ts">
	import { siteConfig, navigation } from '$lib/config/landing';
	import AppStoreButtons from './AppStoreButtons.svelte';

	const currentPage = 'Home';
</script>

<header class="absolute top-0 right-0 left-0 z-50 from-black/40">
	<div class="mx-auto grid max-w-7xl grid-cols-3 items-center px-6 py-4">
		<div class="flex items-center gap-2">
			<img src="/assets/logo.png" alt="{siteConfig.name} Logo" class="h-9 w-auto object-contain" />
		</div>

		<nav class="hidden items-center justify-center gap-6 md:flex lg:gap-8">
			{#each navigation as link}
				<a
					href={link.href}
					class="group relative pb-1 text-sm font-medium whitespace-nowrap text-white transition-colors text-stroke-1 text-stroke-black hover:text-gray-200 lg:text-sm"
				>
					{link.label}
					<span
						class="absolute bottom-0 left-0 h-0.5 bg-yellow-400 transition-all duration-300 ease-out {link.label ===
						currentPage
							? 'w-[30%]'
							: 'w-0 group-hover:w-[30%]'}"
					></span>
				</a>
			{/each}
		</nav>

		<div class="flex justify-end">
			<AppStoreButtons size="sm" />
		</div>
	</div>
</header>
