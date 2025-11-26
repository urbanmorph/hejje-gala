<script lang="ts">
	import Button from '../ui/button/Button.svelte';

	interface Props {
		text: string;
		variant?: 'pink' | 'green';
		href?: string;
	}

	let { text, variant = 'pink', href }: Props = $props();

	const gradientClasses = {
		pink: 'from-slate-400/30 via-slate-300/20 to-purple-400/30',
		green: 'from-[#A9E2A8] to-[#A9E2A8]'
	};

	const buttonClasses = {
		pink: '!rounded-full !bg-white px-16 py-4 text-xl font-semibold tracking-wider !text-[#FB3E99] uppercase shadow-md transition-all duration-200 hover:!bg-pink-50',
		green:
			'!rounded-full !bg-[#39BC36] px-16 py-4 text-xl font-semibold tracking-wider !text-white uppercase shadow-md transition-all duration-200 hover:!bg-[#35a83f]'
	};
</script>

<div
	class="inline-block rounded-[2.5rem] bg-gradient-to-r {gradientClasses[
		variant
	]} p-[12px] backdrop-blur-sm"
>
	{#if href}
		<a {href} class="block">
			<Button variant="ghost" size="lg" class="relative !h-auto {buttonClasses[variant]}">
				{text}
			</Button>
		</a>
	{:else}
		<Button variant="ghost" size="lg" class="relative !h-auto {buttonClasses[variant]}">
			{text}
		</Button>
	{/if}
</div>
