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
    //Get current user's organization
    const currentUser = await collections.users.findOne({ email: email });

    if (currentUser) {
        org = currentUser.org;
    }

    if(role !== "admin"){
        return json({"status": 403, "message": "Unauthorized to add the user. Only and admin can add users."});
    }

    let userDetail = await request.json();
    const name = userDetail.name;
    userDetail.app_metadata = { 'roles': [userDetail.role], 'groups': [userDetail.group], 'org': org };
    userDetail.connection = 'Username-Password-Authentication';
    delete userDetail['username'];
    delete userDetail['name'];
    delete userDetail['role'];
    delete userDetail['group'];
    delete userDetail['status'];

    const registrationData = await registerOAuth(userDetail);
    await addUserToDB(name, registrationData);
    return json(registrationData);
}

async function registerOAuth(userDetail) {
    const registrationData = await register(userDetail);
    return registrationData;
}

async function addUserToDB(name, registrationData) {
    const uuid = uuidv4();
    if (registrationData) {
        let userData = {}
        if ('email' in registrationData && 'user_id' in registrationData && 'app_metadata' in registrationData) {
            userData.createdAt = registrationData.created_at;
            userData.updatedAt = registrationData.updated_at;
            userData.username = registrationData.email;
            userData.name = name;
            userData.email = registrationData.email;
            userData.avatarUrl = registrationData.picture;
            userData.hfUserId = registrationData.user_id;
            userData.org = registrationData.app_metadata.org;
            userData.role = registrationData.app_metadata.roles[0];
            userData.group = registrationData.app_metadata.groups[0];
            // userData.sessionId = uuid;
            const insertedId = await collections.users.insertOne(userData);
        } else {
            console.log("Necessary data not available");
        }
    }
}