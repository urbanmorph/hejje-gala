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

	const INITIAL_VISIBLE = 50;
	let openIndex: number | null = $state(null);
	let showMore = $state(false);

	const visibleFaqs = $derived(showMore ? faqs : faqs.slice(0, INITIAL_VISIBLE));

	function toggleFAQ(faqIndex: number) {
		openIndex = openIndex === faqIndex ? null : faqIndex;
	}

	// Parse markdown links [text](url) and convert to anchor tags
	function parseMarkdownLinks(text: string): string {
		if (!text) return '';
		// Match markdown links: [text](url)
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
		return text.replace(linkRegex, (match, linkText, url) => {
			// Escape HTML in link text to prevent XSS
			const escapedText = linkText
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
			const isExternal = url.startsWith('http');
			const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
			return `<a href="${url}"${attrs} class="text-blue-600 hover:text-blue-800 underline">${escapedText}</a>`;
		});
	}

	// Parse text with markdown links and newlines
	function parseText(text: string): string {
		if (!text) return '';
		// First parse markdown links
		let parsed = parseMarkdownLinks(text);
		// Then convert newlines to <br> tags
		parsed = parsed.replace(/\n/g, '<br>');
		return parsed;
	}

	// Group FAQs by section
	const groupedFaqs = $derived.by(() => {
		const groups: Record = {};
		faqs.forEach((faq) => {
			const section = faq.section || 'General';
			if (!groups[section]) {
				groups[section] = [];
			}
			groups[section].push(faq);
		});
		return groups;
	});

	// Get unique sections in order
	const sections = $derived.by(() => {
		const seen = new Set();
		const result: string[] = [];
		faqs.forEach((faq) => {
			const section = faq.section || 'General';
			if (!seen.has(section)) {
				seen.add(section);
				result.push(section);
			}
		});
		return result;
	});
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
		<div class="space-y-6 sm:space-y-8">
			{#each sections as section}
				{@const sectionFaqs = groupedFaqs[section] || []}
				{@const visibleSectionFaqs = showMore ? sectionFaqs : sectionFaqs}

				<!-- Section Header -->
				{#if section !== 'General' || sections.length === 1}
					<div class="mt-6 first:mt-0">
						<h3
							class="{isMobile
								? 'text-lg sm:text-xl'
								: 'text-2xl'} font-bold text-gray-900 mb-4 sm:mb-6 pb-2 border-b border-gray-300"
						>
							{section}
						</h3>
					</div>
				{/if}

				<!-- Section FAQs -->
				<div class="space-y-3 sm:space-y-4">
					{#each visibleSectionFaqs as faq, faqIndex}
						{@const globalIndex = faqs.indexOf(faq)}
						{@const isOpen = openIndex === globalIndex}
						<div
							class="border border-gray-200 rounded-xl bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-md"
						>
							<button
								onclick={() => toggleFAQ(globalIndex)}
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
													{@html parseText(parts[0])}<span class="font-semibold"
														>"{faq.highlightText}"</span
													>{@html parseText(parts[1])}
												{:else}
													{@html parseText(faq.answer)}
												{/if}
											{:else}
												{@html parseText(faq.answer)}
											{/if}
										{:else if faq.type === 'list' && faq.items}
											<ul class="mt-2 list-disc list-inside space-y-1">
												{#each faq.items as item}
													{@const listItem = item as { label: string; value: string }}
													<li>
														<span class="font-medium">{listItem.label}</span>
														{@html parseText(listItem.value)}
													</li>
												{/each}
											</ul>
										{:else if faq.type === 'mixed' && faq.items}
											{#if faq.text}
												<p class="mt-2">{@html parseText(faq.text)}</p>
											{/if}
											<ul class="mt-2 list-disc list-inside space-y-1">
												{#each faq.items as item}
													{@const stringItem = item as string}
													<li>{@html parseText(stringItem)}</li>
												{/each}
											</ul>
											{#if faq.textAfter}
												<p class="mt-2">{@html parseText(faq.textAfter)}</p>
											{/if}
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</section>
