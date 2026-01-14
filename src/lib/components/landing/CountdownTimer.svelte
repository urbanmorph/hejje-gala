<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getTimeRemaining } from '$lib/utils/index';
	import { _ } from 'svelte-i18n';

	interface Props {
		targetDate: Date;
	}

	let { targetDate }: Props = $props();

	let timeRemaining = $state(getTimeRemaining(targetDate));
	let interval: ReturnType | null = null;

	onMount(() => {
		timeRemaining = getTimeRemaining(targetDate);
		interval = setInterval(() => {
			timeRemaining = getTimeRemaining(targetDate);
		}, 1000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	const labels = $derived([
		$_('countdownTimer.days'),
		$_('countdownTimer.hours'),
		$_('countdownTimer.minutes'),
		$_('countdownTimer.seconds')
	]);
	const values = $derived([
		timeRemaining.days,
		timeRemaining.hours,
		timeRemaining.minutes,
		timeRemaining.seconds
	]);
</script>

<div class="mb-6 flex flex-col items-center justify-center">
	<div class="mb-3 flex items-center justify-center">
		{#each labels as label, i}
			<div class="flex flex-col items-center mb-3">
				<span
					class="w-16 mb-2 text-center text-xs font-light tracking-wider text-white lg:w-20 lg:text-base"
				>
					{label}
				</span>
				<span class="w-16 text-center text-4xl font-semibold text-white lg:w-20 lg:text-5xl">
					{String(values[i]).padStart(2, '0')}
				</span>
			</div>
			{#if i < labels.length - 1}
				<span class="text-4xl font-semibold text-white lg:text-5xl mx-2">:</span>
			{/if}
		{/each}
	</div>
</div>
