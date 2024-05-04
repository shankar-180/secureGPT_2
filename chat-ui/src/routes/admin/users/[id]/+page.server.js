import sessionStore from "$lib//sessionStore.js";
import { collections } from "$lib/server/database";
import { error } from "@sveltejs/kit";

export async function load({ params }) {
    
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
	const results = await collections.users.findOne({hfUserId: params.id}); 
    delete results._id;

    //Get only those records that are in the user's org and active.
	let gresults =  null;
    if(role === "admin"){
        gresults = collections.group.find({status: "active", org: org});
    } else {
        gresults = collections.group.find({status: "active", org: org, group: group});
    }
    
    const resultsArray = await gresults.toArray();

    let groupList = []
    for(let i=0; i< resultsArray.length; i++){
        let row = resultsArray[i];
        delete row._id; 
        groupList.push(row);
    }

    let roleList = null;
    if(role === "admin"){
        roleList =  [{"name":"admin", "description":"Admin"}, {"name":"user", "description":"Group User"}];
    } else {
        roleList = [{"name":"user", "description":"Group User"}];
    }


    return {users:results, groups: groupList, roles:roleList};
    
}


