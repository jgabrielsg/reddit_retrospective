<script>
  import { onMount, tick } from 'svelte';
  import { redditStore, isLoading } from '$lib/stores/dataStore.js';
  import { handleZipUpload } from '$lib/utils/zipProcessor.js';
  import { getMonthlyData, getSubredditData } from '$lib/utils/statsCalculator.js';
  
  // Import dos Gráficos
  import BarYear from '$lib/components/charts/BarYear.svelte';
  import PieChart from '$lib/components/charts/PieChart.svelte';

  let bestPost = null;
  let bestComment = null;
  
  // Variáveis para os gráficos
  let activityMonthly = [];
  let activitySubreddits = [];
  let upvotesSubreddits = [];

  // Lógica Reativa Principal
  $: if ($redditStore) {
    // 1. Calcular Melhor Post e Comentário
    if ($redditStore.posts) {
        const sortedPosts = [...$redditStore.posts].sort((a, b) => (b.ups || 0) - (a.ups || 0));
        if (sortedPosts.length > 0) bestPost = sortedPosts[0];
    }

    if ($redditStore.comments) {
        const sortedComments = [...$redditStore.comments].sort((a, b) => (b.ups || 0) - (a.ups || 0));
        if (sortedComments.length > 0) bestComment = sortedComments[0];
    }

    // 2. Preparar Dados para os Gráficos
    // Gráfico de Atividade (Barras): Posts + Comentários criados
    activityMonthly = getMonthlyData($redditStore.posts, $redditStore.comments);
    
    // Gráfico de Pizza 1: Onde você cria conteúdo
    activitySubreddits = getSubredditData([$redditStore.posts, $redditStore.comments], 3);

    // Gráfico de Pizza 2: Onde você dá Upvote (Consumo)
    upvotesSubreddits = getSubredditData([$redditStore.post_votes, $redditStore.comment_votes], 5);

    // 3. Ativar Animações após renderizar
    triggerAnimations();
  }

  // Função para lidar com o upload
  function onFileSelected(e) {
    if (e.target.files.length > 0) {
        handleZipUpload(e.target.files[0]);
    }
  }

  // Função para configurar o IntersectionObserver (Animação de Scroll)
  async function triggerAnimations() {
    await tick(); // Espera o Svelte atualizar o DOM com os novos dados
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Anima apenas uma vez
            }
        });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.animate-on-scroll');
    hiddenElements.forEach((el) => observer.observe(el));
  }
  
  // Ativa animação também na Hero Section inicial
  onMount(() => {
    triggerAnimations();
  });
</script>

