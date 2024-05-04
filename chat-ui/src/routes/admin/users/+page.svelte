<!-- src/routes/index.svelte -->
<script>
	import { goto } from "$app/navigation";
	import AdminNavBar from "$lib/components/AdminNavBar.svelte";
	import axios from "axios";
	export let data;

	let message = "";
	let visible = false;

	async function handleEdit(userId) {
		goto("/admin/users/" + userId.hfUserId);
	}

	async function handlePasswordReset(email, name) {
		const decision = window.confirm("Are you sure you want to reset " + name.name + "'s password?");
		if (decision) {
			const response = await axios.post("/admin/users/password", email, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response) {
				if ("data" in response && "status" in response.data) {
					message = response.data.message + " (code: " + response.data.status + ")";
				} else {
					message = "Some exception occurred while sending password reset link to user's email.";
				}
			} else {
				message = "Some exception occurred while sending password reset link to user's email.";
			}
		} else {
			message = "You've canceled the password reset.";
		}
		showAlert(message);
	}

	function showAlert(messageText) {
		message = messageText;
		visible = true;
		setTimeout(hideAlert, 5000);
	}

	function hideAlert() {
		visible = false;
	}
</script>

<main>
	<!-- Include the Navbar component at the top of your page -->
	<AdminNavBar />

	<div class="table-container">
		<table>
			<thead>
				<td>Id</td>
				<td>Name</td>
				<td>Email</td>
				<td>Org</td>
				<td>Group</td>
				<td>Role</td>
				<td>Password</td>
				<td>Edit</td>
			</thead>
			<tbody>
				{#each data.users as { email, role, username, name, hfUserId, org, group }}
					<tr>
						<td class="truncate-text">{hfUserId}</td>
						<td class="truncate-text">{name}</td>
						<td class="truncate-text">{email}</td>
						<td class="truncate-text">{org}</td>
						<td class="truncate-text">{group}</td>
						<td class="truncate-text">{role}</td>
						<td
							><a
								href="javascript:void(0);"
								on:click={() => handlePasswordReset({ email }, { name })}>Reset Password</a
							></td
						>
						<td><a href="javascript:void(0);" on:click={() => handleEdit({ hfUserId })}>Edit</a></td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if visible}
		<div class="alert">
			<p>{message}</p>
		</div>
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
		color:#fff;
	}
	td {
		padding: 8px;
		font-size: 11px;
		border: 1px solid lightslategray;
	}

	/* tr:nth-child(even) {
		background-color: rgb(223, 225, 226);
	}
	tr:nth-child(odd) {
		background-color: rgb(252, 252, 252);
	} */
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

	.alert {
		position: fixed;
		bottom: 0; /* Display the alert at the bottom of the page */
		left: 0;
		right: 0;
		background-color: #3b7656; /* Set your desired background color */
		color: #fff; /* Set your desired text color */
		padding: 16px;
	}
</style>
