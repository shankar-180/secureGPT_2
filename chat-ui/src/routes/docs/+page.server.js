import sessionStore from "$lib//sessionStore.js";
import { collections } from "$lib/server/database";
import { EMBEDDING_FETCH_API, AUTH_TOKEN } from "$env/static/private";
import axios from "axios";

export async function load() {
    // Get session data
    let email;
    sessionStore.subscribe(($session) => {
        email = $session.email; 
    });

    const user = await collections.users.findOne({ email: email });
    let org = null;
    let role = null;
    let group = null;
    if (user) {
        org = user.org;
        role = user.role;
        group = user.group;
    }

    let results = null;
    if (role == 'admin') {
        results = collections.document.find({ status: "active", org: org }).sort({ upload_date: -1 });
    } else {
        results = collections.document.find({ status: "active", org: org, group: group }).sort({ upload_date: -1 });
    }
    //Get only those records that are in the user's org and active.

    const resultsArray = await results.toArray();

    let docList = []
    for (let i = 0; i < resultsArray.length; i++) {
        let row = resultsArray[i];
        delete row._id;
        docList.push(row);
    }
    downloadAndUpdateDB(org, group);
    return { transaction: docList };
}

async function downloadAndUpdateDB(org, group) {
    try {
        const response = await axios.post(EMBEDDING_FETCH_API, {
                org: org + "__" + group,
            }, {headers:{"Authorization": AUTH_TOKEN}},    
        );
        if (response && response.status == 200) {
            if (response.data && response.data.all_files) {
                const docs = response.data.all_files;
                await updateDB(org, group, docs);
            }
        }
    } catch (e) {
        console.log(e);
        console.log("Error occured.");
    }
}

async function updateDB(org, group, docs){
    try{

        const bulkOps = docs.map(({ source, summary }) => ({
            updateOne: {
              filter: { doc_name: source, state: 'processing', org: org, group: group, status: 'active' }, // Match by 'doc' and 'state' is 'processing'
              update: { $set: { doc_name: source, summary: summary, state: 'processed', status:"active" } }, // Update or insert with the new values
              upsert: false, // Create a new document if not found
            },
          }));
          const result =  await collections.document.bulkWrite(bulkOps);
    } catch(e){
        console.log(e);
    }
}
