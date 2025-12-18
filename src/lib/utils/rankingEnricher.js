const subCache = {};
const pending = new Set();
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let queue = Promise.resolve();

export async function enrichSubreddits(subNames, onUpdate) {
    const uniqueSubs = [...new Set(subNames)].filter(sub => {
        if (subCache[sub]) {
            onUpdate({ [sub]: subCache[sub] });
            return false;
        }
        if (pending.has(sub)) return false;
        return true;
    });

    if (uniqueSubs.length === 0) return;

    uniqueSubs.forEach(sub => {
        pending.add(sub);
        
        queue = queue.then(async () => {
            try {
                // Delay aleatório para parecer humano
                await wait(800 + Math.random() * 500);

                const targetUrl = `https://www.reddit.com/r/${sub}/about.json`;
                
                // MUDANÇA AQUI: Usamos corsproxy.io em vez do nosso /api/proxy
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

                const response = await fetch(proxyUrl);
                
                if (response.ok) {
                    const json = await response.json();
                    const data = json.data;

                    let icon = data.icon_img;
                    if (!icon || icon === "") icon = data.community_icon;
                    if (icon) icon = icon.split('?')[0];

                    const enrichedData = {
                        icon: icon,
                        title: data.title || sub,
                        subscribers: data.subscribers,
                        color: data.primary_color
                    };

                    subCache[sub] = enrichedData;
                    onUpdate({ [sub]: enrichedData });
                } else if (response.status === 429 || response.status === 403) {
                    console.warn(`Bloqueio temporário no r/${sub}. Pausando...`);
                    await wait(5000); 
                }

            } catch (error) {
                console.warn(`Erro ao baixar r/${sub}`, error);
                subCache[sub] = { icon: null };
                onUpdate({ [sub]: subCache[sub] });
            } finally {
                pending.delete(sub);
            }
        });
    });
}