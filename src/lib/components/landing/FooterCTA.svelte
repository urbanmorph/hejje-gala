<script lang="ts">
	import { footerCTAConfig } from '$lib/config/landing';
	import CTAButton from './CTAButton.svelte';
	import AppStoreButtons from './AppStoreButtons.svelte';

	const titleParts = footerCTAConfig.title.split(' ');
</script>

<section class="bg-gradient-to-r from-blue-600 via-blue-500 to-green-400 py-16">
	<div class="mx-auto max-w-4xl px-6 text-center">
		<h2 class="mb-3 text-3xl font-semibold text-white lg:text-4xl">
			{titleParts.slice(0, 2).join(' ')}<br />{titleParts.slice(2).join(' ')}
		</h2>

		<p class="mb-6 font-[Manrope] text-sm font-medium text-white/90">
			{footerCTAConfig.description}
		</p>

		<div class="mb-6">
			<CTAButton text={footerCTAConfig.ctaText} variant="pink" href={footerCTAConfig.ctaLink} />
		</div>

		<AppStoreButtons size="md" className="justify-center" />
	</div>
</section>
