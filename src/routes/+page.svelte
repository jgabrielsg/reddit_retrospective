<script>
  import { redditStore, isLoading } from '$lib/stores/dataStore.js';
  import { handleZipUpload } from '$lib/utils/zipProcessor.js';

  let bestPost = null;
  let bestComment = null;

  // Lógica Reativa para Post e Comentário
  $: if ($redditStore) {
    // 1. Achar melhor Post
    if ($redditStore.posts) {
        const sortedPosts = [...$redditStore.posts].sort((a, b) => (b.ups || 0) - (a.ups || 0));
        if (sortedPosts.length > 0) bestPost = sortedPosts[0];
    }

    // 2. Achar melhor Comentário
    if ($redditStore.comments) {
        const sortedComments = [...$redditStore.comments].sort((a, b) => (b.ups || 0) - (a.ups || 0));
        if (sortedComments.length > 0) bestComment = sortedComments[0];
    }
  }

  function onFileSelected(e) {
    if (e.target.files.length > 0) handleZipUpload(e.target.files[0]);
  }
</script>

<main class="container">
  <h1>Reddit Wrapped 2025</h1>

  {#if $isLoading}
    <div class="loading">
        <div class="spinner"></div>
        <p>Analisando seus arquivos...</p>
    </div>

  {:else if $redditStore}
    
    <div class="dashboard">

        <div class="stats-row">
            <div class="stat-box">
                <h3>Upvotes Totais (Dados)</h3>
                <p class="stats-num">{$redditStore.post_votes.length + $redditStore.comment_votes.length}</p>
                <div class="sub-stats">
                    <span>⬆️ Posts: <strong>{$redditStore.post_votes.length}</strong></span>
                    <span>⬆️ Comments: <strong>{$redditStore.comment_votes.length}</strong></span>
                </div>
            </div>

            <div class="stat-box">
                <h3>Conteúdo Criado</h3>
                <p class="stats-num">{$redditStore.posts.length + $redditStore.comments.length}</p>
                <div class="sub-stats">
                    <span>📝 Posts: <strong>{$redditStore.posts.length}</strong></span>
                    <span>💬 Comments: <strong>{$redditStore.comments.length}</strong></span>
                </div>
            </div>
        </div>
        
        <div class="stats-row">
            <div class="stat-box">
                <h3>Total Karma (Estimado)</h3>
                <p class="stats-num">
                    {($redditStore.posts.reduce((acc, p) => acc + (p.ups||0), 0) + 
                      $redditStore.comments.reduce((acc, c) => acc + (c.ups||0), 0)).toLocaleString()}
                </p>
                <div class="sub-stats">
                    <small>Soma dos upvotes recuperados até agora</small>
                </div>
            </div>

            <div class="stat-box">
                <h3>Interações</h3>
                <p class="stats-num">{$redditStore.post_votes.length + $redditStore.comment_votes.length}</p>
                <div class="sub-stats">
                    <span>⬆️ Votos dados</span>
                </div>
            </div>
        </div>

        {#if bestPost}
            <div class="best-card post-card">
                <div class="badge post-badge">🏆 SEU MAIOR POST</div>
                
                <div class="content-wrapper">
                    <div class="info-side">
                        <h2 class="title">
                            <a href={`https://www.reddit.com${bestPost.permalink}`} target="_blank">
                                {bestPost.title}
                            </a>
                        </h2>
                        
                        <div class="meta">
                            <span class="subreddit">r/{bestPost.subreddit}</span>
                            <span>•</span>
                            <span class="date">{bestPost.date ? new Date(bestPost.date).toLocaleDateString() : ''}</span>
                        </div>

                        {#if bestPost.body}
                             <div class="body-text">
                                {bestPost.body.slice(0, 150)}{bestPost.body.length > 150 ? '...' : ''}
                            </div>
                        {/if}

                        <div class="stats-bar">
                            <div class="stat upvotes">
                                <span class="icon">⬆️</span> {bestPost.ups || 0}
                            </div>
                            <div class="stat comments">
                                <span class="icon">💬</span> {bestPost.num_comments || bestPost.fetched_comments || 0}
                            </div>
                        </div>
                    </div>

                    {#if bestPost.url && (bestPost.url.includes('i.redd.it') || bestPost.url.match(/\.(jpeg|jpg|gif|png)$/))}
                        <div class="image-side">
                            <a href={`https://www.reddit.com${bestPost.permalink}`} target="_blank">
                                <img src={bestPost.url} alt="Post thumb" />
                            </a>
                        </div>
                    {/if}
                </div>
                
                {#if !bestPost.enriched}
                    <div class="loading-bar">🔄 Atualizando Post...</div>
                {/if}
            </div>
        {/if}

        {#if bestComment}
            <div class="best-card comment-card">
                <div class="badge comment-badge">💬 SEU MELHOR COMENTÁRIO</div>
                
                <div class="content-wrapper">
                    <div class="info-side full-width">
                        
                        <div class="meta">
                            <span class="subreddit">r/{bestComment.subreddit}</span>
                            <span>•</span>
                            <span class="date">{bestComment.date ? new Date(bestComment.date).toLocaleDateString() : 'Data desconhecida'}</span>
                        </div>

                        <div class="comment-body-large">
                            "{bestComment.body}"
                        </div>
                        
                        <div class="stats-bar">
                            <div class="stat upvotes">
                                <span class="icon">⬆️</span> {bestComment.ups || 0} upvotes
                            </div>
                            <div class="stat-link">
                                <a href={`https://www.reddit.com${bestComment.permalink}`} target="_blank">Ver contexto ↗</a>
                            </div>
                        </div>
                    </div>
                </div>

                {#if !bestComment.enriched}
                    <div class="loading-bar">🔄 Verificando seus comentários...</div>
                {/if}
            </div>
        {/if}

        <button class="reset-btn" on:click={() => redditStore.set(null)}>Carregar outro arquivo</button>
    </div>

  {:else}
    <div class="upload-container">
        <div class="upload-box">
            <p>Arraste seu <strong>export.zip</strong> aqui</p>
            <input type="file" accept=".zip" on:change={onFileSelected} />
        </div>
    </div>
  {/if}
</main>

<style>
  :global(body) { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #DAE0E6; color: #1c1c1c; }
  .container { max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { text-align: center; color: #FF4500; }

  /* Stats Row */
  .stats-row { display: flex; gap: 15px; margin-bottom: 25px; }
  .stat-box { flex: 1; background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .stats-num { font-size: 2rem; font-weight: bold; color: #FF4500; margin: 5px 0; }
  .sub-stats { font-size: 0.8rem; color: #777; }

  /* General Card Style */
  .best-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 25px; border: 1px solid #ccc; position: relative; }
  
  .content-wrapper { display: flex; flex-direction: row; }
  
  .badge { text-align: center; font-weight: bold; font-size: 0.75rem; padding: 6px; letter-spacing: 1.5px; text-transform: uppercase; color: white; }
  .post-badge { background: #FF4500; }
  .comment-badge { background: #0079D3; } /* Azul Reddit para comentários */

  .info-side { padding: 20px; flex: 1; display: flex; flex-direction: column; }
  .full-width { width: 100%; }

  .meta { font-size: 0.8rem; color: #787C7E; margin-bottom: 10px; display: flex; gap: 5px; align-items: center; }
  .subreddit { font-weight: bold; color: #1c1c1c; }

  /* Estilos Específicos de Post */
  .title { margin: 0 0 10px 0; font-size: 1.2rem; line-height: 1.4; }
  .title a { text-decoration: none; color: black; }
  .title a:hover { text-decoration: underline; }
  
  .image-side { width: 150px; min-width: 150px; background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .image-side img { width: 100%; height: 100%; object-fit: cover; }

  /* Estilos Específicos de Comentário */
  .comment-body-large {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #1A1A1B;
    background: #f8f9fa;
    padding: 15px;
    border-left: 4px solid #0079D3;
    margin-bottom: 15px;
    border-radius: 0 4px 4px 0;
    font-style: italic;
  }

  .stats-bar { display: flex; gap: 15px; align-items: center; margin-top: auto; }
  .stat { background: #F6F7F8; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; color: #555; display: flex; align-items: center; gap: 6px; }
  .stat-link a { color: #0079D3; text-decoration: none; font-size: 0.9rem; font-weight: bold; }
  .stat-link a:hover { text-decoration: underline; }

  .loading-bar { font-size: 0.75rem; text-align: center; background: #e9f5fd; color: #0079D3; padding: 4px; }
  .reset-btn { display: block; margin: 30px auto; padding: 12px 24px; background: transparent; border: 1px solid #555; border-radius: 20px; cursor: pointer; font-weight: bold; }

  /* Upload Box */
  .upload-box { background: white; padding: 50px; text-align: center; border: 2px dashed #ccc; border-radius: 10px; cursor: pointer; margin-top: 50px; }
  
  @media (max-width: 600px) {
    .content-wrapper { flex-direction: column-reverse; }
    .image-side { width: 100%; height: 180px; }
  }
</style>