<main>
  {#if !$redditStore && !$isLoading}
    <section class="hero animate-on-scroll">
        <div class="hero-content">
            <h1>Reddit Wrapped <span class="year">2025</span></h1>
            <p class="hero-subtitle">
                Your digital footprint, visualized. Rediscover your arguments, 
                your laughs, and the communities that defined your year.
            </p>
            <p class="hero-note">🔒 Private & Client-side only. Your data never leaves this browser.</p>
        </div>
    </section>

    <div class="upload-container animate-on-scroll">
        <div class="upload-box">
            <div class="upload-icon">📂</div>
            <h3>Import Data</h3>
            <p>Drag & Drop your <strong>export.zip</strong> file here</p>
            <input type="file" accept=".zip" on:change={onFileSelected} />
            <button class="fake-btn">Select File</button>
        </div>
    </div>
  {/if}

  {#if $isLoading}
    <div class="loading-container">
        <div class="spinner"></div>
        <p class="loading-text">Traveling back in time...</p>
        <small>Fetching your karma points & analyzing patterns</small>
    </div>

  {:else if $redditStore}
    
    <div class="dashboard container">
        
        <header class="dashboard-header animate-on-scroll">
            <h1>Your 2025 in Review</h1>
            <p>What a year to be online.</p>
        </header>

        <div class="stats-grid animate-on-scroll">
            <div class="stat-box">
                <h3>Total Interactions</h3>
                <p class="stats-num">{$redditStore.post_votes.length + $redditStore.comment_votes.length}</p>
                <div class="sub-stats">
                    <span>⬆️ You Upvoted</span>
                </div>
            </div>

            <div class="stat-box">
                <h3>Content Created</h3>
                <p class="stats-num">{$redditStore.posts.length + $redditStore.comments.length}</p>
                <div class="sub-stats">
                    <span>📝 Posts & 💬 Comments</span>
                </div>
            </div>

            <div class="stat-box">
                <h3>Estimated Karma</h3>
                <p class="stats-num highlight">
                    {($redditStore.posts.reduce((acc, p) => acc + (p.ups||0), 0) + 
                      $redditStore.comments.reduce((acc, c) => acc + (c.ups||0), 0)).toLocaleString()}
                </p>
                <div class="sub-stats">
                    <small>From fetched history</small>
                </div>
            </div>
        </div>

        <hr class="divider animate-on-scroll"/>

        <section class="highlights-section">
            <h2 class="section-title animate-on-scroll">🏆 Hall of Fame</h2>
            
            {#if bestPost}
                <div class="best-card post-card animate-on-scroll">
                    <div class="badge post-badge">TOP POST</div>
                    <div class="content-wrapper">
                        <div class="info-side">
                            <h2 class="title">
                                <a href={`https://www.reddit.com${bestPost.permalink}`} target="_blank">{bestPost.title}</a>
                            </h2>
                            <div class="meta">
                                <span class="subreddit">r/{bestPost.subreddit}</span> • 
                                <span class="date">{bestPost.date ? new Date(bestPost.date).toLocaleDateString() : ''}</span>
                            </div>
                            {#if bestPost.body}
                                <div class="body-text">
                                    {bestPost.body.slice(0, 150)}{bestPost.body.length > 150 ? '...' : ''}
                                </div>
                            {/if}
                            <div class="stats-bar">
                                <div class="stat upvotes"><span class="icon">⬆️</span> {bestPost.ups || 0}</div>
                                <div class="stat comments"><span class="icon">💬</span> {bestPost.num_comments || bestPost.fetched_comments || 0}</div>
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
                        <div class="loading-bar">🔄 Updating vote count...</div>
                    {/if}
                </div>
            {/if}

            {#if bestComment}
                <div class="best-card comment-card animate-on-scroll">
                    <div class="badge comment-badge">TOP COMMENT</div>
                    <div class="content-wrapper">
                        <div class="info-side full-width">
                            <div class="meta">
                                <span class="subreddit">r/{bestComment.subreddit}</span> • 
                                <span class="date">{bestComment.date ? new Date(bestComment.date).toLocaleDateString() : ''}</span>
                            </div>
                            <div class="comment-body-large">"{bestComment.body}"</div>
                            <div class="stats-bar">
                                <div class="stat upvotes"><span class="icon">⬆️</span> {bestComment.ups || 0} upvotes</div>
                                <div class="stat-link">
                                    <a href={`https://www.reddit.com${bestComment.permalink}`} target="_blank">View Context ↗</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    {#if !bestComment.enriched}
                        <div class="loading-bar">🔄 Checking score...</div>
                    {/if}
                </div>
            {/if}
        </section>

        <section class="fun-section animate-on-scroll">
            <div class="fun-text-side">
                <h2>The Tribes You Belong To</h2>
                <p>These are the places where you spent your time debating, laughing, and sharing. Did you stick to your bubble or explore new lands?</p>
                <div class="fun-image-placeholder">
                    🌍
                </div>
            </div>
            <div class="fun-chart-side">
                <h3>Created Content In:</h3>
                <PieChart data={activitySubreddits} />
            </div>
        </section>

        <section class="fun-section reverse animate-on-scroll">
            <div class="fun-text-side">
                <h2>What You Actually Liked</h2>
                <p>You might not post there, but you certainly lurk there. These are the communities that earned your precious upvotes.</p>
                <div class="fun-image-placeholder orange">
                    🧡
                </div>
            </div>
            <div class="fun-chart-side">
                <h3>Upvoted Content From:</h3>
                <PieChart data={upvotesSubreddits} />
            </div>
        </section>

        <section class="activity-section animate-on-scroll">
            <h2>📅 Your Year in Activity</h2>
            <p>Consistency is key (or maybe addiction?). Here is your posting timeline.</p>
            <div class="chart-container-large">
                <BarYear data={activityMonthly} color="#0079D3" />
            </div>
        </section>

        <button class="reset-btn animate-on-scroll" on:click={() => redditStore.set(null)}>Upload another file</button>
    </div>
  {/if}
</main>

<style>
  /* --- GLOBAL & ANIMATIONS --- */
  :global(body) { 
    margin: 0; 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
    background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); 
    color: #1c1c1c; 
    min-height: 100vh;
  }

  .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }

  /* Animation Logic */
  :global(.animate-on-scroll) {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  }
  :global(.animate-on-scroll.visible) {
    opacity: 1;
    transform: translateY(0);
  }

  /* --- HERO SECTION --- */
  .hero {
    text-align: center;
    padding: 80px 20px 40px;
    background: radial-gradient(circle at center, #fff0ea 0%, transparent 70%);
  }
  .hero h1 { font-size: 3.5rem; margin-bottom: 10px; letter-spacing: -1px; color: #1a1a1b; }
  .hero .year { color: #FF4500; font-weight: 900; }
  .hero-subtitle { font-size: 1.2rem; color: #555; max-width: 600px; margin: 0 auto 20px; line-height: 1.6; }
  .hero-note { font-size: 0.85rem; color: #878a8c; background: rgba(0,0,0,0.05); display: inline-block; padding: 5px 12px; border-radius: 20px; }

  /* --- LOADING --- */
  .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; }
  .spinner { width: 50px; height: 50px; border: 5px solid #eee; border-top-color: #FF4500; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
  .loading-text { font-size: 1.5rem; font-weight: bold; color: #333; }

  /* --- DASHBOARD HEADER --- */
  .dashboard-header { text-align: center; margin-bottom: 40px; }
  .dashboard-header h1 { font-size: 2.5rem; color: #FF4500; margin-bottom: 0; }
  .dashboard-header p { font-size: 1.1rem; color: #666; margin-top: 5px; }

  /* --- STATS GRID --- */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
  .stat-box { background: white; padding: 25px; border-radius: 16px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); transition: transform 0.2s; border: 1px solid rgba(0,0,0,0.05); }
  .stat-box:hover { transform: translateY(-5px); }
  .stat-box h3 { margin: 0; font-size: 0.85rem; color: #878a8c; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
  .stats-num { font-size: 2.8rem; font-weight: 800; color: #1c1c1c; margin: 10px 0; }
  .stats-num.highlight { color: #FF4500; }
  .sub-stats { font-size: 0.9rem; color: #555; background: #f6f7f8; padding: 8px 12px; border-radius: 8px; display: inline-block; }

  .divider { border: 0; height: 1px; background: #eee; margin: 40px 0; }
  .section-title { text-align: center; font-size: 2rem; margin-bottom: 30px; color: #333; }

  /* --- CARDS (Highlights) --- */
  .best-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.08); margin-bottom: 30px; border: 1px solid #eee; position: relative; }
  .badge { text-align: center; font-weight: 800; font-size: 0.8rem; padding: 8px; letter-spacing: 2px; color: white; }
  .post-badge { background: linear-gradient(90deg, #FF4500, #ff8700); }
  .comment-badge { background: linear-gradient(90deg, #0079D3, #00aaff); }

  .content-wrapper { display: flex; flex-direction: row; }
  .info-side { padding: 25px; flex: 1; display: flex; flex-direction: column; }
  .meta { font-size: 0.85rem; color: #787C7E; margin-bottom: 12px; }
  .subreddit { font-weight: 700; color: #1c1c1c; }
  
  .title { margin: 0 0 12px 0; font-size: 1.4rem; line-height: 1.3; font-weight: 600; }
  .title a { text-decoration: none; color: inherit; }
  .title a:hover { color: #FF4500; }
  
  .image-side { width: 180px; min-width: 180px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .image-side img { width: 100%; height: 100%; object-fit: cover; }

  .comment-body-large { font-size: 1.2rem; line-height: 1.6; color: #222; background: #f8f9fa; padding: 20px; border-left: 5px solid #0079D3; margin-bottom: 15px; border-radius: 0 8px 8px 0; font-style: italic; }

  .stats-bar { display: flex; gap: 15px; margin-top: auto; }
  .stat { background: #eee; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; color: #333; display: flex; align-items: center; gap: 6px; }
  .stat-link a { color: #0079D3; font-weight: 700; text-decoration: none; }

  .loading-bar { background: #e9f5fd; color: #0079D3; text-align: center; padding: 5px; font-size: 0.8rem; font-weight: 600; }

  /* --- FUN SECTIONS (Text + Chart) --- */
  .fun-section { display: flex; align-items: center; gap: 40px; margin: 60px 0; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
  .fun-section.reverse { flex-direction: row-reverse; }
  
  .fun-text-side { flex: 1; }
  .fun-text-side h2 { font-size: 2rem; margin-bottom: 15px; color: #1c1c1c; line-height: 1.1; }
  .fun-text-side p { font-size: 1.1rem; color: #666; line-height: 1.6; margin-bottom: 25px; }
  
  .fun-image-placeholder { width: 100px; height: 100px; background: #e0f2ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
  .fun-image-placeholder.orange { background: #ffe0d6; }

  .fun-chart-side { flex: 1; display: flex; flex-direction: column; align-items: center; width: 100%; }
  .fun-chart-side h3 { margin-bottom: 20px; font-size: 0.9rem; text-transform: uppercase; color: #888; }

  /* --- ACTIVITY SECTION --- */
  .activity-section { text-align: center; margin: 60px 0; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
  .chart-container-large { margin-top: 30px; display: flex; justify-content: center; width: 100%; }

  /* --- UPLOAD BOX --- */
  .upload-container { display: flex; justify-content: center; padding: 20px; margin-top: 20px; }
  .upload-box { position: relative; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); padding: 60px; text-align: center; border: 3px dashed #cbd5e0; border-radius: 20px; transition: all 0.3s; width: 100%; max-width: 500px; }
  .upload-box:hover { border-color: #FF4500; transform: scale(1.02); }
  .upload-icon { font-size: 4rem; margin-bottom: 20px; }
  .upload-box h3 { font-size: 1.5rem; margin: 0 0 10px 0; }
  .upload-box input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .fake-btn { background: #FF4500; color: white; border: none; padding: 12px 30px; border-radius: 30px; font-weight: 700; font-size: 1rem; margin-top: 20px; pointer-events: none; }

  .reset-btn { display: block; margin: 60px auto 20px; padding: 15px 40px; background: transparent; border: 2px solid #333; border-radius: 50px; cursor: pointer; font-weight: 800; font-size: 1rem; transition: all 0.2s; }
  .reset-btn:hover { background: #333; color: white; }

  @media (max-width: 768px) {
    .content-wrapper, .fun-section, .fun-section.reverse { flex-direction: column; text-align: center; }
    .image-side { width: 100%; height: 200px; }
    .info-side { order: 2; }
    .fun-image-placeholder { margin: 0 auto; }
    .hero h1 { font-size: 2.5rem; }
    .fun-chart-side { width: 100%; }
  }
</style>