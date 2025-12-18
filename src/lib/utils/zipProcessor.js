import JSZip from 'jszip';
import Papa from 'papaparse';
import { redditStore, isLoading } from '$lib/stores/dataStore.js';

const TARGET_FILES = ['posts.csv', 'comments.csv', 'post_votes.csv', 'comment_votes.csv'];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchStatsFromJson(permalink, isComment) {
    let url = permalink.trim();
    if (url.endsWith("/")) {
        url = url.slice(0, -1);
    }
    url = `${url}.json`;

    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;

    for (let i = 0; i < 3; i++) {
        try {
            // Delay um pouco maior para comentários pois são muitos
            await wait(300 + Math.random() * 500);

            const response = await fetch(proxyUrl);

            if (response.ok) {
                const data = await response.json();

                if (isComment) {
                    // Lógica para Comentários: data[1] é a lista de comentários, children[0] é o comentário alvo
                    try {
                        const commentData = data[1].data.children[0].data;
                        return { ups: commentData.ups || 0, comments: 0 };
                    } catch (e) { return { ups: 0, comments: 0 }; }
                } else {
                    // Lógica para Posts
                    try {
                        const postData = data[0].data.children[0].data;
                        return { 
                            ups: postData.ups || 0, 
                            comments: postData.num_comments || 0 
                        };
                    } catch (e) { return { ups: 0, comments: 0 }; }
                }
            } else if (response.status === 429) {
                console.warn("Rate Limit! Esperando 10s...");
                await wait(10000);
            }
        } catch (error) {
            console.error(`Erro ao buscar ${url}:`, error);
            await wait(1000);
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

    // 2. Processar COMENTÁRIOS (Novo)
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
    console.log("✅ Enriquecimento completo.");
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

                if (key) processedData[key] = parsed.data;
            }
        }

        if (processedData.posts.length === 0 && processedData.comments.length === 0) {
            alert("ZIP inválido. Verifique seus arquivos.");
            isLoading.set(false);
            return;
        }

        redditStore.set({
            posts: processedData.posts.map(p => ({...p, ups: 0, enriched: false})),
            comments: processedData.comments.map(c => ({...c, ups: 0, enriched: false})), // Init Comments
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