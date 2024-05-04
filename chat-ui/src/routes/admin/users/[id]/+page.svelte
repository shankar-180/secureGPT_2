<script>
	import sessionStore from "$lib//sessionStore.js";
	import AdminNavBar from "$lib/components/AdminNavBar.svelte";
	import { goto } from "$app/navigation";
	import axios from "axios";
	// import { log } from "handlebars";
	// import { any } from "zod";
	export let data;
    

	let error = null;
	let formData = {
		hfUserId: "",
		name: "",
		email: "",
		username: "",
		password: "",
		role: "",
		status: "",
		group:"",
	};

    if(data){
		formData.hfUserId = data.users.hfUserId;
        formData.name = data.users.name;
        formData.email = data.users.email;
        formData.username = data.users.username;
        formData.role= data.users.role;
        formData.status = data.users.status;
		formData.group = data.users.group;
    }

	let email;
	let role;
	sessionStore.subscribe(($session) => {
		 email = $session.email; 
		 role = $session.role;
	});

	async function handleSubmit(){
		//call submit post api
		const response = await axios.post("/admin/users/update", formData, {
				headers: {
					"Content-Type": "application/json",
				},
		});

		goto("/admin/users");

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
				<input type="text" id="hfUserId" bind:value={formData.hfUserId} required hidden/>
				<span class="modal-header">Edit User</span>
				<label for="firstName">Full Name:</label>
				<input type="text" id="name" bind:value={formData.name} required />

				<label for="username">Email:</label>
				<input type="text" id="username" bind:value={formData.email} required readonly/>


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
</main >

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
		margin-right: 10px;
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

