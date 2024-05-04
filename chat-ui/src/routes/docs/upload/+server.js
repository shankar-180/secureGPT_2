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
import archiver from 'archiver';
import fs from 'fs';



export async function POST({ request, cookies }) {
    try {
        const formData = new FormData();
        const body = await request.formData();
        const user_email = body.get("email");
        //Get the user details using email from DB
        const existingUser = await collections.users.findOne({ email: user_email + "" });
        const fileSize = body.get("file").size;
        console.log(fileSize);
        if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
            return json({ "code": 413 });
        }

        let contextMode;
        sessionStore.subscribe(($session) => {
            contextMode = $session.contextMode;
        });

        let originalFileNames = await saveFile(body.get("file"), existingUser.org, existingUser.group, body.get("file").name, DOC_STORAGE_DIR);

        let [zippedFilePath, fileNames] = await manageFileFormat(originalFileNames, existingUser.org, existingUser.group, DOC_STORAGE_DIR);
        let fileBytes = body.get("file");

        if (zippedFilePath != null) {
            try {
                const fileContent = await fs.promises.readFile(zippedFilePath);
                // Create a Blob object directly from the file content
                const blob = new Blob([fileContent], { type: 'application/zip' }); // Set the correct MIME type
                // Create a File object from the Blob object
                fileBytes = new File([blob], fileBytes.name, { type: 'application/zip' }); // Set the correct MIME type
            } catch (error) {
                console.error("Error reading zipped file:", error);
            }
        }
        //Set in the form data so we can call the API with the right parameters.
        formData.append("email", existingUser.email);
        formData.append("userId", existingUser.hfUserId);
        formData.append("role", existingUser.role);
        formData.append("org", existingUser.org + "__" + existingUser.group);
        formData.append("file", fileBytes);
        formData.append("contextMode", contextMode);

        const response = await axios.post(EMBEDDING_API, formData, {
            timeout: 300000,
            headers: {
                "Content-Type": "multipart/form-data",
                "Authorization": AUTH_TOKEN
            },
        });

        let responseData = response.data;

        //response.data contains an array of docNames and summaries. docNames:[], summaries:[], status:['success', 'error'], message:['200', 'failure message']
        responseData["email"] = existingUser.email;
        responseData["userid"] = existingUser.hfUserId;
        responseData["role"] = existingUser.role;
        responseData["org"] = existingUser.org;
        responseData["group"] = existingUser.group;
        responseData["upload_date"] = new Date();
        responseData['fileNames'] = fileNames;
        responseData['contextMode'] = contextMode;
        await cleanup(existingUser.org, existingUser.group, body.get("file").name, DOC_STORAGE_DIR, zippedFilePath);
        return json(responseData);
    } catch (e) {
        console.log(e);
        return json({});
    }
}

async function saveFile(content, org, group, filename, dir) {
    try {
        const localFilePath = dir + org + "/" + group + "/" + filename; //path to zip file name
        if (!existsSync(dir + org + "/" + group)) {
            mkdirSync(dir + org + "/" + group, { recursive: true });
        }
        writeFileSync(localFilePath, Buffer.from(await content.arrayBuffer()));
        if (filename.toLowerCase().endsWith(".zip")) {
            await extract(localFilePath, { dir: dir + org + "/" + group });
        } else {
            return [filename];
        }
        return await getZipContents(localFilePath);
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

async function getZipContents(zipFilePath) {
    return new Promise((resolve, reject) => {
        const entryNames = [];

        yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                reject(err);
                return;
            }

            zipfile.readEntry();
            zipfile.on('entry', (entry) => {
                if (!entry.fileName.endsWith('/') && !entry.fileName.includes("__MACOSX")) {
                    entryNames.push(entry.fileName);
                }
                zipfile.readEntry();
            });

            zipfile.on('end', () => {
                resolve(entryNames);
            });

            zipfile.on('error', (zipError) => {
                reject(zipError);
            });
        });
    });
}

