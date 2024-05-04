<!-- src/routes/index.svelte -->
<script>
	import { goto } from "$app/navigation";
	import AdminNavBar from "$lib/components/AdminNavBar.svelte";
	import axios from "axios";
	import { log } from "handlebars";
	export let data;
	let error = null;
	let code = {
		200: "success",
		400: "Duplicate group name",
		401: "Unauthorized or incorrect OAuth token",
		409: "Duplicate group name",
		502: "Unknown exception",
	};

	let rows = []; // Array to store table rows
	let newRow = {}; // Object to store the form data for a new row

	function addRow() {
		rows = [...rows, newRow]; // Add the new row to the array
		newRow = {}; // Reset the newRow object for the next row
	}
	async function saveGroup(row) {
		if(!checkSpecialCharacters(row.group)){
            error = "No space or special characters allowed. The group name must contain alphanumeric or underscore characters only. ";
            return null;
        } 
		let response;
		// Call the server side of the code and pass the returned data to save to MongoDB. Never save in MongoDB directly from the UI code for security reason.
		response = await axios.post("/admin/groups/add", row, {
			headers: {
				"Content-Type": "application/json",
			},
		});

		if ("data" in response && "code" in response.data && response.data.code != 200) {
			error = code[response.data.code];
		} else {
			error = null;
			window.location.reload();
		}
	}
	function checkSpecialCharacters(input_val) {
        const regex = /^[a-zA-Z0-9_]+$/;
        return regex.test(input_val);
	}
</script>

<main>
	<!-- Include the Navbar component at the top of your page -->
	<AdminNavBar />
	<button on:click={addRow}>Add Group</button>
	<table>
		<thead>
			<tr>
				<th>Group</th>
				<th>Description</th>
				<th>Created On</th>
				<!-- <th>Delete</th> -->
			</tr>
		</thead>
		<tbody>
			{#each data.groups as { group, description, created_date }}
				<tr>
					<td class="truncate-text">{group}</td>
					<td class="truncate-text">{description}</td>
					<td>{new Date(created_date).toLocaleDateString("en-US")}</td>
					<!-- <td>Delete</td> -->
				</tr>
			{/each}
			{#each rows as row, index (row.id)}
				<tr>
					<td><input type="text" bind:value={row.group} /></td>
					<td><input type="text" bind:value={row.description} /></td>
                    
					<td>
						<button on:click={() => saveGroup(row)}>Save</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if error}
		<div class="error">{error}</div>
	{/if}
</main>

<style>
	table {
		margin: 10px;
		border-collapse: collapse;
		width: 98%;
	}

	thead {
		text-align: left;
		background-color: #78716c;
		color: #fff;
	}
	td {
		padding: 8px;
		font-size: 11px;
		border: 1px solid lightslategray;
	}
	.truncate-text {
		white-space: nowrap; /* Prevent text from wrapping */
		overflow: hidden; /* Hide overflowing text */
		text-overflow: ellipsis; /* Display an ellipsis for truncated text */
		max-width: 150px; /* Adjust max-width as needed to fit your table cell */
	}
	.truncate-text:hover {
		white-space: normal; /* Allow text to wrap on hover */
		overflow: visible; /* Show the full content on hover */
		text-overflow: inherit; /* Inherit text-overflow on hover */
		max-width: none; /* Remove the max-width on hover to show full text */
	}
	.table-container {
		margin: 10px;
		display: flex;
		width: 100%;
		flex-direction: column; /* Stack elements vertically */
		max-height: 500px; /* Adjust the maximum height as needed */
		overflow-y: auto;
	}
	input[type="text"],
	select {
		width: 100%;
		padding: 8px;
		margin-top: 5px;
		border: 2px solid #ccc;
		border-radius: 4px;
	}
	button {
		margin: 10px;
		margin-right: 10px;
		background-color: #4caf50;
		color: #fff;
		border: none;
		padding: 10px 15px;
		border-radius: 4px;
		cursor: pointer;
	}

	.error {
		margin: 10px;
		color: red;
	}
</style>
