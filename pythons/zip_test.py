import pandas as pd
import zipfile
import os

def audit_zip_content():
    current_dir = os.getcwd()
    files = os.listdir(current_dir)
    zip_files = [f for f in files if f.lower().endswith('.zip')]

    target_zip = zip_files[0] # Pega o primeiro que achar
    print(f"Arquivo ZIP detectado: '{target_zip}'")
    print("="*60)

    try:
        with zipfile.ZipFile(target_zip, 'r') as z:
            all_files = z.namelist()
            csv_files = [f for f in all_files if f.lower().endswith('.csv')]
            print(f"Encontrados {len(csv_files)} arquivos CSV. Lendo amostras...\n")

            for csv_name in csv_files:
                print(f"ARQUIVO: {csv_name}")
                print("-" * 60)
                
                try:
                    with z.open(csv_name) as f:
                        # Lê o CSV sem tentar adivinhar datas, apenas raw data
                        df = pd.read_csv(f)
                        
                        # Informações básicas
                        print(f"   Linhas: {len(df)} | Colunas: {len(df.columns)}")
                        print(f"   Nomes das Colunas: {list(df.columns)}")
                        print("\n   Amostra (Head 5):")
                        print(df.head(5))
                        
                except Exception as e:
                    print(f"Erro ao ler CSV: {e}")
                
                print("\n" + "="*60 + "\n")

    except zipfile.BadZipFile:
        print("O arquivo encontrado não é um ZIP válido ou está corrompido.")
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    audit_zip_content()