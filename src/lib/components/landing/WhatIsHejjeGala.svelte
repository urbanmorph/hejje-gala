<script lang="ts">
	import { welcomeConfig } from '$lib/config/landing';
	import OrbitalRing from './OrbitalRing.svelte';
	import { _ } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();
</script>

<section class="relative bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-6 mb-12'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-7xl'} px-3 sm:px-4 md:px-6">
		<div class="space-y-4 sm:space-y-6 order-1 lg:order-2 text-center lg:text-left xl:text-left">
			<div class="space-y-3 sm:space-y-5">
				<h2
					class="relative inline-block {isMobile
						? 'text-xl sm:text-2xl'
						: 'text-4xl'} leading-tight font-bold text-gray-900 lg:text-7xl break-words"
				>
					<span class="relative z-10">
						{$_('whatIsHejjeGala.title')}
						<span class="text-red-500">{$_('whatIsHejjeGala.titleHejjeGala')}?</span>
					</span>
				</h2>
				<div>
					<p
						class="{isMobile
							? 'text-base sm:text-lg px-1'
							: 'text-xl'} lg:text-2xl font-medium break-words"
					>
						{$_('whatIsHejjeGala.subtitle')}
					</p>
				</div>
				<div class={isMobile ? 'grid grid-cols-1' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'}>
					<p
						class="{isMobile
							? 'text-sm sm:text-base w-full px-1'
							: 'text-base'} font-medium text-gray-700 leading-relaxed lg:text-xl break-words mx-auto lg:mx-0 xl:mx-0"
					>
						{$_('welcome.description')}
					</p>
				</div>
			</div>
		</div>
	</div>
</section>
