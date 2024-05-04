<script>
	import sessionStore from "$lib//sessionStore.js";
	import CarbonInformation from "~icons/carbon/information";
	import AssistantModal from "./AssistantModal.svelte";
	import axios from "axios";
	import { onMount } from "svelte";
	import IconPencil from "./icons/IconPencil.svelte";

	let message = "";
	let contextMode;

	async function setContextMode() {
		const response = await axios.get("/settings/userSettings/contextMode");
		contextMode = response.data.contextMode;
	}

	onMount(setContextMode);

	async function handleChange(event) {
		const newContextMode = event.target.value;
		try {
			const response = await axios.post(
				"/settings/userSettings",
				{ contextMode: newContextMode },
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
			message = response.data.message;
		} catch (error) {
			console.error("Error fetching data:", error);
		}
	}
	async function handlePrompt() {
		const modal = new AssistantModal({
			target: document.body,
		});
	}
</script>

&nbsp;
<div
	class="flex h-8 cursor-pointer select-none items-center gap-2 rounded-lg border bg-white p-1.5 shadow-sm hover:shadow-none dark:border-gray-800 dark:bg-gray-900"
>
	<div class="whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">Context Mode</div>
	<div class="group relative w-max">
		<CarbonInformation class="text-xs text-gray-500" />
		<div
			class="pointer-events-none absolute -top-40 left-1/2 w-max -translate-x-1/2 rounded-md bg-gray-100 p-2 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-800"
		>
			<p class="max-w-sm text-sm text-gray-800 dark:text-gray-200">
				Single Doc: The top matching document will be considered to generate the answer.<br />
				Multi Doc: Multiple documents will be considered to generate the answer. <br />
				Similar Docs: Given a doc, similar docs are searched, summarized and compared.
			</p>
		</div>
	</div>
	<select
		class="transparent-dropdown"
		name="context_mode"
		bind:value={contextMode}
		on:change={handleChange}
	>
		<option value="single_doc">Single Doc</option>
		<option value="multi_docs">Multi Docs</option>
		<option value="similar_docs">Similar Docs</option>
	</select>
</div>

&nbsp;
<div
	class="flex h-8 cursor-pointer select-none items-center gap-2 rounded-lg border bg-white p-1.5 shadow-sm hover:shadow-none dark:border-gray-800 dark:bg-gray-900"
>
	<div class="whitespace-nowrap text-sm text-gray-800 dark:text-gray-200"><a href="#" on:click={handlePrompt}>Assistants</a></div>
	<div class="group relative w-max" on:click={handlePrompt}>
		<IconPencil />
	</div>
</div>

<style>
	.transparent-dropdown {
		background-color: transparent;
	}
</style>
