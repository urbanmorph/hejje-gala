<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { _ } from 'svelte-i18n';
	import { urls } from '$lib/config/urls';
	import { parseCSV } from '$lib/utils';
	import { ExternalLink } from '@lucide/svelte';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	interface Champion {
		name: string;
		organization: string;
		email: string;
		phone: string;
	}

	let champions = $state([]);
	let loading = $state(true);

	function parseChampions(text: string): Champion[] {
		const rows = parseCSV(text);
		if (rows.length < 2) return [];

		const headers = rows[0].map((h) => h.toLowerCase());
		const nameIdx = headers.findIndex((h) => h.includes('name') && !h.includes('org'));
		const orgIdx = headers.findIndex((h) => h.includes('org') || h.includes('company'));
		const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
		const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));

		if (nameIdx === -1) return [];

		return rows
			.slice(1)
			.map((row) => ({
				name: row[nameIdx] || '',
				organization: orgIdx !== -1 ? row[orgIdx] || '' : '',
				email: emailIdx !== -1 ? row[emailIdx] || '' : '',
				phone: phoneIdx !== -1 ? row[phoneIdx] || '' : ''
			}))
			.filter((c) => c.name !== '');
	}

	async function fetchChampions() {
		try {
			const res = await fetch(urls.championsSheet);
			const text = await res.text();
			champions = parseChampions(text);
		} catch (err) {
			console.error('Failed to fetch champions:', err);
		} finally {
			loading = false;
		}
	}

	onMount(fetchChampions);
</script>

<section class="bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-16'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-[80%]'} px-3 sm:px-4 md:px-6">
		<div class="rounded-lg border bg-white {isMobile ? 'p-3 sm:p-4' : 'p-8 lg:p-12'}">
			<h2
				class="text-center leading-tight font-bold {isMobile
					? 'text-xl sm:text-2xl mb-4'
					: 'text-3xl lg:text-4xl mb-8'}"
			>
				<span class="text-[#DB3E3E]">{$_('champions.title')}</span>
			</h2>

			<p
				class="mx-auto max-w-2xl text-center text-gray-600 {isMobile
					? 'text-sm mb-4'
					: 'text-base mb-8'}"
			>
				{$_('champions.description')}
			</p>

			{#if urls.becomeAChampion !== '#'}
				<div class="flex justify-center {isMobile ? 'mb-4' : 'mb-8'}">
					<a
						href={urls.becomeAChampion}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 rounded-lg bg-[#00A63E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#008f35]"
					>
						{$_('champions.becomeChampion')}
						<ExternalLink class="h-4 w-4" />
					</a>
				</div>
			{/if}

			{#if loading}
				<div class="flex items-center justify-center py-20">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00A63E]"
					></div>
				</div>
			{:else if champions.length === 0}
				<div class="py-20 text-center text-gray-400">
					{$_('champions.noChampions')}
				</div>
			{:else}
				<div
					class="grid gap-4 {isMobile
						? 'grid-cols-2 sm:grid-cols-3'
						: 'grid-cols-3 lg:grid-cols-4'}"
				>
					{#each champions as champion, i (champion.name + champion.email)}
						<div
							class="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm transition-shadow hover:shadow-md"
							in:fade={{ duration: 150, delay: i * 30 }}
						>
							<div class="flex items-start gap-3">
								<div class="min-w-0 flex-1">
									<h3 class="font-semibold text-gray-900 truncate">{champion.name}</h3>
									{#if champion.organization}
										<p class="text-sm text-gray-500 truncate">{champion.organization}</p>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>
