<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';

	interface Props {
		content?: string;
		onUpdate?: (content: string) => void;
	}

	let { content = '', onUpdate }: Props = $props();

	let editorContainer: HTMLDivElement;
	let editor: Editor | null = $state(null);

	// Expose methods for parent component
	export function getEditor() {
		return editor;
	}

	export function getContent() {
		return editor?.getHTML() || '';
	}

	export function clearContent() {
		editor?.commands.clearContent();
		editor?.commands.setContent('<p>Start writing your post...</p>');
	}

	onMount(() => {
		editor = new Editor({
			extensions: [StarterKit],
			content: content || '<p>Start writing your post...</p>',
			editorProps: {
				attributes: {
					class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4'
				}
			},
			onUpdate: ({ editor }) => {
				onUpdate?.(editor.getHTML());
			}
		});

		if (editorContainer) {
			editorContainer.appendChild(editor.view.dom);
		}
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});
</script>

<div bind:this={editorContainer}></div>

<style>
	:global(.ProseMirror) {
		outline: none;
	}

	:global(.ProseMirror p.is-editor-empty:first-child::before) {
		color: #adb5bd;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
</style>
