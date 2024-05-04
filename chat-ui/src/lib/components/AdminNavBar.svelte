<script>
	import sessionStore from "$lib//sessionStore.js";
	// Get email of current session data
    let email;
    let role;
    let org;
	let authorized = false;
    sessionStore.subscribe(($session) => {
        email = $session.email;
        org = $session.org;
        role = $session.role;
		if(role === 'admin'){
		authorized = true;
	}
	// console.log("The role is " + role +" and the authorized is :" + authorized);
    });
	
</script>
<!-- Admin Navbar.svelte -->
<div class="nav-container">
	<!-- {#if authorized} This did not work for some reason. Hiding the menu even for admin.-->
	<div class="navbar">
		<ul>
			<li><a href="/admin/users">Users</a></li>
			<li><a href="/admin/users/add">Add User</a></li>
			<li><a href="/admin/groups">Groups</a></li>
		</ul>
	</div>
	<!-- {/if} -->
</div>

<style>
	.nav-container {
		margin: 10px;
		width:100%;
		display: flex;
		flex-direction: column; /* Stack elements vertically */
	}

	.navbar {
		margin:10px;
		overflow: hidden;
		background-color: #38444d;
		width: 98%;	
	}

	ul {
		list-style-type: none;
		margin: 0;
		padding: 0;
	}

	li {
		float: left;
	}

	li a {
		display: inline-block;
		color: white;
		text-align: center;
		padding: 10px 16px;
		text-decoration: none;
		cursor: pointer;
	}

	li a:hover {
		background-color: rgba(191, 255, 0, 0.559);
	}
</style>
