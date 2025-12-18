<script>
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { redditStore, isLoading, zipAdded } from '$lib/stores/dataStore.js';
  import { getMonthlyData, getSubredditData } from '$lib/utils/statsCalculator.js';
  import { enrichSubreddits } from '$lib/utils/rankingEnricher.js'; 
  
  import BarYear from '$lib/components/charts/BarYear.svelte';
  import PieChart from '$lib/components/charts/PieChart.svelte';

  let activityMonthly = [];
  let activitySubreddits = [];
  let upvotesSubreddits = [];

  let topPosts = [];
  let topComments = [];
  
  let topSubsPosts = [];    
  let topSubsComments = []; 
  let topSubsUpvotes = [];  
  let subDetails = {};

  const MEDALS = ['🥇', '🥈', '🥉'];

  const formatK = (num) => {
      if (!num) return '';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num;
  };

  $: if ($redditStore) {
    // TOP 3 POSTS
    if ($redditStore.posts) {
        topPosts = [...$redditStore.posts]
            .sort((a, b) => (b.ups || 0) - (a.ups || 0))
            .slice(0, 3);
    }

    // TOP 3 COMMENTS
    if ($redditStore.comments) {
        topComments = [...$redditStore.comments]
            .sort((a, b) => (b.ups || 0) - (a.ups || 0))
            .slice(0, 3);
    }

    // CÁLCULO DE LISTAS
    topSubsPosts = getSubredditData([$redditStore.posts], 0)
        .filter(item => item.label !== 'Outros')
        .slice(0, 5);
    
    topSubsComments = getSubredditData([$redditStore.comments], 0)
        .filter(item => item.label !== 'Outros')
        .slice(0, 5);
    
    topSubsUpvotes = getSubredditData([$redditStore.post_votes, $redditStore.comment_votes], 0)
        .filter(item => item.label !== 'Outros')
        .slice(0, 10);

    const allSubNames = [
        ...topSubsPosts.map(s => s.label),
        ...topSubsComments.map(s => s.label),
        ...topSubsUpvotes.map(s => s.label)
    ];

    enrichSubreddits(allSubNames, (newData) => {
        subDetails = { ...subDetails, ...newData };
    });

    activityMonthly = getMonthlyData($redditStore.posts, $redditStore.comments);
    activitySubreddits = getSubredditData([$redditStore.posts, $redditStore.comments], 3);
    upvotesSubreddits = getSubredditData([$redditStore.post_votes, $redditStore.comment_votes], 10);

    triggerAnimations();
  }

  function resetAll() {
    redditStore.set(null);
    zipAdded.set(false);
    isLoading.set(false);
    goto('/');
  }

  async function triggerAnimations() {
    await tick();
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
  }
</script>

