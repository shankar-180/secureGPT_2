import type { ObjectId } from "mongodb";
import type { Timestamps } from "./Timestamps";

export interface User extends Timestamps {
	_id: ObjectId;

	doc_name?: string;
	summary: string;
	email?: string;
	userid: string;
	org: string;
    role:string;
    upload_date: Date;
    status: string;
}
