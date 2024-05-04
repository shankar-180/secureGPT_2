import sessionStore from "$lib//sessionStore.js";
import { password } from "$lib//oAuth.js";
import { json } from '@sveltejs/kit';
import { EMBEDDING_API } from "$env/static/private";
import { collections } from "$lib/server/database";
import { ObjectId } from "mongodb";
import { v4 as uuidv4 } from 'uuid';


export async function POST({ request, cookies }) {
    let email = await request.json();
    console.log("Password reset API called: " + email.email);
    const changed = await password(email.email);
    if(changed){
        if('status' in changed && changed.status !=200){
            return json({'status': changed.status, 'message':'Failed to send password reset link. Please confirm that the user\'s email is correct or/and try again later.'});
        } else {
            return json(changed);
        }
    } else {
        return json({'status': 502, 'message':'An unknown exception occurred. Failed to send password reset link. Please confirm that the user\'s email is correct or/and try again later.'});
    }
    
}