async function manageFileFormat(fileNameList, org, group, dir) {
    const localFilePath = dir + org + "/" + group + "/"
    let convertedFiles = [];
    let conversionCounter = 0;
    for (const fileName of fileNameList) {

        const extension = fileName.split('.').pop();
        if (extension.toLowerCase() === 'docx' || extension.toLowerCase() === 'doc') {
            try {
                const docxFilePath = localFilePath + fileName;
                const pdfFileName = fileName + ".pdf"; //keep the original .doc extension so we can visibly identify on the UI that it was converted from doc to pdf
                const pdfPath = localFilePath + pdfFileName;
                // Convert DOCX to HTML using Mammoth
                const { value: html } = await mammoth.convertToHtml({ path: docxFilePath });

                // Modify HTML to include inline styles for cell colors
                const modifiedHtml = addInlineStylesForCellColors(html);

                // Launch Puppeteer
                const browser = await puppeteer.launch({ headless: "new" });
                const page = await browser.newPage();

                // Set HTML content on the page
                await page.setContent(modifiedHtml);

                // Preserve table cell background colors
                await page.evaluate(() => {
                    const cells = document.querySelectorAll("td[style*='background-color'], th[style*='background-color']");
                    cells.forEach(cell => {
                        const bgColor = cell.style.backgroundColor;
                        if (bgColor) {
                            cell.style.backgroundColor = bgColor;
                        }
                    });
                });

                // Ensure that tables are displayed properly
                await page.addStyleTag({
                    content: `
                table {
                    border-collapse: collapse;
                    width: 100%;
                }
                th, td {
                    border: 1px solid black;
                    padding: 8px;
                    text-align: left;
                }
            `
                });
                // Set left and right margins (assuming 1 inch margins, change values as needed)
                const marginSettings = {
                    left: '0.5in',
                    right: '0.5in'
                };

                // Generate PDF
                await page.pdf({
                    path: pdfPath,
                    margin: marginSettings,
                    printBackground: true // Preserve background colors
                });

                // Close the browser
                await browser.close();
                convertedFiles.push(pdfFileName);
                conversionCounter++;
            } catch (ex) {
                console.log(ex);
                convertedFiles.push(fileName);
            }
        } else {
            convertedFiles.push(fileName);
        }
    }
    let archivedPath = null;
    if (conversionCounter > 0) {
        archivedPath = await compressFiles(localFilePath, convertedFiles, localFilePath + "" + Date.now() + ".zip")
    }
    return [archivedPath, convertedFiles];
}

async function compressFiles(dir, fileList, outputPath) {
    // Create a new ZIP archive
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip');

    // Pipe the output to the archive
    archive.pipe(output);

    // Iterate through each file in the list
    for (const file of fileList) {
        // Read the file from the local file system
        const fileContent = fs.readFileSync(dir + "" + file);

        // Append the file content to the ZIP archive
        archive.append(fileContent, { name: file });
    }

    // Finalize the ZIP archive
    await archive.finalize();
    return outputPath;
}
function addInlineStylesForCellColors(html) {
    // Load HTML into cheerio
    const $ = cheerio.load(html);

    // Select all td and th elements
    $("td, th").each((index, element) => {
        // Check if the cell has a background color
        const bgColor = $(element).attr("bgcolor");
        if (bgColor) {
            // Add inline style for background color
            $(element).css("background-color", bgColor);
            // Remove original bgcolor attribute
            $(element).removeAttr("bgcolor");
        }
    });

    // Return modified HTML
    return $.html();
}


async function cleanup(org, group, filename, dir, zippedFilePath) {
    const localFilePath = dir + org + "/" + group + "/";
    if (filename.toLowerCase().endsWith(".zip")) {
        // Deleting the file
        console.log("Deleteing.. " + localFilePath+filename )
        fs.unlink(localFilePath+filename, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }
            console.log('File deleted successfully');
        });
    }

    if(zippedFilePath !=null){
        // Deleting the file
        console.log("Deleteing.. " + zippedFilePath )
        fs.unlink(zippedFilePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }
            console.log('File deleted successfully');
        });
    }
}