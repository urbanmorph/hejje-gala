<script lang="ts">
	import Button from '../ui/button/Button.svelte';

	interface Props {
		text: string;
		variant?: 'pink' | 'green' | 'greenGradient' | 'red';
		href?: string;
	}

	let { text, variant = 'pink', href }: Props = $props();

	const gradientClasses = {
		pink: '',
		green: '',
		greenGradient: 'from-[#A9E2A8] to-[#A9E2A8]',
		red: ''
	};

	const buttonClasses = {
		pink: '!rounded-full !bg-white px-16 py-4 text-xl font-semibold tracking-wider !text-[#DB3E3E] uppercase shadow-md transition-all duration-200 hover:!bg-pink-50',
		green:
			'!rounded-full !bg-[#39BC36] px-16 py-4 text-xl font-semibold tracking-wider !text-white uppercase shadow-md transition-all duration-200 hover:!bg-[#35a83f]',
		greenGradient:
			'!rounded-full !bg-[#39BC36] px-16 py-4 text-xl font-semibold tracking-wider !text-white uppercase shadow-md transition-all duration-200 hover:!bg-[#35a83f]',
		red: '!rounded-lg !bg-white px-16 py-4 text-xl font-semibold tracking-wider !text-red-600 !border-2 !border-red-600 uppercase shadow-md transition-all duration-200 hover:!bg-red-50'
	};
</script>

{#if variant === 'red'}
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
{:else if variant === 'greenGradient'}
	<div
		class="inline-block rounded-[2.5rem] {variant === 'pink'
			? 'bg-white/20 backdrop-blur-md'
			: `bg-gradient-to-r ${gradientClasses[variant]}`} p-[12px] {variant === 'pink'
			? ''
			: 'backdrop-blur-sm'}"
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
{:else}
	<div
		class="inline-block rounded-[2.5rem] {variant === 'pink'
			? 'bg-white/20 backdrop-blur-md'
			: `bg-gradient-to-r ${gradientClasses[variant]}`} p-[12px] {variant === 'pink'
			? ''
			: 'backdrop-blur-sm'}"
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
{/if}
