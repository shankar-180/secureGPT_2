<!-- CustomPromptModal.svelte -->
<script>
	import { createEventDispatcher } from "svelte";
	import { onMount } from "svelte";
	import { writable } from "svelte/store";

	import axios from "axios";

	const dispatch = createEventDispatcher();

	let maxHeight = window.innerHeight * 0.75 - 40; // Subtracting padding and margin
	let maxHeightStyle = `max-height: ${maxHeight}px;`;

	let data = [];
	let status = "";
	const models = writable([]);
	async function fetchModelList() {
		const response = await axios.get("/settings/models/list");
		models.set(response.data);
	}
	// Function to fetch data from the server
	async function fetchData() {
		const response = await axios.get("/settings/assistants/list");
		data = response.data;
	}
	async function enableAssistant(assistantId) {
		let temp = [];
		data.forEach((item) => {
			if (item._id == assistantId) {
				item.enabled = true;
			} else {
				item.enabled = false;
			}
			temp.push(item);
		});
		data = temp;
		try {
			const response = await axios.post(
				"/settings/assistants",
				{
					enable: true,
					assistantId: assistantId,
				},
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);
		} catch (ext) {
			console.log("Some exception occured in enabling the assistant: " + ext);
		}
	}

	async function deleteAssistant(assistantId, assistName) {
		const confirmed = window.confirm("Are you sure you want to delete the assistant " + assistName);
		if (confirmed) {
			try {
				const response = await axios.post(
					"/settings/assistants",
					{
						delete: true,
						assistantId: assistantId,
					},
					{
						headers: {
							"Content-Type": "application/json",
						},
					}
				);
				if (response.data.code == 200) {
					status = "Assistant deleted successfully.";
					handleClose();
				} else {
					status = "Error in deleting assistant.";
				}
			} catch (ext) {
				console.log("Some exception occured in deleting the assistant: " + ext);
			}
		}
	}

	// Call fetchData when the component is mounted
	onMount(async() => {
		fetchData();
		fetchModelList();
	});

	function handleClose() {
		document.body.removeChild(document.querySelector(".modal-container"));
	}

	let assistantId = null;
	let prompt = "";
	let assistantName = "";
	let description = "";
	let publicShared = false;
	let orgShared = false;
	let groupShared = false;
	let author = "";
	let llm = "Llama 2 13B";

	let edit = false;
	async function handleSubmit() {
		try {
			const response = await axios.post(
				"/settings/assistants",
				{
					prompt: prompt,
					author: author,
					assistantName: assistantName,
					description: description,
					publicShared: publicShared,
					orgShared: orgShared,
					groupShared: groupShared,
					modelName: llm,
					assistantId: assistantId,
					edit: edit,
				},
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (response != null && response.data.hasOwnProperty("code") && response.data.code == 200) {
				status = response.data.message;
				document.body.removeChild(document.querySelector(".modal-container"));
			} else {
				status = "Error in creating assistant due to " + response.data.message + ".";
			}
		} catch (error) {
			status = "Error occurred while creating assistant. Reason: " + error;
			console.error("Error occurred while making POST request:" + error);
		}
	}

	async function displayAssistant(assist) {
		assistantId = assist._id;
		prompt = assist.prompt;
		assistantName = assist.assistantName;
		description = assist.assistantDescription;
		author = assist.author;
		llm = assist.modelName;
		orgShared = assist.sharedWithOrg;
		groupShared = assist.sharedWithGroup;
		publicShared = assist.sharedWithPublic;
		edit = true;
	}
</script>

<div class="modal-container">
	<div class="modal">
		<div class="header">
			Personal Assistants <div class="alert">{status}</div>
			<span class="close-icon" on:click={handleClose}>&times;</span>
		</div>
		<div class="content-container">
			<div class="item-list" style={maxHeightStyle}>
				<ul>
					{#if data.length > 0}
						<div class="small-fonts">Click assistant name to see details.</div>
						{#each data as item, index (item._id)}
							<li class="row">
								<div class="column1">
									<a href="#" on:click={() => displayAssistant(item)}>
										{item.assistantName}<br />
										<span class="small-fonts">{item.assistantDescription}</span>
									</a>
								</div>
								<div class="column2">
									<button
										class={item.enabled ? "button-enabled" : "button-disabled"}
										on:click={() => enableAssistant(item._id)}
									>
										{item.enabled ? "Enabled" : "Enable"}
									</button>
									<button
										class="button-delete"
										on:click={() => deleteAssistant(item._id, item.assistantName)}>Delete</button
									>
								</div>
							</li>
						{/each}
					{:else}
						<p>No assistant available.</p>
					{/if}
				</ul>
			</div>
			<div class="form-container" style={maxHeightStyle}>
				<div>Create New Assistant</div>
				<input type="hidden" id="textfield" bind:value={assistantId} />
				<label for="textfield">Name (your assistant name)</label>
				<input type="text" id="textfield" bind:value={assistantName} />
				<br />
				<label for="textfield">Description</label>
				<input type="text" id="textfield" bind:value={description} />
				<br />
				<label for="selectfield">Model (LLM)</label>
				<!-- <select id="selectfield" class="dropdown" bind:value={llm}>
					<option value="Llama 2 13B">Llama 2 13B</option>
					<option value="Llama 2 70B">Llama 2 70B</option>
				</select> -->
				<select id="selectfield" class="dropdown" bind:value={llm}>
					<!-- Bind each option to the dynamic options store -->
					{#each $models as model}
					  <option value={model.name}>{model.display_name}</option>
					{/each}
				  </select>
				<br />
				<label for="checkbox1"
					><input type="checkbox" id="checkbox1" bind:checked={publicShared} /> Share with public</label
				><br />
				<label for="checkbox2"
					><input type="checkbox" id="checkbox2" bind:checked={orgShared} /> Share with your org</label
				><br />
				<label for="checkbox3"
					><input type="checkbox" id="checkbox3" bind:checked={groupShared} /> Share with your group</label
				><br />
				<br />
				<label for="textfield2">Author (your display name)</label>
				<input type="text" id="textfield2" bind:value={author} />
			</div>
			<div class="form-container" style={maxHeightStyle}>
				<label for="textarea">Instructions (prompts)</label>
				<textarea id="textarea" rows="15" cols="50" bind:value={prompt} />
				<br />
				<div class="submit-container">
					<button on:click={handleSubmit}>Save</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.modal-container {
		display: flex;
		justify-content: center;
		align-items: center;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 9999;
	}

	.modal {
		background-color: #fff;
		width: 80vw; /* Fixed width */
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
		max-height: 90vh; /* Maximum height set to 70% of viewport height */
		overflow-y: auto; /* Enable vertical scrolling if content exceeds max height */
	}

	.header {
		font-size: 20px;
		font-weight: normal;
		margin-bottom: 20px;
	}

	.close-icon {
		float: right;
		cursor: pointer;
	}

	.close-icon:hover {
		color: #f00;
	}

	.content-container {
		display: flex;
		justify-content: space-between;
	}

	.item-list {
		flex: 2; /* Take up remaining space */
		margin-right: 20px; /* Add spacing between the two sections */
		overflow-y: auto; /* Enable vertical scrolling */
	}

	ul {
		list-style-type: none;
		padding: 0;
	}

	.form-container {
		flex: 1; /* Take up more space */
		overflow-y: auto; /* Enable vertical scrolling */
		margin: 20px;
	}

	textarea,
	input[type="text"] {
		width: 100%;
		padding: 8px;
		margin-bottom: 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		box-sizing: border-box;
		background-color: rgb(236, 236, 236);
	}

	label {
		font-weight: normal;
	}

	button {
		background-color: #007bff;
		color: #fff;
		border: none;
		border-radius: 4px;
		padding: 10px 20px;
		cursor: pointer;
	}

	button:hover {
		background-color: #0056b3;
	}
	.submit-container {
		display: flex;
		justify-content: center;
	}
	.dropdown {
		background-color: rgb(236, 236, 236);
		margin-bottom: 10px;
		margin-top: 5px;
		height: 30px;
		width: 100%;
	}
	.alert {
		color: red;
	}

	.row {
		display: flex;
		align-items: center;
		padding: 10px;
		border-bottom: 1px solid #ccc;
	}

	/* Alternate row styling */
	.row:nth-child(even) {
		background-color: #f2f2f2; /* Light gray background for even rows */
	}

	/* Hover effect */
	.row:hover {
		background-color: #e0e0e0; /* Lighter background color on hover */
	}
	/*   
	.row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10px;
	} */
	.column1 {
		flex: 2;
		padding: 5px;
		border: 0px solid #ccc;
	}
	.column2 {
		flex: 0.1;
		padding: 5px;
		border: 0px solid #ccc;
	}
	.button-enabled {
		background-color: green;
		color: white;
		font-size: 0.6em;
		padding: 0.5em 1em;
	}
	.button-disabled {
		background-color: gray;
		color: white;
		font-size: 0.6em;
		padding: 0.5em 1em;
	}
	.button-delete {
		background-color: gray;
		color: white;
		font-size: 0.6em;
		padding: 0.5em 1em;
	}
	.small-fonts {
		color: gray;
		font-size: 0.5em;
	}
</style>
