import { json } from '@sveltejs/kit';
import { EMBEDDING_API } from "$env/static/private";
import { collections } from "$lib/server/database";

export function POST({ request, cookies }) {
    
    return json({});
}