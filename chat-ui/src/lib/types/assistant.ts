import type { ObjectId } from "mongodb";
import type { Timestamps } from "./Timestamps";

export interface Prompts extends Timestamps {
	_id: ObjectId;
	author?: string;
    org?:string;
    group?:string;
	email?: string;
    assistantName?:string;
    assistantDescription?:string;
    modelName?:string;
	prompt?:string;
    enabled:string;
    sharedWithPublic:string;
    sharedWithOrg?:string;
    sharedWithGroup?:string;
    status:string;
}
