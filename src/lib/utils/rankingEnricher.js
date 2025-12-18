const subCache = {};
// Cache para saber o que já está na fila ou sendo baixado (evita duplicar requisição)
const pending = new Set();

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fila de processamento (Promise chain)
let queue = Promise.resolve();

export async function enrichSubreddits(subNames, onUpdate) {
    // 1. Filtra apenas o que não temos e o que não estamos baixando agora
    const uniqueSubs = [...new Set(subNames)].filter(sub => {
        // Se já temos no cache, devolvemos imediatamente para atualizar a UI
        if (subCache[sub]) {
            onUpdate({ [sub]: subCache[sub] });
            return false;
        }
        // Se já está pendente/baixando, ignoramos
        if (pending.has(sub)) {
            return false;
        }
        return true;
    });

    if (uniqueSubs.length === 0) return;

    // 2. Adiciona à fila de execução serial
    uniqueSubs.forEach(sub => {
        pending.add(sub); // Marca como pendente
        
        // Encadeia na promessa anterior (Fila Serial)
        queue = queue.then(async () => {
            try {
                await wait(800 + Math.random() * 400);

                const targetUrl = `https://www.reddit.com/r/${sub}/about.json`;
                // Usando encodeURIComponent para garantir que caracteres especiais não quebrem
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;

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
                } else if (response.status === 429) {
                    console.warn(`Rate Limit atingido no r/${sub}. Pausando...`);
                    // Se der rate limit, espera 5 segundos antes de continuar a fila
                    await wait(5000);
                    // Remove do pending para tentar de novo no futuro (opcional)
                    pending.delete(sub); 
                }

            } catch (error) {
                console.warn(`Erro ao baixar r/${sub}`, error);
                // Salva vazio para não travar
                subCache[sub] = { icon: null };
                onUpdate({ [sub]: subCache[sub] });
            } finally {
                // Remove do set de pendentes quando terminar
                pending.delete(sub);
            }
        });
    });
}