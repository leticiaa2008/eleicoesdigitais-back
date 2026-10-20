# Eleições Digitais — Backend Vercel + Supabase

Backend corrigido para funcionar como função serverless da Vercel e também localmente com Express.

## Rotas disponíveis

- `GET /` — informações da API e rotas.
- `GET /api/health` — verifica variáveis e consulta o Supabase.
- `GET /api/election` — configuração da eleição.
- `GET /api/candidates` — candidaturas.
- `GET /api/candidates/:id` — candidatura e propostas.
- `GET /api/proposals` — propostas; aceita `?candidate_id=ID`.
- `POST /api/votes` — registra voto simulado, valida candidatura/eleição e impede repetição da chave de sessão.
- `GET /api/results` — apuração agregada.
- `GET /api/events` e `POST /api/events` — mural de atualizações.

## 1. Configure o Supabase

1. Abra seu projeto em https://supabase.com/dashboard.
2. Vá a **SQL Editor → New query**.
3. Abra `supabase/schema.sql`, copie tudo, cole no editor e clique **Run**.
4. Em **Project Settings → API** (o nome pode variar), copie a **Project URL** e a chave secreta `service_role`/secret. Nunca use essa chave no front-end.

## 2. Publique o backend na Vercel

1. Envie a pasta `backend` deste pacote para um repositório GitHub. Não envie um `.env` preenchido.
2. Na Vercel, crie/import o projeto a partir desse repositório. Se o repositório contiver `frontend` e `backend`, em **Settings → Build and Deployment → Root Directory**, escolha `backend`.
3. Em **Settings → Environment Variables**, crie estas variáveis para Production (e Preview se precisar):
   - `SUPABASE_URL` = Project URL do Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY` = chave secreta/service_role do Supabase.
   - `FRONTEND_ORIGIN` = origem do site do front-end, sem barra no final, por exemplo `https://seu-usuario.github.io`. Se o front também estiver na Vercel, use o domínio do front-end, não o domínio da API. Para mais de uma origem, separe por vírgulas.
4. Faça **Redeploy** depois de salvar as variáveis.
5. Abra `https://SEU-DOMINIO.vercel.app/api/health`. O esperado é `{"ok":true,"database":"connected"}`.

`vercel.json` reescreve as URLs `/api/...` para a função `api/index.js`, que despacha as rotas corretamente. Isso evita depender de `app.listen()` dentro de uma função serverless.

## 3. Teste local (opcional)

Na pasta `backend`, copie `.env.example` para `.env`, preencha as chaves, e rode:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000/api/health`.

## 4. Front-end

O `frontend/app.js` já usa `https://eleicoesdigitais-back.vercel.app` como base da API. O Service Worker envia os votos pendentes ao endpoint `/api/votes` e **só remove da fila os votos aceitos ou uma duplicidade confirmada**. Para uso offline, abra o site online ao menos uma vez para guardar as candidaturas reais do Supabase no cache do navegador.

## Segurança e limites

Projeto didático com votos fictícios, não deve ser usado para eleições reais. A chave `SUPABASE_SERVICE_ROLE_KEY` dá acesso elevado e deve existir apenas nas variáveis de ambiente do backend. `voter_key` identifica uma sessão/navegador de forma didática, não é autenticação forte. Proteja a criação de eventos se for usar fora da sala de aula.
