<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let loading = $state(true);
	let error: string | null = $state(null);

	onMount(async () => {
		const token = $page.url.searchParams.get('token');

		if (!token) {
			error = 'No token provided';
			loading = false;
			return;
		}

		try {
			const response = await fetch(`/api/login/verify?token=${token}`, {
				method: 'GET',
				credentials: 'include'
			});

			const data = await response.json();

			if (response.ok && data.success) {
				// Redirect to post page after successful login
				goto('/post');
			} else {
				error = data.error || 'Invalid or expired token';
				loading = false;
			}
		} catch (err) {
			error = 'An error occurred while verifying your token';
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Verifying Login - Hejje Gala</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 sm:py-12">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
			{#if loading}
				<div class="space-y-4">
					<div
						class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"
					></div>
					<p class="text-sm sm:text-base text-gray-600">Verifying your login...</p>
				</div>
			{:else if error}
				<div class="space-y-4">
					<div class="text-red-600 text-4xl sm:text-5xl mb-4">✕</div>
					<h1 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
					<p class="text-sm sm:text-base text-gray-600 mb-6 px-2">{error}</p>
					<a
						href="/login"
						class="inline-block px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
					>
						Back to Login
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
