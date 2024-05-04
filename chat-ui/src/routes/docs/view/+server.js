import sessionStore from "$lib//sessionStore.js";
import { DOC_STORAGE_DIR } from "$env/static/private";
import fs from 'fs';
import path from 'path';
import mime from 'mime';
import { json } from '@sveltejs/kit';


export async function POST({ request, cookies }) {
    const fileNameJson = await request.json();

    let org;
    let group;

    sessionStore.subscribe(($session) => {
        org = $session.org;
        group = $session.group;
    });

    const pdfPath = path.resolve(DOC_STORAGE_DIR + org + "/" + group, fileNameJson.fileName);
    if (fs.existsSync(pdfPath)) {
        const pdfData = fs.readFileSync(pdfPath);
        const mimeType = mime.getType(pdfPath);
        // Convert the buffer to a base64 string
        const base64Content = pdfData.toString('base64');
        return json({
            status: 200,
            documentType: mimeType,
            headers: {
                'Content-Type': 'application/json',
            },
            body: { base64Content, mimeType },
        });
    } else {
        return json({
            status: 404,
            body: { base64Content: 'Document not found' },
        });
    }
}
