<script>
  import { goto } from '$app/navigation';
</script>

<main>
  <div class="container animate-up">
    
    <header class="header">
      <h1>How to get your Data</h1>
      <p class="subtitle">
        To generate your wrapped, we need your Reddit history. 
        Don't worry, it's easy, free, and takes about 5 minutes.
      </p>
    </header>

    <div class="timeline">
      
      <div class="step-item">
        <div class="step-marker">1</div>
        <div class="step-content">
          <h2>Request your Data</h2>
          <p>
            Go to <a href="https://www.reddit.com/settings/data-request" target="_blank" rel="noopener noreferrer">reddit.com/settings/data-request</a>.
          </p>
          
          <div class="instruction-block">
            <p><strong>A. Type of Request:</strong> Select <span class="highlight">General Data Protection Regulation (GDPR)</span>. <br><small>This package includes your posts, comments, votes, and preferences.</small></p>
            
            <p><strong>B. Date Range:</strong> You can select "I want data from my full time at Reddit". <br><small>Our app will automatically filter and show only your 2025 stats.</small></p>
          </div>

          <div class="image-wrapper">
            <img src="/howto.png" alt="Reddit Data Request Settings showing GDPR selection" />
          </div>
        </div>
      </div>

      <div class="step-item">
        <div class="step-marker">2</div>
        <div class="step-content">
          <h2>Wait for the Owl</h2>
          <p>
            It usually takes <strong>3 to 5 minutes</strong>. You will receive a private message from the bot 
            <span class="bot-name">u/RedditDataRequests</span> in your Reddit inbox.
          </p>
          
          <div class="image-wrapper">
            <img src="/notification.png" alt="Notification from RedditDataRequests in inbox" />
          </div>
        </div>
      </div>

      <div class="step-item">
        <div class="step-marker">3</div>
        <div class="step-content">
          <h2>Download the Zip</h2>
          <p>
            Open the message and click the <strong class="link-text">Download here</strong> link. 
            This will save a <code>.zip</code> file to your computer (e.g., <em>export_user_20250101.zip</em>).
          </p>

          <div class="image-wrapper">
            <img src="/downloadhere.png" alt="Download link inside the reddit message" />
          </div>
        </div>
      </div>

      <div class="step-item">
        <div class="step-marker">4</div>
        <div class="step-content">
          <h2>Upload & Enjoy</h2>
          <p>
            Come back to our Home page and drag that <code>.zip</code> file into the box. 
            We will process it locally in your browser and generate your charts instantly!
          </p>
        </div>
      </div>

    </div>

    <div class="cta-footer">
      <button class="primary-btn" on:click={() => goto('/')}>I have the zip, let's go!</button>
    </div>

  </div>
</main>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
  }

  /* Animation Entry */
  .animate-up {
    animation: fadeInUp 0.8s ease-out forwards;
    opacity: 0;
    transform: translateY(20px);
  }
  @keyframes fadeInUp {
    to { opacity: 1; transform: translateY(0); }
  }

  /* --- HEADER --- */
  .header {
    text-align: center;
    margin-bottom: 60px;
  }
  .header h1 {
    font-size: 3rem;
    color: #FF4500;
    margin-bottom: 10px;
    letter-spacing: -1px;
  }
  .header .subtitle {
    font-size: 1.2rem;
    color: #555;
    line-height: 1.5;
    max-width: 600px;
    margin: 0 auto;
  }

  /* --- TIMELINE --- */
  .timeline {
    position: relative;
    padding-left: 20px; /* Space for the line on mobile */
  }
  
  /* The Vertical Line */
  .timeline::before {
    content: '';
    position: absolute;
    top: 20px;
    bottom: 20px;
    left: 44px; /* Align with center of marker */
    width: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    z-index: 0;
  }

  /* Step Item Wrapper */
  .step-item {
    position: relative;
    display: flex;
    gap: 30px;
    margin-bottom: 60px;
    z-index: 1;
  }

  /* The Number Circle */
  .step-marker {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    background: #FF4500;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 1.5rem;
    box-shadow: 0 4px 10px rgba(255, 69, 0, 0.3);
    border: 4px solid #fff; /* White ring effect */
  }

  /* The Content Card */
  .step-content {
    background: white;
    padding: 30px;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    flex: 1;
    border: 1px solid rgba(0,0,0,0.05);
    transition: transform 0.2s;
  }
  .step-content:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.08);
  }

  .step-content h2 {
    margin-top: 0;
    font-size: 1.5rem;
    color: #1c1c1c;
  }

  .step-content p {
    font-size: 1rem;
    line-height: 1.6;
    color: #444;
  }

  .step-content a {
    color: #0079D3;
    font-weight: bold;
    text-decoration: none;
  }
  .step-content a:hover { text-decoration: underline; }

  /* Instruction Details */
  .instruction-block {
    background: #f6f7f8;
    padding: 15px 20px;
    border-radius: 8px;
    margin: 20px 0;
    border-left: 4px solid #FF4500;
  }
  .instruction-block p { margin: 10px 0; font-size: 0.95rem; }
  .highlight { font-weight: bold; color: #1c1c1c; background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #ddd; }
  small { color: #777; display: block; margin-top: 4px; }
  
  .bot-name { font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 4px; color: #d93a00; }
  .link-text { color: #0079D3; }
  code { background: #eee; padding: 2px 6px; border-radius: 4px; font-family: monospace; }

  /* Images */
  .image-wrapper {
    margin-top: 25px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #eee;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .image-wrapper img {
    width: 100%;
    height: auto;
    display: block;
  }

  /* --- CTA FOOTER --- */
  .cta-footer {
    text-align: center;
    margin-top: 40px;
    padding-bottom: 40px;
  }

  .primary-btn {
    background: #FF4500;
    color: white;
    border: none;
    padding: 18px 50px;
    font-size: 1.2rem;
    font-weight: 800;
    border-radius: 50px;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(255, 69, 0, 0.3);
    transition: all 0.3s ease;
  }
  .primary-btn:hover {
    background: #ff571a;
    transform: scale(1.05);
    box-shadow: 0 15px 35px rgba(255, 69, 0, 0.4);
  }

  /* --- RESPONSIVE --- */
  @media (max-width: 768px) {
    .container { padding: 40px 15px; }
    .header h1 { font-size: 2.2rem; }
    
    .timeline::before { left: 23px; } /* Adjust line for smaller marker logic if needed, kept same for now */
    
    .step-item { gap: 15px; }
    .step-marker { width: 40px; height: 40px; font-size: 1.2rem; }
    .timeline::before { left: 19px; } /* Center of 40px marker */
    
    .step-content { padding: 20px; }
    .step-content h2 { font-size: 1.25rem; }
  }
</style>