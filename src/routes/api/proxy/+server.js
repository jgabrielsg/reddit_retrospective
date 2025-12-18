// src/routes/api/proxy/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        // O fetch aqui roda no servidor (Node.js), onde não existe CORS
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RedditWrapped/1.0'
            }
        });

        if (!response.ok) {
            return json({ error: 'Failed to fetch from Reddit' }, { status: response.status });
        }

        const data = await response.json();
        return json(data);

    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
}