<script lang="ts">
	import { testimonialsConfig } from '$lib/config/landing';
</script>

<section class="bg-[#FFFCF8] py-16">
	<div class="mx-auto max-w-7xl px-6">
		<div class="mb-10 text-center">
			<h2 class="mb-2 text-3xl font-semibold text-green-600">{testimonialsConfig.title}</h2>
			<p class="font-[Manrope] text-sm font-medium text-gray-600">
				{testimonialsConfig.description}
			</p>
		</div>

		<!-- Testimonials Grid -->
		<div class="grid gap-6 md:grid-cols-3">
			{#each testimonialsConfig.testimonials as testimonial}
				<div class="relative overflow-hidden bg-[#FFFCF8]">
					<!-- User Image -->
					<div class="relative w-full">
						<img src="/assets/testimonial.png" alt={testimonial.name} class="h-full w-full" />
					</div>

					<!-- Text Card - Overlapping with image and narrower -->
					<div class="relative -mt-20 w-[75%] bg-white p-5">
						<!-- Quote -->
						<p class="mb-4 text-left text-sm text-gray-600 italic">
							<span class="font-serif text-lg text-pink-500">"</span>{testimonial.quote}
						</p>

						<!-- User Info - Left aligned -->
						<div class="text-left">
							<p class="text-sm font-medium text-gray-900">{testimonial.name}</p>
							<p class="text-xs text-gray-600">{testimonial.role}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
