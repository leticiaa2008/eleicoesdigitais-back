# Eleições Digitais — publicação corrigida

## Rotas implementadas
- GET /api — lista de rotas e estado de configuração
- GET /api/health — testa a conexão lendo a tabela candidates
- GET /api/candidates — lista os candidatos reais da tabela candidates
- GET /api/candidates/:id — detalhe do candidato
- GET /api/proposals?candidate_id=ID — propostas
- POST /api/votes — grava voto em votes (body: candidate_id, voter_key)
- GET /api/results — apuração
- GET /api/events e POST /api/events — eventos

## Vercel
Defina `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `FRONTEND_ORIGIN` nas Environment Variables. Não suba `.env` nem compartilhe a service role key. Depois faça redeploy.

## Teste
Abra `/api/health`: precisa responder `{ "ok": true, "database": "connected" }`. Se der 503, faltam variáveis; se der erro de consulta, confira se a tabela `candidates` tem a coluna `id`.
