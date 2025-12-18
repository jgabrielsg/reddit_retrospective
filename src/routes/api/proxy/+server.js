import { json } from '@sveltejs/kit';

export async function GET({ url }) {
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) return json({ error: 'URL required' }, { status: 400 });

    try {
        const fetchUrl = targetUrl.includes('?') ? `${targetUrl}&raw_json=1` : `${targetUrl}?raw_json=1`;

        const response = await fetch(fetchUrl, {
            headers: {
                'User-Agent': 'android:com.redditwrapped.app:v1.0.0 (by /u/reddit_fan)',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!response.ok) {
            // Se o servidor falhar, retornamos erro para que o frontend saiba
            return json({ error: 'Reddit Blocked Vercel' }, { status: response.status });
        }

        const data = await response.json();
        return json(data);

    } catch (error) {
        return json({ error: error.message }, { status: 500 });
    }
}