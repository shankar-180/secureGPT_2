import sessionStore from "$lib//sessionStore.js";
import { update } from "$lib//oAuth.js";
import { json } from '@sveltejs/kit';
import { EMBEDDING_API } from "$env/static/private";
import { collections } from "$lib/server/database";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from 'uuid';
import { string } from "zod";


export async function POST({ request, cookies }) {
    let userData = await request.json();
    //userDetail.app_metadata = { 'roles': [userDetail.role], 'org': org };
    let userUpdateData = {}
    userUpdateData.app_metadata = {'roles':[userData.role], 'groups':[userData.group], 'org':  userData.org}
    // userUpdateData.user_metadata = {'name':"Shamshad Ansari"};

    const updated = await update(userUpdateData, userData.hfUserId);
    if(updated){
        if('status' in updated && updated.status !=200){
            return json({'status': updated.status, 'message':'Failed to send password reset link. Please confirm that the user\'s email is correct or/and try again later.'});
        } else {
            await updateDB(userData);
            return json(updated);
        }
    } else {
        return json({'status': 502, 'message':'An unknown exception occurred. Failed to send password reset link. Please confirm that the user\'s email is correct or/and try again later.'});
    }
    
}

async function updateDB(user) {
    //name, group, role, status
    const result = await collections.users.updateOne({hfUserId:user.hfUserId},{$set :{name: user.name, group :user.group, role: user.role, sessionId:null}});
    return result;
}