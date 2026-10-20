import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Configuração de CORS (libera acesso do front-end)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Descobre qual rota foi chamada (ex: /api/candidates ou /api/votes)
  const url = req.url || '';

  try {
    // ROTA: Buscar candidatos (/api/candidates ou fallback para GET padrão)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return res.status(200).json(data);
    }

    // ROTA: Registrar voto (/api/votes)
    if (req.method === 'POST') {
      const { candidateId } = req.body;

      if (!candidateId) {
        return res.status(400).json({ error: 'candidateId é obrigatório' });
      }

      // Insere um registro na tabela "votes"
      const { data, error } = await supabase
        .from('votes')
        .insert([{ candidate_id: candidateId }]);

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }
  } catch (err) {
    console.error('Erro na API:', err);
    return res.status(500).json({ error: err.message });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
