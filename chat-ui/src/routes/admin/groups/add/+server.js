import sessionStore from "$lib//sessionStore.js";
import { register } from "$lib//oAuth.js";
import { json } from '@sveltejs/kit';
import { EMBEDDING_API } from "$env/static/private";
import { collections } from "$lib/server/database";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from 'uuid';

export async function POST({ request, cookies }) {

    // Get email of current session data
    let email;
    let role;
    let org;
    sessionStore.subscribe(($session) => {
        email = $session.email;
        org = $session.org;
        role = $session.role;
    });

    let insertedId;
    let groupDetail = await request.json();
    const group = groupDetail.group;
    const existingGroup = await collections.group.findOne({"org":org, "group":group});
    if(existingGroup && "group" in existingGroup && existingGroup.group == group){
        return json({"code": 409, "message":"Group name for this org exists"});
    } else {
        groupDetail.org = org;
        groupDetail.created_by = email;
        groupDetail.created_date = new Date();
        groupDetail.updated_date = new Date();
        groupDetail.status = "active";
        //save the group
        insertedId = await collections.group.insertOne(groupDetail);
    }
    if(insertedId){
        return json({"code": 200, "message": "success"});
    }
    //if this is reaching here, that means some unknown happened.
    return json({"code": 502, "message": "Unknown exception"});
    
}