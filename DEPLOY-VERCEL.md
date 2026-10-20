# Publicação do backend Eleições Digitais

1. Importe/publice esta pasta como projeto separado na Vercel.
2. Em Settings > Environment Variables, configure no ambiente Production:
   - `SUPABASE_URL`: Project URL do projeto Supabase que contém as tabelas `candidates`, `election_settings`, `proposals`, `votes` e `election_events`.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave secreta de servidor do MESMO projeto Supabase. Nunca coloque essa chave no front-end ou em repositório público.
   - `FRONTEND_ORIGIN`: domínio publicado do front-end, por exemplo `https://SEU-FRONTEND.vercel.app` (sem barra no final). Para múltiplas origens, separe por vírgula.
3. Faça redeploy após salvar as variáveis.
4. Teste `https://eleicoesdigitais-back.vercel.app/api/health`. O esperado é `{"ok":true,"database":"connected"}`.
5. Teste `https://eleicoesdigitais-back.vercel.app/api/candidates`, `/api/proposals`, e `/api/results`.

O arquivo `.env` local não é incluído neste ZIP por segurança. Use `.env.example` apenas como modelo. Não compartilhe nem publique a chave `service_role`.

O esquema SQL está em `supabase/schema.sql`. Execute-o apenas se as tabelas ou colunas exigidas ainda não existirem; não recrie dados existentes sem backup.
