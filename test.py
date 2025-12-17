import pandas as pd
import zipfile
import os
import requests
import time
import random
from tqdm import tqdm

pd.set_option('display.max_rows', 10)
pd.set_option('display.max_columns', None)
pd.set_option('display.max_colwidth', 100) 
pd.set_option('display.width', 1000)
ZIP_FILENAME = "export_gonorreia11_20251217.zip"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def load_reddit_data(zip_path):
    if not os.path.exists(zip_path):
        print(f"[ERROR] Arquivo '{zip_path}' nao encontrado.")
        return {}

    dfs = {}
    target_files = ["comments.csv", "posts.csv"] 

    try:
        with zipfile.ZipFile(zip_path, 'r') as z:
            all_files = z.namelist()
            for target_csv in target_files:
                # Busca o arquivo mesmo dentro de subpastas
                found = next((f for f in all_files if f == target_csv), None)
                
                if found:
                    print(f"[INFO] Lendo {found}...")
                    with z.open(found) as f:
                        # Leitura bruta sem parse de datas
                        df = pd.read_csv(f)
                        dfs[target_csv] = df
                        
                        print(f"   -> {len(df)} linhas carregadas.")
                else:
                    print(f"[WARN] {target_csv} nao encontrado no zip.")
    except Exception as e:
        print(f"[ERROR] Falha critica no ZIP: {e}")
    return dfs

def fetch_stats_from_json(permalink, is_comment=False):
    """
    Busca Upvotes e Comentarios (apenas para posts) via JSON publico.
    Retorna tupla: (ups, num_comments)
    """
    # Limpeza da URL
    url = permalink.strip()
    if url.endswith("/"):
        url = url[:-1]
    url = f"{url}.json"
    
    for _ in range(3):
        try:
            # Pausa aleatoria para evitar bloqueio
            time.sleep(random.uniform(0.4, 1.0))
            
            response = requests.get(url, headers=HEADERS, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                if is_comment:
                    # LOGICA PARA COMENTARIOS
                    # JSON Estrutura: Lista[1] -> data -> children[0] -> data
                    try:
                        comment_data = data[1]['data']['children'][0]['data']
                        ups = comment_data.get('ups', 0)
                        return ups, 0 # Comentarios nao tem sub-comments count facil aqui
                    except (IndexError, KeyError, TypeError):
                        return 0, 0
                else:
                    # LOGICA PARA POSTS
                    # JSON Estrutura: Lista[0] -> data -> children[0] -> data
                    try:
                        post_data = data[0]['data']['children'][0]['data']
                        ups = post_data.get('ups', 0)
                        n_comments = post_data.get('num_comments', 0)
                        return ups, n_comments
                    except (IndexError, KeyError, TypeError):
                        return 0, 0
            
            elif response.status_code == 429:
                # Rate Limit atingido
                time.sleep(10)
                
        except Exception:
            time.sleep(1)
            
    return 0, 0

def process_enrichment(df, content_type="post"):
    print(f"\n[START] Iniciando varredura de {len(df)} {content_type}s...")
    
    real_ups = []
    real_comments = []
    
    is_comment = (content_type == "comment")
    
    # Barra de progresso
    for index, row in tqdm(df.iterrows(), total=df.shape[0], desc=f"Baixando {content_type}s"):
        if 'permalink' in row and pd.notna(row['permalink']):
            ups, n_comments = fetch_stats_from_json(row['permalink'], is_comment=is_comment)
            real_ups.append(ups)
            real_comments.append(n_comments)
        else:
            real_ups.append(0)
            real_comments.append(0)
        
    df['real_ups'] = real_ups
    if not is_comment:
        df['real_comments'] = real_comments
        
    return df

if __name__ == "__main__":
    data = load_reddit_data(ZIP_FILENAME)
    if 'posts.csv' in data:
        df_posts = data['posts.csv']
        
        print("\n" + "-"*50)
        print("PREVIEW DOS POSTS (Dados Brutos):")
        print(df_posts.head())
        print("-" * 50)

        df_posts = process_enrichment(df_posts, content_type="post")
        
        print("\n" + "="*50)
        print("TOP 5 POSTS (Por Upvotes Reais)")
        print("="*50)
        
        df_sorted_posts = df_posts.sort_values(by='real_ups', ascending=False).head(5)
        
        # Colunas seguras para exibir
        cols_posts = ['subreddit', 'title', 'real_ups', 'real_comments']
        available_cols = [c for c in cols_posts if c in df_sorted_posts.columns]
        
        print(df_sorted_posts[available_cols])

    else:
        print("[WARN] posts.csv nao encontrado.")

    # ---------------------------------------------------------
    # 2. PROCESSAMENTO DE COMENTARIOS
    # ---------------------------------------------------------
    if 'comments.csv' in data:
        df_comments = data['comments.csv']
        
        print("\n" + "-"*50)
        print("PREVIEW DOS COMENTARIOS (Dados Brutos):")
        print(df_comments.head())
        print("-" * 50)

        # --- FILTRO DEBUG (Remova para rodar em tudo) ---
        # df_comments = df_comments.head(5)
        # ------------------------------------------------
        
        df_comments = process_enrichment(df_comments, content_type="comment")
        
        print("\n" + "="*50)
        print("TOP 5 COMENTARIOS (Por Upvotes Reais)")
        print("="*50)
        
        df_sorted_comments = df_comments.sort_values(by='real_ups', ascending=False).head(5)
        
        # Cria preview do corpo do texto
        if 'body' in df_sorted_comments.columns:
            df_sorted_comments['body_preview'] = df_sorted_comments['body'].astype(str).str.slice(0, 40) + "..."
            
        cols_comments = ['subreddit', 'body_preview', 'real_ups']
        available_cols_c = [c for c in cols_comments if c in df_sorted_comments.columns]
        
        print(df_sorted_comments[available_cols_c])

    else:
        print("[WARN] comments.csv nao encontrado.")

    print("\n[END] Processo finalizado.")