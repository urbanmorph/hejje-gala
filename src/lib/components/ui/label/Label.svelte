<script lang="ts">
	import type { HTMLLabelAttributes } from 'svelte/elements';

	interface Props extends HTMLLabelAttributes {
		class?: string;
	}

	let { class: className, ...restProps }: Props = $props();
</script>

<label
	class="mb-2 block text-xs font-semibold tracking-wider text-gray-600 uppercase {className}"
	{...restProps}
>
	<slot />
</label>
