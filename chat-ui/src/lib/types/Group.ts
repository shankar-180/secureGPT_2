import type { ObjectId } from "mongodb";
import type { Timestamps } from "./Timestamps";

export interface User extends Timestamps {
	_id: ObjectId;
	group?: string;
	description: string;
	org?: string;
	created_by: string;
	created_date: Date;
    updated_date:Date;
    status: string;
}
