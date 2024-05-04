import sessionStore from "$lib//sessionStore.js";
import { collections } from "$lib/server/database";
import { error } from "@sveltejs/kit";

export async function load() {
	// Get session data
	let email;
	sessionStore.subscribe(($session) => {
		 email = $session.email; // Access the email from the session store
	});

    const user = await collections.users.findOne({email:email});
    let org = null;
    let role = null;
    let group = null;
    if (user) {
        org = user.org;
        role = user.role;
        group = user.group;
    } else {
        throw error(401, "Unauthorized");
    }
    //Get only those records that are in the user's org and active.
	let results =  null;
    if(role === 'admin'){
        results = collections.users.find({org: org});
    } else {
        results = collections.users.find({org: org, email: email});
    }
    
    const resultsArray = await results.toArray();

    let userList = []
    for(let i=0; i< resultsArray.length; i++){
        let row = resultsArray[i];
        delete row._id; 
        userList.push(row); 
    }
	
	return  {users: userList} ;
}


