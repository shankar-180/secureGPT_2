import sessionStore from "$lib//sessionStore.js";
import { json } from '@sveltejs/kit';
import { EMBEDDING_API, AUTH_TOKEN, DOC_STORAGE_DIR, MAX_UPLOAD_SIZE_BYTES } from "$env/static/private";
import axios from "axios";
import { collections } from "$lib/server/database";
import { writeFileSync, mkdirSync, existsSync, createReadStream } from 'fs';
import extract from 'extract-zip';
import yauzl from 'yauzl';
import mammoth from 'mammoth';
import puppeteer from "puppeteer";
import cheerio from "cheerio";
import fs from 'fs';

export async function POST({ request, cookies }) {
    try {
        const jsonData = await request.json();
        const doc_name = jsonData.doc_name;
        console.log("doc_name: "+ doc_name);
        //await deleteLocalDoc(doc_name);
        await deleteServerDoc(doc_name);
        
        return json({ message: "Doc deleted sucessfully"});
    }
    catch (error) {
        console.log("error in deletion process", error);
    }
    return json({error: "An errror occured dring deletion"}, { status: 500 });
}

async function deleteServerDoc(doc_name) {
    try {
        const AUTH_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoic2Fuc2FyaSIsImV4cCI6MTc5NjMxMDQ0NH0.FgFpk64W54Uoai0mEv8rZdQtOgaBC7j_pa2Bd7VLJjE";
        const response = await axios.delete('https://6xz1owomvn04h0-80.proxy.runpod.net/delete_file', {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`, 
                'Content-Type': 'application/json'
            },
            data: {
                doc_name: doc_name
            }
        });
        console.log(response.data); // Log the response data
    } catch (error) {
        console.error("Error deleting document from external API:", error);
    }
}