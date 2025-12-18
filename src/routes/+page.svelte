<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'; // Importante para navegação
  import { zipAdded, isLoading } from '$lib/stores/dataStore.js';
  import { handleZipUpload } from '$lib/utils/zipProcessor.js';

  // Animação de entrada
  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    });
    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
  });

  function onFileSelected(e) {
    if (e.target.files.length > 0) {
        // 1. Marca que o zip foi adicionado
        zipAdded.set(true);
        
        // 2. Inicia o processamento (background)
        handleZipUpload(e.target.files[0]);
        
        // 3. Redireciona para a página de resultados IMEDIATAMENTE
        goto('/results');
    }
  }
</script>

<main>
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
  
  /* Animation Logic */
  :global(.animate-on-scroll) { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease-out, transform 0.8s ease-out; }
  :global(.animate-on-scroll.visible) { opacity: 1; transform: translateY(0); }

  .hero { text-align: center; background: radial-gradient(circle at center, #fff0ea 0%, transparent 70%); }
  .hero h1 { font-size: 3.5rem; margin-bottom: 10px; letter-spacing: -1px; color: #1a1a1b; }
  .hero .year { color: #FF4500; font-weight: 900; }
  .hero-subtitle { font-size: 1.2rem; color: #555; max-width: 600px; margin: 0 auto 20px; line-height: 1.6; }
  .hero-note { font-size: 0.85rem; color: #878a8c; background: rgba(0,0,0,0.05); display: inline-block; padding: 5px 12px; border-radius: 20px; }

  .upload-container { display: flex; justify-content: center; padding: 20px; margin-top: 20px; }
  .upload-box { position: relative; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); padding: 60px; text-align: center; border: 3px dashed #cbd5e0; border-radius: 20px; transition: all 0.3s; width: 100%; max-width: 500px; }
  .upload-box:hover { border-color: #FF4500; transform: scale(1.02); }
  .upload-icon { font-size: 4rem; margin-bottom: 20px; }
  .upload-box h3 { font-size: 1.5rem; margin: 0 0 10px 0; }
  .upload-box input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
  .fake-btn { background: #FF4500; color: white; border: none; padding: 12px 30px; border-radius: 30px; font-weight: 700; font-size: 1rem; margin-top: 20px; pointer-events: none; }
</style>