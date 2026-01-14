<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import TipTapEditor from '$lib/components/TipTapEditor.svelte';
	import { Button } from '$lib/components/ui/button';

	let editorComponent: TipTapEditor | null = $state(null);
	let submitting = $state(false);
	let message = $state(null);
	let editorContent = $state('');

	const user = $derived($page.data.user);

	async function handleSubmit() {
		if (!editorComponent) return;

		const content = editorComponent.getContent();
		if (!content || content.trim() === '<p></p>' || content.trim() === '') {
			message = { type: 'error', text: 'Please enter some content' };
			return;
		}

		submitting = true;
		message = null;

		try {
			const response = await fetch('/api/posts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ content })
			});

			const data = await response.json();

			if (response.ok && data.success) {
				message = { type: 'success', text: 'Post saved successfully!' };
				editorComponent.clearContent();
			} else {
				message = {
					type: 'error',
					text: data.error || 'Failed to save post. Please try again.'
				};
			}
		} catch (error) {
			message = {
				type: 'error',
				text: 'An error occurred. Please try again.'
			};
		} finally {
			submitting = false;
		}
	}

	function handleBold() {
		const editor = editorComponent?.getEditor();
		editor?.chain().focus().toggleBold().run();
	}

	function handleItalic() {
		const editor = editorComponent?.getEditor();
		editor?.chain().focus().toggleItalic().run();
	}

	function handleHeading() {
		const editor = editorComponent?.getEditor();
		editor?.chain().focus().toggleHeading({ level: 2 }).run();
	}

	function isBold() {
		const editor = editorComponent?.getEditor();
		return editor?.isActive('bold') || false;
	}

	function isItalic() {
		const editor = editorComponent?.getEditor();
		return editor?.isActive('italic') || false;
	}

	function isHeading() {
		const editor = editorComponent?.getEditor();
		return editor?.isActive('heading', { level: 2 }) || false;
	}
</script>

<svelte:head>
	<title>Post - Hejje Gala</title>
</svelte:head>

{#if user}
	<div class="min-h-screen bg-gray-50 py-6 sm:py-8 px-3 sm:px-4">
		<div class="max-w-4xl mx-auto">
			<div class="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
				<div class="mb-4 sm:mb-6">
					<h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Post</h1>
					<p class="text-sm sm:text-base text-gray-600 break-words">Logged in as {user.email}</p>
				</div>

				<!-- Toolbar -->
				<div
					class="border-b border-gray-200 pb-2 sm:pb-3 mb-3 sm:mb-4 flex gap-1.5 sm:gap-2 flex-wrap"
				>
					<button
						type="button"
						onclick={handleBold}
						class="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md {isBold()
							? 'bg-gray-200'
							: ''}"
					>
						<strong>B</strong>
					</button>
					<button
						type="button"
						onclick={handleItalic}
						class="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md {isItalic()
							? 'bg-gray-200'
							: ''}"
					>
						<em>I</em>
					</button>
					<button
						type="button"
						onclick={handleHeading}
						class="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md {isHeading()
							? 'bg-gray-200'
							: ''}"
					>
						H2
					</button>
				</div>

				<!-- Editor -->
				<div class="border border-gray-300 rounded-lg min-h-[250px] sm:min-h-[300px] mb-3 sm:mb-4">
					<TipTapEditor
						bind:this={editorComponent}
						onUpdate={(content) => (editorContent = content)}
					/>
				</div>

				{#if message}
					<div
						class="p-2 sm:p-3 rounded-md text-xs sm:text-sm mb-3 sm:mb-4 {message.type === 'success'
							? 'bg-green-50 text-green-800'
							: 'bg-red-50 text-red-800'}"
					>
						{message.text}
					</div>
				{/if}

				<div class="flex flex-col sm:flex-row gap-2 sm:gap-4">
					<Button
						onclick={handleSubmit}
						disabled={submitting || !editorComponent}
						class="w-full sm:w-auto text-sm sm:text-base"
					>
						{submitting ? 'Saving...' : 'Save Post'}
					</Button>
					<Button
						variant="outline"
						onclick={() => goto('/')}
						class="w-full sm:w-auto text-sm sm:text-base">Back to Home</Button
					>
				</div>
			</div>
		</div>
	</div>
{/if}
