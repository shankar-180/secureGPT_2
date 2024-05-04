import sessionStore from "$lib//sessionStore.js";
import { json } from '@sveltejs/kit';
import { writable } from "svelte/store";
import { collections } from "$lib/server/database";
import { ObjectId } from "mongodb";
import { Exception } from "handlebars";

export async function GET({ request, cookies }) {
    try {
        
        const response = await getAssistant();
        // Return a valid Response object
        return json(response);
    } catch (e) {
        return json({"code": 500, "message": "failed to retrieve assistants."});
    }
}

async function getAssistant() {
    try {
        let email;
        let org;
        let group;
        sessionStore.subscribe(($session) => {
            email = $session.email;
        })

        const user = await collections.users.findOne({ email: email });
        if (user) {
            org = user.org;
            group = user.group;
        }       
        const records = await collections.assistants.find({"email": email, "org":org, "group":group, "status":"active"}).toArray();
        if(records !=null){
            return records;
        } else{
            throw new Error("Unable to fetch assistants.");
        }
        
    } catch (e) {
        console.log(e);
        return {"code": 500, "message": "failed to create assistant."};
    }
}
