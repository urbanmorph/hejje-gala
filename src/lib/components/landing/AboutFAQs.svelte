<script lang="ts">
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { _ } from 'svelte-i18n';

	interface Props {
		isMobile?: boolean;
	}

	let { isMobile = false }: Props = $props();

	// FAQ items from i18n
	const faqs = $derived($_('aboutFAQs.faqs') as unknown as any[]);

	const INITIAL_VISIBLE = 20;
	let openIndex = $state(null);
	let showMore = $state(false);

	const visibleFaqs = $derived(showMore ? faqs : faqs.slice(0, INITIAL_VISIBLE));

	function toggleFAQ(faqIndex: number) {
		openIndex = openIndex === faqIndex ? null : faqIndex;
	}
</script>

<section id="faqs" class="relative bg-[#FFFCF8] {isMobile ? 'py-6 sm:py-8' : 'py-20'}">
	<div class="mx-auto {isMobile ? 'max-w-[95%]' : 'max-w-4xl'} px-3 sm:px-4 md:px-6">
		<!-- Title -->
		<div class="{isMobile ? 'mb-6 sm:mb-8' : 'mb-12'} text-center">
			<h2
				class="{isMobile
					? 'text-xl sm:text-2xl'
					: 'text-4xl'} leading-tight font-bold text-gray-900 lg:text-5xl mb-3 sm:mb-4 break-words px-2"
			>
				{$_('aboutFAQs.title')}
			</h2>
		</div>

		<!-- FAQ Items -->
		<div class="space-y-3 sm:space-y-4">
			{#each visibleFaqs as faq, visibleIndex}
				{@const actualIndex = showMore ? visibleIndex : visibleIndex}
				{@const isOpen = openIndex === actualIndex}
				<div
					class="border border-gray-200 rounded-xl bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-md"
				>
					<button
						onclick={() => toggleFAQ(actualIndex)}
						class="w-full text-left {isMobile
							? 'p-3 sm:p-4'
							: 'p-5'} flex items-center justify-between gap-2 sm:gap-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl"
					>
						<h3
							class="{isMobile
								? 'text-sm sm:text-base'
								: 'text-lg'} font-semibold text-gray-900 pr-2 sm:pr-4 flex-1 break-words"
						>
							{faq.question}
						</h3>
						<svg
							class="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 {isOpen
								? 'rotate-180'
								: ''}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
					{#if isOpen}
						<div
							transition:slide={{ duration: 300, easing: quintOut }}
							class={isMobile ? 'px-3 sm:px-4 pb-3 sm:pb-4' : 'px-5 pb-5'}
						>
							<div
								class="{isMobile
									? 'text-xs sm:text-sm'
									: 'text-base'} text-gray-700 leading-relaxed pt-2 border-t border-gray-100 break-words"
							>
								{#if faq.type === 'text'}
									{#if faq.highlightText}
										{@const parts = faq.answer.split(`"${faq.highlightText}"`)}
										{#if parts.length > 1}
											{parts[0]}<span class="font-semibold">"{faq.highlightText}"</span>{parts[1]}
										{:else}
											{faq.answer}
										{/if}
									{:else}
										{faq.answer}
									{/if}
								{:else if faq.type === 'list' && faq.items}
									<ul class="mt-2 list-disc list-inside space-y-1">
										{#each faq.items as item}
											{@const listItem = item as { label: string; value: string }}
											<li>
												<span class="font-medium">{listItem.label}</span>
												{listItem.value}
											</li>
										{/each}
									</ul>
								{:else if faq.type === 'mixed' && faq.items}
									<p class="mt-2">{faq.text}</p>
									<ul class="mt-2 list-disc list-inside space-y-1">
										{#each faq.items as item}
											{@const stringItem = item as string}
											<li>{stringItem}</li>
										{/each}
									</ul>
									{#if faq.textAfter}
										<p class="mt-2">{faq.textAfter}</p>
									{/if}
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
