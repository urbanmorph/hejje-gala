<script lang="ts">
	import { _ } from 'svelte-i18n';

	function openLetter() {
		if (typeof window === 'undefined') return;

		window.open('/GBA_CC_Letter_Companies.pdf', '_blank', 'noopener,noreferrer');
	}
</script>

<button
	onclick={openLetter}
	class="fixed bottom-6 left-6 z-50 px-4 py-2 rounded-full bg-[#231A36] text-white text-sm sm:text-base shadow-lg hover:bg-[#3a2d5a] transition-all duration-300 hover:scale-105"
	aria-label={$_('common.gbaLetter')}
>
	{$_('common.gbaLetter')}
</button>
