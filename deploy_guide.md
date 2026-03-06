# Guia de Deploy e Configuração Supabase

Siga estes passos para colocar seu site no ar e conectar ao banco de dados real.

## 1. Configurar o Supabase (Banco de Dados)
1. No seu projeto Supabase, vá em **SQL Editor**.
2. Clique em **New Query**.
3. Copie o conteúdo do arquivo [setup_supabase.sql](file:///c:/Users/FS/.gemini/antigravity/scratch/finance-app/setup_supabase.sql) e cole lá.
4. Clique em **Run**. Isso criará as tabelas e as regras de segurança.

## 2. Conectar o Site ao Supabase
1. Vá em **Project Settings** > **API**.
2. Copie a **Project URL** e a **anon public key**.
3. Abra o arquivo [script.js](file:///c:/Users/FS/.gemini/antigravity/scratch/finance-app/script.js).
4. Substitua os valores nas primeiras linhas:
   ```javascript
   const SUPABASE_URL = 'SUA_URL_AQUI';
   const SUPABASE_ANON_KEY = 'SUA_CHAVE_AQUI';
   ```

## 3. Publicar no GitHub Pages
Como você tem o **GitHub Desktop**:
1. Abra o GitHub Desktop.
2. Vá em **File** > **Add Local Repository**.
3. Selecione a pasta deste projeto (`finance-app`).
4. Clique em **Publish repository** para subir no seu GitHub.
5. No seu repositório no GitHub (site), vá em **Settings** > **Pages**.
6. Em **Branch**, selecione `main` (ou `master`) e clique em **Save**.
7. Aguarde alguns minutos e seu site estará disponível em `https://seu-usuario.github.io/finance-app`.

---
*Pronto! Seu controle financeiro agora está na nuvem.*
