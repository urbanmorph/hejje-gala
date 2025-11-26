<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getTimeRemaining } from '$lib/utils/index';

	interface Props {
		targetDate: Date;
	}

	let { targetDate }: Props = $props();

	let timeRemaining = $state(getTimeRemaining(targetDate));
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		timeRemaining = getTimeRemaining(targetDate);
		interval = setInterval(() => {
			timeRemaining = getTimeRemaining(targetDate);
		}, 1000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	const labels = ['Days', 'Hours', 'Minutes', 'Seconds'];
	const values = [
		timeRemaining.days,
		timeRemaining.hours,
		timeRemaining.minutes,
		timeRemaining.seconds
	];
</script>

<div class="mb-24 flex flex-col items-center justify-center">
	<div class="mb-3 flex items-center justify-center gap-3">
		{#each labels as label}
			<span
				class="w-16 text-center text-xs font-light tracking-wider text-white lg:w-20 lg:text-sm"
			>
				{label}
			</span>
		{/each}
	</div>
	<div class="flex items-center justify-center gap-1">
		{#each values as value, i}
			<span class="w-16 text-center text-4xl font-semibold text-[#EFBC4A] lg:w-20 lg:text-5xl">
				{String(value).padStart(2, '0')}
			</span>
			{#if i < values.length - 1}
				<span class="text-4xl font-semibold text-[#EFBC4A] lg:text-5xl">:</span>
			{/if}
		{/each}
	</div>
</div>
