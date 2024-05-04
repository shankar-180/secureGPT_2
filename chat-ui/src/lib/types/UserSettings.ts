import type { ObjectId } from "mongodb";
import type { Timestamps } from "./Timestamps";

export interface UserSettings extends Timestamps {
	_id: ObjectId;
	username?: string;
    org?:string;
    group?:string;
	email?: string;
	contextMode?:string;
    answerLength?:string;
    prompt?:string;
}
