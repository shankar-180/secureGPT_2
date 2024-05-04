import sessionStore from "$lib//sessionStore.js";
import { json } from '@sveltejs/kit';
import { writable } from "svelte/store";
import { collections } from "$lib/server/database";
import { ObjectId } from "mongodb";

export async function POST({ request, cookies }) {
    try {
        const jsonData = await request.json();
        console.log("Called the backend with a formData::" + jsonData.contextMode);
        const id = await createOrupdateUserSettings(jsonData);
        // Return a valid Response object
        return json({ "code": 200, "message": "success: " + id });
    } catch (e) {
        return json({});
    }
}



async function createOrupdateUserSettings(userData) {
    let email;
    let org;
    let group;
    sessionStore.subscribe(($session) => {
        email = $session.email;
    })

    sessionStore.update((session) => {
        if (userData.hasOwnProperty('contextMode') && userData.contextMode !== null)
            session.contextMode = userData.contextMode;
        if (userData.hasOwnProperty('customPrompt') && userData.customPrompt !== null)
            session.customPrompt = userData.customPrompt;
        return session;
    });

    const user = await collections.users.findOne({ email: email });
    if (user) {
        org = user.org;
        group = user.group;
    }

    let userSettings = await collections.userSettings.findOne({
        email: email,
        org: org,
        group: group,
    });
    if (userSettings) {
        console.log("Found a setting..");
        userData.updatedAt =  new Date();
        const records = await collections.userSettings.updateOne({ "email": email, "org": org, "group": group }, { $set: userData });
        console.log("The updated setting is " + JSON.stringify(records));
    } else {
        console.log("Creating a new settings");
        userSettings = {};
        userSettings.email = email;
        userSettings.org = org;
        userSettings.group = group;
        userSettings.contextMode = userData.contextMode;
        userSettings.customPrompt = userData.customPrompt;
        userSettings.createdAt = new Date();
        userSettings.updatedAt = new Date();
        const records = await collections.userSettings.insertOne(userSettings);
    }
}
