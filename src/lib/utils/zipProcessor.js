import JSZip from 'jszip';
import Papa from 'papaparse';
import { redditStore, isLoading } from '$lib/stores/dataStore.js';

// Definição do intervalo de tempo (Ano de 2025)
const START_DATE_2025 = new Date('2025-01-01T00:00:00');
const END_DATE_2025 = new Date('2025-12-31T23:59:59');

const TARGET_FILES = ['posts.csv', 'comments.csv', 'post_votes.csv', 'comment_votes.csv'];
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchStatsFromJson(permalink, isComment) {
    let url = permalink.trim();
    if (url.endsWith("/")) {
        url = url.slice(0, -1);
    }
    url = `${url}.json`;

    // Usando CORS Proxy público direto
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    for (let i = 0; i < 3; i++) {
        try {
            await wait(500 + Math.random() * 500);

            const response = await fetch(proxyUrl);

            if (response.ok) {
                const data = await response.json();

                if (isComment) {
                    try {
                        const commentData = data[1].data.children[0].data;
                        return { ups: commentData.ups || 0, comments: 0 };
                    } catch (e) { return { ups: 0, comments: 0 }; }
                } else {
                    try {
                        const postData = data[0].data.children[0].data;
                        return { 
                            ups: postData.ups || 0, 
                            comments: postData.num_comments || 0 
                        };
                    } catch (e) { return { ups: 0, comments: 0 }; }
                }
            } else if (response.status === 429 || response.status === 403) {
                console.warn("Rate Limit ou Bloqueio! Esperando 10s...");
                await wait(10000);
            }
        } catch (error) {
            console.error(`Erro ao buscar ${url}:`, error);
            await wait(2000);
        }
    }
    return { ups: 0, comments: 0 };
}

async function enrichData(processedData) {
    // 1. Processar POSTS
    const posts = [...processedData.posts];
    console.log(`🌐 Iniciando enriquecimento de ${posts.length} posts...`);

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        if (post.permalink) {
            const stats = await fetchStatsFromJson(post.permalink, false);
            posts[i] = { ...post, ups: stats.ups, num_comments: stats.comments, enriched: true };
            
            // Atualiza UI a cada 3 posts
            if (i % 3 === 0) {
                redditStore.update(store => ({ ...store, posts: [...posts] }));
            }
        }
    }
    // Atualização final dos posts
    redditStore.update(store => ({ ...store, posts: [...posts] }));

    // 2. Processar COMENTÁRIOS
    const comments = [...processedData.comments];
    console.log(`🌐 Iniciando enriquecimento de ${comments.length} comentários...`);

    for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        if (comment.permalink) {
            const stats = await fetchStatsFromJson(comment.permalink, true);
            comments[i] = { ...comment, ups: stats.ups, enriched: true };

            // Atualiza UI a cada 5 comentários (para não travar renderização)
            if (i % 5 === 0) {
                redditStore.update(store => ({ ...store, comments: [...comments] }));
            }
        }
    }
    // Atualização final dos comentários
    redditStore.update(store => ({ ...store, comments: [...comments] }));
    console.log("Enriquecimento completo.");
}

export async function handleZipUpload(file) {
    isLoading.set(true);
    const zip = new JSZip();
    
    const processedData = { posts: [], comments: [], post_votes: [], comment_votes: [] };

    try {
        console.log("Iniciando leitura do ZIP...");
        const contents = await zip.loadAsync(file);

        for (const fileName of Object.keys(contents.files)) {
            const cleanFileName = fileName.split('/').pop();
            const target = TARGET_FILES.find(t => cleanFileName == t);

            if (target) {
                const contentText = await contents.files[fileName].async('string');
                const parsed = Papa.parse(contentText, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true
                });

                let key = null;
                if (cleanFileName === 'post_votes.csv') key = 'post_votes';
                else if (cleanFileName === 'comment_votes.csv') key = 'comment_votes';
                else if (cleanFileName === 'posts.csv') key = 'posts';
                else if (cleanFileName === 'comments.csv') key = 'comments';

                if (key) {
                    let rawData = parsed.data;

                    if (key === 'posts' || key === 'comments') {
                        console.log(`Filtrando ${key} para 2025... Total antes: ${rawData.length}`);
                        
                        processedData[key] = rawData.filter(item => {
                            if (!item.date) return false;
                            
                            // Converte a string do CSV para Objeto Date
                            // Formato padrão Reddit: 2025-10-14 12:52:21 UTC
                            const itemDate = new Date(item.date);
                            
                            // Verifica se é válida e se é >= 01/01/2025
                            return !isNaN(itemDate) && itemDate >= START_DATE_2025 && itemDate <= END_DATE_2025;
                        });

                        console.log(`Total ${key} em 2025: ${processedData[key].length}`);
                    } else {
                        // Votos geralmente não têm data, mantemos todos
                        processedData[key] = rawData;
                    }
                }
            }
        }

        // Validação básica se sobrou algo depois do filtro
        if (processedData.posts.length === 0 && processedData.comments.length === 0) {
            // Se o usuário upou um zip antigo ou sem nada de 2025
            const confirmEmpty = confirm("Não encontramos posts ou comentários de 2025 neste arquivo. Deseja carregar mesmo assim?");
            if (!confirmEmpty) {
                isLoading.set(false);
                return;
            }
        }

        redditStore.set({
            posts: processedData.posts.map(p => ({...p, ups: 0, enriched: false})),
            comments: processedData.comments.map(c => ({...c, ups: 0, enriched: false})),
            post_votes: processedData.post_votes,
            comment_votes: processedData.comment_votes,
            user: 'Reddit User'
        });

        isLoading.set(false);
        enrichData(processedData);

    } catch (error) {
        console.error("Erro ZIP:", error);
        alert("Erro ao ler ZIP.");
        isLoading.set(false);
    }
}