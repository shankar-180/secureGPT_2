import sessionStore from "$lib//sessionStore.js";
import { json } from '@sveltejs/kit';
import { writable } from "svelte/store";
import { collections } from "$lib/server/database";
import { ObjectId } from "mongodb";

export async function GET({ request, cookies }) {
    try {
        let contextMode = "single_doc";
        sessionStore.subscribe(($session) => {
            contextMode = $session.contextMode;
          });
          return json({"code":200, "contextMode": contextMode});
    } catch (e) {
        return json({"code":200, "contextMode": "single_doc"});
    }
}