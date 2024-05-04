import sessionStore from "$lib//sessionStore.js";
import { json } from '@sveltejs/kit';
import { writable } from "svelte/store";
import { collections } from "$lib/server/database";
import { ObjectId } from "mongodb";

export async function POST({ request, cookies }) {
    try {
        const jsonData = await request.json();
        let response = null;
        if (jsonData != null && jsonData.hasOwnProperty("assistantId") && jsonData.hasOwnProperty("edit") && jsonData.edit == true) {
            response = await updateAssistant(jsonData);
        } else if (jsonData != null && jsonData.hasOwnProperty("assistantId") && jsonData.hasOwnProperty("enable") && jsonData.enable == true) {
            response = await enableAssistant(jsonData);
        } else if (jsonData != null && jsonData.hasOwnProperty("assistantId") && jsonData.hasOwnProperty("delete") && jsonData.delete == true) {
            response = await deleteAssistant(jsonData);
        } else {
            response = await addAssistant(jsonData);
        }

        return json(response);
    } catch (e) {
        return json({ "code": 500, "message": "failed to create assistant." });
    }
}

async function addAssistant(assistant) {
    try {

        const user = await getUser();
        let assist = {};
        assist.email = user.email;
        assist.org = user.org;
        assist.group = user.group;
        assist.author = assistant.author;
        assist.prompt = assistant.prompt;
        assist.assistantName = assistant.assistantName;
        assist.assistantDescription = assistant.description;
        assist.modelName = assistant.modelName;
        assist.sharedWithPublic = assistant.publicShared;
        assist.sharedWithOrg = assistant.orgShared;
        assist.sharedWithGroup = assistant.groupShared;
        assist.enabled = false;
        assist.status = "active";
        assist.createdAt = new Date();
        assist.updatedAt = new Date();
        const records = await collections.assistants.insertOne(assist);
        if (records != null && records.hasOwnProperty("insertedId")) {
            return { "code": 200, "message": "success" };
        } else {
            return { "code": 500, "message": "failed to create assistant." };
        }
    } catch (e) {
        console.log(e);
        return { "code": 500, "message": "failed to create assistant." };
    }
}

async function updateAssistant(assistant) {

    try {
        const assistantId = assistant.assistantId;
        const user = getUser();
        let assist = {};
        assist.author = assistant.author;
        assist.prompt = assistant.prompt;
        assist.assistantName = assistant.assistantName;
        assist.assistantDescription = assistant.description;
        assist.modelName = assistant.modelName;
        assist.sharedWithPublic = assistant.publicShared;
        assist.sharedWithOrg = assistant.orgShared;
        assist.sharedWithGroup = assistant.groupShared;
        assist.status = "active";
        assist.updatedAt = new Date();
        delete assistant.assistantId;
        const records = await collections.assistants.updateOne({ "_id": new ObjectId(assistantId) }, { $set: assist });
        if (records != null && records.hasOwnProperty("modifiedCount") && records.modifiedCount > 0) {
            console.log("Number of records updated:" + records.modifiedCount);
            return { "code": 200, "message": "success with number of records updated " + records.modifiedCount };
        } else {
            return { "code": 200, "message": "No record was updated." };
        }
    } catch (e) {
        console.log(e);
        return { "code": 500, "message": "failed to update assistant." };
    }
}

async function getUser() {
    let userMap = {}
    let email;
    let org;
    let group;
    sessionStore.subscribe(($session) => {
        email = $session.email;
    })

    const user = await collections.users.findOne({ "email": email });
    if (user) {
        org = user.org;
        group = user.group;
    }
    userMap.email = email;
    userMap.org = org;
    userMap.group = group;
    return userMap;
}

async function enableAssistant(assistant) {
    try {
        const user = await getUser();
        //update all assistants of this user-org-group to mark then enabled = false.
        const records = await collections.assistants.updateMany({ "email": user.email, "org": user.org, "group": user.group }, { $set: { "enabled": false } });
        console.log("Number of records updated:" + records.modifiedCount);
        //update one assistant to mark it enabled = true
        const enabledRecords = await collections.assistants.updateOne({ "_id": new ObjectId(assistant.assistantId) }, { $set: { "enabled": true } });
        if (enabledRecords != null && enabledRecords.hasOwnProperty("modifiedCount") && enabledRecords.modifiedCount > 0) {
            console.log("Number of records updated:" + enabledRecords.modifiedCount);
            await updateSession(assistant.assistantId);
            return { "code": 200, "message": "success with number of records updated " + enabledRecords.modifiedCount };
        } else {
            return { "code": 200, "message": "No record was updated." };
        }
    } catch (e) {
        console.log(e);
        return { "code": 500, "message": "failed to enable assistant." };
    }
}

async function deleteAssistant(assistant) {
    try {
        const user = await getUser();
        //update all assistants of this user-org-group to mark then enabled = false.
        
        const deletedRecords = await collections.assistants.updateOne({ "_id": new ObjectId(assistant.assistantId) }, { $set: { "status": "inactive" } });
        if (deletedRecords != null && deletedRecords.hasOwnProperty("modifiedCount") && deletedRecords.modifiedCount > 0) {
            console.log("Number of records deleted:" + deletedRecords.modifiedCount);
            return { "code": 200, "message": "success with number of records deleted " + deletedRecords.modifiedCount };
        } else {
            return { "code": 200, "message": "No record was deleted." };
        }
    } catch (e) {
        console.log(e);
        return { "code": 500, "message": "failed to delete assistant." };
    }
}

async function updateSession(assistantId) {
    const assistant =  await collections.assistants.findOne({ "_id": new ObjectId(assistantId)});
    sessionStore.update((session) => {
        session.customPrompt = assistant.prompt;
        session.modelName = assistant.modelName;
        return session;
    });
}