<main>
  {#if !$zipAdded}
    <div class="empty-state animate-on-scroll visible">
        <section class="hero">
            <div class="hero-content">
                <h1>Oops! No Data Found.</h1>
                <p class="hero-subtitle">
                    We need your Reddit export to generate your wrapped.
                </p>
                <button class="reset-btn" on:click={() => goto('/')}>Go to Upload Page</button>
            </div>
        </section>
    </div>

  {:else if $isLoading || !$redditStore} 
    <div class="loading-container">
        <div class="spinner"></div>
        <p class="loading-text">Traveling back in time...</p>
        <small>Fetching your karma points & analyzing patterns</small>
    </div>

  {:else}
    <div class="dashboard container">
        
        <header class="dashboard-header animate-on-scroll">
            <h1>Your 2025 in Review</h1>
            <p>What a year to be online.</p>
        </header>

        <div class="stats-grid animate-on-scroll">
            <div class="stat-box">
                <h3>Total Interactions</h3>
                <p class="stats-num">{$redditStore.post_votes.length + $redditStore.comment_votes.length}</p>
                <div class="sub-stats"><span>⬆️ You Upvoted</span></div>
            </div>
            <div class="stat-box">
                <h3>Content Created</h3>
                <p class="stats-num">{$redditStore.posts.length + $redditStore.comments.length}</p>
                <div class="sub-stats"><span>📝 Posts & 💬 Comments</span></div>
            </div>
            <div class="stat-box">
                <h3>Estimated Karma</h3>
                <p class="stats-num highlight">
                    {($redditStore.posts.reduce((acc, p) => acc + (p.ups||0), 0) + 
                      $redditStore.comments.reduce((acc, c) => acc + (c.ups||0), 0)).toLocaleString()}
                </p>
                <div class="sub-stats"><small>From fetched history</small></div>
            </div>
        </div>

        <hr class="divider animate-on-scroll"/>

        <section class="rankings-section animate-on-scroll">
            <h2 class="section-title">🏆 Community Leaderboards</h2>
            
            <div class="rankings-list-container">
                
                <div class="ranking-card full-width">
                    <div class="ranking-header blue">
                        <div class="header-title">
                            <h3>Most Posted In</h3>
                            <span class="badge-count">Top 5</span>
                        </div>
                        <span class="icon-type">📝</span>
                    </div>
                    <ul class="rich-list">
                        {#each topSubsPosts as sub, i}
                            {@const details = subDetails[sub.label] || {}}
                            <li class="rich-item">
                                <span class="rank-number">#{i + 1}</span>
                                <div class="sub-icon-wrapper">
                                    {#if details.icon}
                                        <img src={details.icon} alt={sub.label} class="sub-icon" />
                                    {:else}
                                        <div class="sub-icon placeholder">{sub.label[0].toUpperCase()}</div>
                                    {/if}
                                </div>
                                <div class="sub-info">
                                    <a href={`https://reddit.com/r/${sub.label}`} target="_blank" class="sub-name">r/{sub.label}</a>
                                    {#if details.subscribers}
                                        <span class="sub-members">{formatK(details.subscribers)} members</span>
                                    {/if}
                                </div>
                                <div class="sub-stats">
                                    <span class="stat-value">{sub.value}</span>
                                    <span class="stat-label">posts</span>
                                </div>
                            </li>
                        {/each}
                    </ul>
                </div>

                <div class="ranking-card full-width">
                    <div class="ranking-header green">
                        <div class="header-title">
                            <h3>Most Commented In</h3>
                            <span class="badge-count">Top 5</span>
                        </div>
                        <span class="icon-type">💬</span>
                    </div>
                    <ul class="rich-list">
                        {#each topSubsComments as sub, i}
                            {@const details = subDetails[sub.label] || {}}
                            <li class="rich-item">
                                <span class="rank-number">#{i + 1}</span>
                                <div class="sub-icon-wrapper">
                                    {#if details.icon}
                                        <img src={details.icon} alt={sub.label} class="sub-icon" />
                                    {:else}
                                        <div class="sub-icon placeholder">{sub.label[0].toUpperCase()}</div>
                                    {/if}
                                </div>
                                <div class="sub-info">
                                    <a href={`https://reddit.com/r/${sub.label}`} target="_blank" class="sub-name">r/{sub.label}</a>
                                    {#if details.title}
                                        <span class="sub-desc">{details.title}</span>
                                    {/if}
                                </div>
                                <div class="sub-stats">
                                    <span class="stat-value">{sub.value}</span>
                                    <span class="stat-label">comments</span>
                                </div>
                            </li>
                        {/each}
                    </ul>
                </div>

                <div class="ranking-card full-width">
                    <div class="ranking-header orange">
                        <div class="header-title">
                            <h3>Most Upvoted In</h3>
                            <p>Not only 2025 if you zipped all history, no data for date of upvote</p>
                            <span class="badge-count">Top 10</span>
                        </div>
                        <span class="icon-type">⬆️</span>
                    </div>
                    <div class="dual-col-list">
                        {#each topSubsUpvotes as sub, i}
                            {@const details = subDetails[sub.label] || {}}
                            <div class="rich-item compact">
                                <span class="rank-number">#{i + 1}</span>
                                <div class="sub-icon-wrapper small">
                                    {#if details.icon}
                                        <img src={details.icon} alt={sub.label} class="sub-icon" />
                                    {:else}
                                        <div class="sub-icon placeholder">{sub.label[0].toUpperCase()}</div>
                                    {/if}
                                </div>
                                <div class="sub-info">
                                    <a href={`https://reddit.com/r/${sub.label}`} target="_blank" class="sub-name">r/{sub.label}</a>
                                </div>
                                <div class="sub-stats mini">
                                    <span class="stat-value">{sub.value}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

            </div>
        </section>

        <section class="highlights-section">
            <h2 class="section-title animate-on-scroll">🥇 Post Hall of Fame</h2>
            
            {#each topPosts as post, i}
                <div class="best-card post-card animate-on-scroll">
                    <div class="badge post-badge {i === 0 ? 'gold' : i === 1 ? 'silver' : 'bronze'}">
                        {MEDALS[i]} TOP POST #{i + 1}
                    </div>
                    
                    <div class="content-wrapper">
                        <div class="info-side">
                            <h2 class="title">
                                <a href={`${post.permalink}`} target="_blank">{post.title}</a>
                            </h2>
                            <div class="meta">
                                <span class="subreddit">r/{post.subreddit}</span> • 
                                <span class="date">{post.date ? new Date(post.date).toLocaleDateString() : ''}</span>
                            </div>
                            {#if post.body}
                                <div class="body-text">{post.body.slice(0, 150)}{post.body.length > 150 ? '...' : ''}</div>
                            {/if}
                            <div class="stats-bar">
                                <div class="stat upvotes"><span class="icon">⬆️</span> {post.ups || 0}</div>
                                <div class="stat comments"><span class="icon">💬</span> {post.num_comments || post.fetched_comments || 0}</div>
                            </div>
                        </div>
                        {#if post.url && (post.url.includes('i.redd.it') || post.url.match(/\.(jpeg|jpg|gif|png)$/))}
                            <div class="image-side">
                                <a href={`${post.permalink}`} target="_blank">
                                    <img src={post.url} alt="Post thumb" />
                                </a>
                            </div>
                        {/if}
                    </div>
                    {#if !post.enriched}
                        <div class="loading-bar">🔄 Updating vote count...</div>
                    {/if}
                </div>
            {/each}
        </section>

        <section class="highlights-section">
            <h2 class="section-title animate-on-scroll">🗣️ Comment Hall of Fame</h2>
            
            {#each topComments as comment, i}
                <div class="best-card comment-card animate-on-scroll">
                    <div class="badge comment-badge {i === 0 ? 'gold' : i === 1 ? 'silver' : 'bronze'}">
                        {MEDALS[i]} TOP COMMENT #{i + 1}
                    </div>
                    <div class="content-wrapper">
                        <div class="info-side full-width">
                            <div class="meta">
                                <span class="subreddit">r/{comment.subreddit}</span> • 
                                <span class="date">{comment.date ? new Date(comment.date).toLocaleDateString() : ''}</span>
                            </div>
                            <div class="comment-body-large">"{comment.body}"</div>
                            <div class="stats-bar">
                                <div class="stat upvotes"><span class="icon">⬆️</span> {comment.ups || 0} upvotes</div>
                                <div class="stat-link">
                                    <a href={`${comment.permalink}`} target="_blank">View Context ↗</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    {#if !comment.enriched}
                        <div class="loading-bar">🔄 Checking score...</div>
                    {/if}
                </div>
            {/each}
        </section>

        <section class="fun-section animate-on-scroll">
            <div class="fun-text-side">
                <h2>The Tribes You Belong To</h2>
                <p>These are the places where you spent your time debating, laughing, and sharing. It sums 
                    both your posts and comments on that community
                </p>
                <div class="fun-image-placeholder">🌍</div>
            </div>
            <div class="fun-chart-side">
                <h3>Created Content In:</h3>
                <PieChart data={activitySubreddits} />
            </div>
        </section>

        <section class="fun-section reverse animate-on-scroll">
            <div class="fun-text-side">
                <h2>What You Actually Liked</h2>
                <p>You might not post there, but you certainly lurk there. Upvotes reveal your true interests.</p>
                <div class="fun-image-placeholder orange">🧡</div>
            </div>
            <div class="fun-chart-side">
                <h3>Upvoted Content From:</h3>
                <PieChart data={upvotesSubreddits} />
            </div>
        </section>

        <section class="activity-section animate-on-scroll">
            <h2>📅 Your Year in Activity</h2>
            <p>All your contributions to Reddit per month... are you constant?</p>
            <div class="chart-container-large">
                <BarYear data={activityMonthly} color="#0079D3" />
            </div>
        </section>

        <button class="reset-btn animate-on-scroll" on:click={resetAll}>Upload another file</button>
    </div>
  {/if}
</main>

<style>
  :global(body) { 
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
    background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); 
    color: #1c1c1c; 
    min-height: 100vh;
    max-width: 110ch; 
    margin-inline: auto;
	padding: 1cm;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
  }

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

  .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
  .empty-state { display: flex; justify-content: center; align-items: center; height: 80vh; text-align: center; }

  /* Animation Logic */
  :global(.animate-on-scroll) { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
  :global(.animate-on-scroll.visible) { opacity: 1; transform: translateY(0); }

  /* Stats Grid & Basic Components (Igual ao anterior) */
  .dashboard-header { text-align: center; margin-bottom: 40px; }
  .dashboard-header h1 { font-size: 2.5rem; color: #FF4500; margin-bottom: 0; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
  .stat-box { background: white; padding: 25px; border-radius: 16px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
  .stats-num { font-size: 2.8rem; font-weight: 800; color: #1c1c1c; margin: 10px 0; }
  .stats-num.highlight { color: #FF4500; }
  .divider { border: 0; height: 1px; background: #eee; margin: 40px 0; }
  .section-title { text-align: center; font-size: 2rem; margin: 50px 0 30px; color: #333; }
  
  /* --- ESTILOS NOVOS PARA RANKINGS --- */
  .rankings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 25px;
  }

  .ranking-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    border: 1px solid #eee;
  }

  .ranking-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
  .ranking-header h3 { margin: 0; font-size: 1rem; color: white; }
  .ranking-header span { font-size: 0.8rem; color: rgba(255,255,255,0.9); font-weight: bold; }
  
  .ranking-header.blue { background: #0079D3; }
  .ranking-header.green { background: #24A0ED; } /* Reddit Light Blue */
  .ranking-header.orange { background: #FF4500; }

  .ranking-list { list-style: none; padding: 0; margin: 0; }
  .ranking-list li {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    border-bottom: 1px solid #f5f5f5;
    transition: background 0.2s;
  }
  .ranking-list li:last-child { border-bottom: none; }
  .ranking-list li:hover { background: #f9f9f9; }

  .rank-number { font-weight: bold; color: #ccc; width: 30px; font-size: 0.9rem; }
  .sub-link { flex: 1; text-decoration: none; color: #1c1c1c; font-weight: 600; }
  .sub-link:hover { color: #FF4500; text-decoration: underline; }
  .count { font-size: 0.85rem; color: #888; background: #eee; padding: 2px 8px; border-radius: 10px; }
  .empty { padding: 20px; text-align: center; color: #999; font-style: italic; }

  /* --- ESTILOS PARA CARDS (Top 3) --- */
  .best-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.08); margin-bottom: 30px; border: 1px solid #eee; position: relative; }
  
  /* Medal Colors for Badges */
  .badge { text-align: center; font-weight: 800; font-size: 0.8rem; padding: 8px; letter-spacing: 2px; color: white; }
  .badge.gold { background: linear-gradient(90deg, #FFD700, #FDB931); color: #8a6d0b; text-shadow: 0 1px 0 rgba(255,255,255,0.4); }
  .badge.silver { background: linear-gradient(90deg, #E0E0E0, #BDBDBD); color: #555; }
  .badge.bronze { background: linear-gradient(90deg, #CD7F32, #A0522D); color: #fff; }

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

  .activity-section { text-align: center; margin: 60px 0; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
  .chart-container-large { margin-top: 30px; display: flex; justify-content: center; width: 100%; }
  .reset-btn { display: block; margin: 60px auto 20px; padding: 15px 40px; background: transparent; border: 2px solid #333; border-radius: 50px; cursor: pointer; font-weight: 800; font-size: 1rem; transition: all 0.2s; }
  .reset-btn:hover { background: #333; color: white; }

  @media (max-width: 768px) {
    .content-wrapper { flex-direction: column-reverse; }
    .image-side { width: 100%; height: 200px; }
    .stats-grid, .rankings-grid { grid-template-columns: 1fr; }
  }

  .rankings-list-container {
    display: flex;
    flex-direction: column;
    gap: 30px; /* Espaço entre os cartões principais */
    max-width: 800px;
    margin: 0 auto;
  }

  .ranking-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    border: 1px solid #eee;
    width: 100%; 
  }

  /* Headers Coloridos */
  .ranking-header {
    padding: 15px 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
  }
  .ranking-header.blue { background: linear-gradient(90deg, #0079D3, #005595); }
  .ranking-header.green { background: linear-gradient(90deg, #24A0ED, #0077D6); }
  .ranking-header.orange { background: linear-gradient(90deg, #FF4500, #D93A00); }

  .header-title h3 { margin: 0; font-size: 1.1rem; }
  .badge-count { font-size: 0.8rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px; margin-left: 8px; }
  .icon-type { font-size: 1.5rem; opacity: 0.8; }

  /* Lista Rica */
  .rich-list { list-style: none; padding: 0; margin: 0; }
  
  .rich-item {
    display: flex;
    align-items: center;
    padding: 15px 25px;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.2s;
  }
  .rich-item:last-child { border-bottom: none; }
  .rich-item:hover { background: #f9f9f9; }

  /* Elementos da Linha */
  .rank-number { font-weight: 800; color: #ccc; font-size: 1.1rem; width: 40px; }

  .sub-icon-wrapper { width: 40px; height: 40px; margin-right: 15px; flex-shrink: 0; }
  .sub-icon { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 1px solid #eee; }
  .sub-icon.placeholder { background: #eee; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #888; }

  .sub-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .sub-name { text-decoration: none; color: #1c1c1c; font-weight: 700; font-size: 1rem; }
  .sub-name:hover { text-decoration: underline; color: #FF4500; }
  .sub-members, .sub-desc { font-size: 0.8rem; color: #888; display: block; max-width: 400px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .sub-stats { text-align: right; }
  .stat-value { display: block; font-weight: 800; font-size: 1.1rem; color: #1c1c1c; }
  .stat-label { font-size: 0.75rem; color: #888; text-transform: uppercase; }

  /* Estilo Compacto (Dual Column) para Top 10 */
  .dual-col-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .rich-item.compact {
    padding: 10px 20px;
    border-right: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
  }
  .rich-item.compact .sub-icon-wrapper { width: 30px; height: 30px; margin-right: 10px; }
  .rich-item.compact .sub-info { flex-direction: row; align-items: center; justify-content: flex-start; gap: 8px; }
  .rich-item.compact .sub-name { font-size: 0.95rem; }
  .rich-item.compact .sub-stats { min-width: 40px; }
  
  @media (max-width: 700px) {
    .dual-col-list { grid-template-columns: 1fr; } /* Vira 1 coluna no mobile */
    .rich-item.compact { border-right: none; }
  }
</style>