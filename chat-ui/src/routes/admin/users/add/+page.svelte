<!-- src/routes/index.svelte -->
<script>
	import AdminNavBar from "$lib/components/AdminNavBar.svelte";
	import { goto } from "$app/navigation";
	import axios from "axios";
	import { log } from "handlebars";
	export let data;
	let error = null;
	let formData = {
		name: "",
		email: "",
		username: "",
		password: "",
		role: "",
		status: "",
		group:"",
	};

	let code = {
		200: "success",
		400: "Either password is too week or invalid",
		401: "Unauthorized or incorrect OAuth token",
		403: "Uauthorized to perform this action. You must be an admin to perform this action.",
		409: "A user with the same email already exists",
		502: "Unknown exception",
	};
	let passwordVisible = false;

	function togglePasswordVisibility() {
		passwordVisible = !passwordVisible;
	}
	async function handleSubmit() {
		let response;
		// Call the server side of the code and pass the returned data to save to MongoDB. Never save in MongoDB directly from the UI code for security reason.
		response = await axios.post("/admin/users/add", formData, {
			headers: {
				"Content-Type": "application/json",
			},
		});

		if ("data" in response && "status" in response.data && response.data.status != 200) {
			error = code[response.data.status];
		} else {
			
			goto("/admin/users");
		}
	}

	function handleCancel(){
		goto("/admin/users");
	}

</script>

<main>
	<!-- Include the Navbar component at the top of your page -->
	<AdminNavBar />

	<div id="editModal" class="modal-container">
		<div class="modal-content">
			<form method="POST" on:submit|preventDefault={handleSubmit}>
				<span class="modal-header">Add User</span>
				<label for="firstName">Full Name:</label>
				<input type="text" id="name" bind:value={formData.name} required />

				<label for="username">Email:</label>
				<input type="text" id="username" bind:value={formData.email} required />

				<label for="password">Password:</label>
				<div class="password-container">
					<input type="password" id="password" bind:value={formData.password} required />
					<i
						class="{passwordVisible ? 'far fa-eye-slash' : 'far fa-eye'} password-toggle"
						on:click={togglePasswordVisibility}
						tabindex="0"
						role="button"
						aria-label="Toggle Password Visibility"
					/>
				</div>

				<div class="dropdown-container">
					<div class="dropdown">
						<label for="group">Group:</label>
						<select id="group" bind:value={formData.group} required>
							{#each data.groups as { group, description}}
								<option value={group}>{group}</option>
							{/each}
							
						</select>
					</div>

					<div class="dropdown">
						<label for="type">Role:</label>
						<select id="type" bind:value={formData.role} required>
							{#each data.roles as { name, description}}
								<option value={name}>{description}</option>
							{/each}
							
						</select>
					</div>
					<div class="dropdown">
						<label for="status">Status:</label>
						<select id="status" bind:value={formData.status} required>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>
				</div>
				{#if error}
					<div class="error">{error}</div>
				{/if}
				
				<button type="submit">⠀Save⠀</button>
				<button on:click={handleCancel}>Cancel</button>
			</form>
		</div>
	</div>
</main>

<style>
	/* Modal Styles */
	.modal-container {
		height: 600px;
		overflow: auto;
	}

	.modal-content {
		/* background-color: #fff; */
		width: 600px;
		height: 500px;
		margin: auto; /* Center align horizontally */
		margin-top: 20px; /* Adjust vertical alignment as needed */
		padding: 30px;
		border-radius: 0px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		text-align: center;
		font-size: 18px;
		margin-bottom: 15px;
	}

	/* Form Styles */
	label {
		display: block;
		margin-top: 5px;
		font-weight: bold;
	}

	input[type="text"],
	input[type="password"],
	select {
		width: 100%;
		padding: 8px;
		margin-top: 5px;
		border: 2px solid #ccc;
		border-radius: 4px;
	}

	.password-container {
		position: relative;
	}

	.password-toggle {
		position: absolute;
		top: 10px;
		right: 8px;
		cursor: pointer;
	}

	button {
		margin-top: 10px;
		margin-right:10px;
		background-color: #4caf50;
		color: #fff;
		border: none;
		padding: 10px 15px;
		border-radius: 4px;
		cursor: pointer;
	}

	button.edit-button {
		background-color: transparent;
		color: #000;
		padding: 0;
		border: none;
		border-radius: 0;
		cursor: pointer;
	}

	/* Style for the container of Type and Status dropdowns */
	.dropdown-container {
		display: flex;
		justify-content: space-between;
	}

	/* Style for individual dropdowns */
	.dropdown {
		width: 48%;
	}
	.error {
		margin-top:10px;
		color: red;
	}
</style>
