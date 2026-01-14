<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		class?: string;
	}

	let { class: className, value = $bindable(), ...restProps }: Props = $props();
</script>

<input
	class="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:border-[#39BC36] focus-visible:ring-2 focus-visible:ring-[#39BC36]/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 {className}"
	bind:value
	{...restProps}
/>
