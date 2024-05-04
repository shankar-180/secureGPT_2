import sessionStore from "$lib//sessionStore.js";
import { collections } from "$lib/server/database";

export async function load() {
	// Get session data
	let email;
    let org = null;
    let role = null;
	sessionStore.subscribe(($session) => {
		 email = $session.email; // Access the email from the session store
	});

    const user = await collections.users.findOne({email:email});
    
    if (user) {
        org = user.org;
        role = user.role;
    }
    //Get only those records that are in the user's org and active.
	const results =  collections.group.find({status: "active", org: org});
    const resultsArray = await results.toArray();

    let groupList = []
    for(let i=0; i< resultsArray.length; i++){
        let row = resultsArray[i];
        delete row._id; 
        groupList.push(row);
    }
    let roleList = [{"name":"admin", "description":"Admin"}, {"name":"user", "description":"Group User"}];

	return  {groups: groupList, roles: roleList} ;
}


