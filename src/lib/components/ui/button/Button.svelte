<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'default' | 'outline' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		class?: string;
		children?: any;
	}

	let {
		variant = 'default',
		size = 'default',
		class: className,
		children,
		...restProps
	}: Props = $props();

	const variants = {
		default: 'bg-blue-600 text-white hover:bg-blue-700',
		outline: 'border border-gray-300 bg-white hover:bg-gray-50',
		ghost: 'hover:bg-gray-100',
		link: 'text-blue-600 underline-offset-4 hover:underline'
	};

	const sizes = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 px-3',
		lg: 'h-11 px-8',
		icon: 'h-10 w-10'
	};
</script>

<button
	class="inline-flex items-center justify-center rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 {variants[
		variant
	]} {sizes[size]} {className}"
	{...restProps}
>
	{@render children?.()}
</button>
