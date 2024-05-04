import sessionStore from "$lib//sessionStore.js";
import { smallModel } from "$lib/server/models";
import { modelEndpoint } from "./modelEndpoint";
import { trimSuffix } from "$lib/utils/trimSuffix";
import { trimPrefix } from "$lib/utils/trimPrefix";
import { PUBLIC_SEP_TOKEN } from "$lib/constants/publicSepToken";
import { AwsClient } from "aws4fetch";
import { collections } from "$lib/server/database";

//Grab the email from session
let email;
let contextMode;
let customPrompt;
let modelName;
sessionStore.subscribe(($session) => {
	 email = $session.email; // Access the email from the session store
	 contextMode = $session.contextMode;
	 customPrompt = $session.customPrompt;
	 modelName = $session.modelName;
});
let org;
let group;
let role;
let orgrole;
if(email){
	const user = await collections.users.findOne({email: email});
	if(user){
		group = user.group;
		org = user.org;
		role=user.role;
		orgrole = org+"__"+group;
	} else{
		console.warn("Warning: the user does not exist in the database.");
		//throw error(401, "Unauthorized");
	}
} else {
	console.warn("Warning: the user email are not in the session. Most likely the user is not logged in.");
	//throw error(401, "Unauthorized");
}


interface Parameters {
	temperature: number;
	truncate: number;
	max_new_tokens: number;
	stop: string[];
}
export async function generateFromDefaultEndpoint(
	prompt: string,
	parameters?: Partial<Parameters>
): Promise<string> {
	const newParameters = {
		...smallModel.parameters,
		...parameters,
		return_full_text: false,
		wait_for_model: true,
	};

	const randomEndpoint = modelEndpoint(smallModel);

	const abortController = new AbortController();

	let resp: Response;

	if (randomEndpoint.host === "sagemaker") {
		const requestParams = JSON.stringify({
			parameters: newParameters,
			inputs: prompt,
			org: orgrole,
			customPrompt: customPrompt,
			modelName: modelName,
			contextMode: contextMode
		});

		const aws = new AwsClient({
			accessKeyId: randomEndpoint.accessKey,
			secretAccessKey: randomEndpoint.secretKey,
			sessionToken: randomEndpoint.sessionToken,
			service: "sagemaker",
		});

		resp = await aws.fetch(randomEndpoint.url, {
			method: "POST",
			body: requestParams,
			signal: abortController.signal,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} else {
		const promptMap = {
			parameters: newParameters,
			org: orgrole,
			customPrompt: customPrompt,
			modelName: modelName,
			contextMode: contextMode,
			inputs: prompt
			
		}
		resp = await fetch(randomEndpoint.url, {
			headers: {
				"Content-Type": "application/json",
				Authorization: randomEndpoint.authorization,
			},
			method: "POST",
			body: JSON.stringify(promptMap),
			signal: abortController.signal,
		});
	}

	if (!resp.ok) {
		throw new Error(await resp.text());
	}

	if (!resp.body) {
		throw new Error("Body is empty");
	}

	const decoder = new TextDecoder();
	const reader = resp.body.getReader();

	let isDone = false;
	let result = "";

	while (!isDone) {
		const { done, value } = await reader.read();

		isDone = done;
		result += decoder.decode(value, { stream: true }); // Convert current chunk to text
	}

	// Close the reader when done
	reader.releaseLock();

	let results;
	if (result.startsWith("data:")) {
		results = [JSON.parse(result.split("data:")?.pop() ?? "")];
	} else {
		results = JSON.parse(result);
	}

	let generated_text = trimSuffix(
		trimPrefix(trimPrefix(results[0].generated_text, "<|startoftext|>"), prompt),
		PUBLIC_SEP_TOKEN
	).trimEnd();

	for (const stop of [...(newParameters?.stop ?? []), "<|endoftext|>"]) {
		if (generated_text.endsWith(stop)) {
			generated_text = generated_text.slice(0, -stop.length).trimEnd();
		}
	}

	return generated_text;
}
