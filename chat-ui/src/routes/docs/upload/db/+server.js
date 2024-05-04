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
        deleteLocalDoc(doc_name);
        deleteServerDoc(doc_name);
        
    }
    catch (error) {
        console.log(error);
    }
    return json({});
}