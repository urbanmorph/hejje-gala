<script lang="ts">
	import { _ } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();
</script>

<section class="bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-16 lg:py-24'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-3 sm:px-4 md:px-6">
		<div class="mb-6 sm:mb-8 md:mb-10 text-center">
			<h2
				class="{isMobile
					? 'text-xl sm:text-2xl'
					: 'text-3xl'} font-bold text-[#DB3E3E] lg:text-7xl break-words px-2"
			>
				{$_('stats.whyTitle')}{' '}
				<span
					class="mt-4 sm:mt-6 {isMobile
						? 'text-base sm:text-lg'
						: 'text-xl'} font-medium block mt-1 text-[#DB3E3E] lg:text-3xl"
					>{$_('stats.whatCanWeAchieve')}</span
				>
			</h2>
		</div>

		<div class="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 mx-auto">
			<div class="space-y-2">
				<img
					src="/assets/why-before.png"
					alt={$_('stats.beforeTransformation')}
					class="w-full h-auto object-cover rounded"
				/>
			</div>
			<div class="space-y-2">
				<img
					src="/assets/why-after.png"
					alt={$_('stats.afterTransformation')}
					class="w-full h-auto object-cover rounded"
				/>
			</div>
		</div>
	</div>
</section>
