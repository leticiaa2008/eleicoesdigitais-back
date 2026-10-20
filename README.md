# Eleições Digitais Offline-First — Backend do Grupo 6

API Node.js + Express conectada ao Supabase para a eleição educacional simulada **Clube de Esportes**.

## Rotas
- `GET /api/health` — testa conexão com o Supabase.
- `GET /api/election` — informações da eleição.
- `GET /api/candidates` e `GET /api/candidates/:id` — candidatos.
- `GET /api/proposals` — propostas; filtro opcional `?candidate_id=ID`.
- `POST /api/votes` — registra voto simulado e impede repetição da mesma sessão.
- `GET /api/results` — apuração.
- `GET /api/events` e `POST /api/events` — mural de atualizações.

## 1. Preparar o banco
1. Abra seu projeto em https://supabase.com/dashboard.
2. Entre em **SQL Editor → New query**.
3. Abra `supabase/schema.sql`, copie todo o conteúdo e cole no editor.
4. Clique em **Run** e confira as tabelas no Table Editor.

## 2. Preencher o `.env`
No Supabase, encontre **Project Settings → API** (a localização pode variar conforme a versão do painel). Copie a Project URL para `SUPABASE_URL` e a chave `service_role`/secret para `SUPABASE_SERVICE_ROLE_KEY`. Preencha `FRONTEND_ORIGIN` com a origem do Pages, por exemplo `https://SEU-USUARIO.github.io`.

**Segurança:** `.env` já vem com valores de exemplo para você substituir. Nunca suba o `.env` preenchido para o GitHub, nem coloque a service-role/secret key no front-end. O `.gitignore` exclui `.env`.

## 3. Executar localmente
Instale Node.js LTS se não tiver: https://nodejs.org/. Abra um terminal nesta pasta e rode:

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/api/health`. Resultado esperado: `{"ok":true,"database":"connected"}`. Se houver erro, revise URL/chave e confirme que executou o SQL.

## 4. Testar as rotas
Abra no navegador `http://localhost:3000/api/candidates`, `/api/proposals` e `/api/results`.
Para testar voto, use Postman/Thunder Client ou outro cliente HTTP com `POST http://localhost:3000/api/votes` e JSON:

```json
{"candidate_id":1,"voter_key":"sessao-de-teste-12345"}
```

O `candidate_id` deve ser um ID existente retornado por `/api/candidates`. Repetir o mesmo `voter_key` deve retornar HTTP 409.

## 5. Publicar o backend
GitHub Pages hospeda somente arquivos estáticos; não executa Node.js. Publique este backend em um host Node (por exemplo Render ou Railway) e configure as variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_ORIGIN`. O host normalmente fornece `PORT`. Depois, atualize o front-end para chamar a URL pública da API.

## 6. Integração com o front-end offline-first
Quando online, o front-end deve buscar candidatos/propostas em `GET /api/candidates` e `GET /api/proposals`. Para sincronizar voto pendente, envie o item do IndexedDB para `POST /api/votes` quando a rede voltar. Reutilize o mesmo `voter_key` nas tentativas, para evitar duplicidade. Este backend não altera automaticamente o JavaScript do site: a URL da API precisa ser conectada no `app.js` do front-end.

## Limitações e segurança
- Uso exclusivamente educacional; não usar em eleições reais.
- A `service_role` ignora RLS e deve permanecer no servidor.
- `voter_key` é uma proteção didática por sessão/navegador, não uma identidade forte.
- `POST /api/events` está disponível para demonstração; em sistema real, proteja a criação de eventos com autenticação/autorização.
