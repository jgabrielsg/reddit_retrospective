// src/lib/utils/statsCalculator.js

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Helper para extrair o subreddit de um permalink
 * Ex: https://www.reddit.com/r/futebol/comments/... -> 'futebol'
 */
function extractSubreddit(permalink) {
    if (!permalink) return 'Desconhecido';
    const match = permalink.match(/\/r\/([^/]+)\//);
    return match ? match[1] : 'Desconhecido';
}

/**
 * Agrupa itens por mês.
 * Funciona para Posts, Comentários e Votos (se tiverem data).
 * @param {Array} itemsList - Arrays de itens (pode passar vários arrays, ex: posts e comments)
 * @returns {Array} - [{ label: 'Jan', value: 10 }, ...]
 */
export function getMonthlyData(...itemsLists) {
    const counts = new Array(12).fill(0);

    // Itera sobre todos os argumentos (listas) passados
    itemsLists.forEach(items => {
        if (!items) return;
        
        items.forEach(item => {
            // Verifica se tem data (votos geralmente não têm no CSV bruto)
            if (!item.date) return;
            
            const dateObj = new Date(item.date);
            const monthIndex = dateObj.getMonth();
            
            if (!isNaN(monthIndex)) {
                counts[monthIndex]++;
            }
        });
    });

    return counts.map((count, index) => ({
        label: MONTHS[index],
        value: count
    }));
}

/**
 * Agrupa itens por Comunidade (Subreddit).
 * Extrai do campo 'subreddit' OU do 'permalink'.
 * @param {Array} itemsList - Arrays de itens combinados
 * @param {number} minCount - Agrupa em "Outros" se for menor que isso
 */
export function getSubredditData(itemsLists, minCount = 3) {
    const map = {};

    // Flatten nos arrays recebidos (caso passe [posts, comments])
    const allItems = itemsLists.flat();

    allItems.forEach(item => {
        // Pega do campo direto OU tenta extrair da URL
        let sub = item.subreddit;
        
        if (!sub && item.permalink) {
            sub = extractSubreddit(item.permalink);
        }
        
        if (!sub) sub = 'Desconhecido';

        // Filtro opcional: Se for voto, só conta se for 'up'
        if (item.direction && item.direction !== 'up') return;

        map[sub] = (map[sub] || 0) + 1;
    });

    const finalData = [];
    let othersCount = 0;

    Object.entries(map).forEach(([sub, count]) => {
        if (count < minCount) {
            othersCount += count;
        } else {
            finalData.push({ label: sub, value: count });
        }
    });

    finalData.sort((a, b) => b.value - a.value);

    if (othersCount > 0) {
        finalData.push({ label: 'Outros', value: othersCount });
    }

    return finalData;
}