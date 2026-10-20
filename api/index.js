import { createClient } from '@supabase/supabase-js';

// Certifica-te de configurar estas variaveis no painel da Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Configuração de CORS para permitir que o Front-end faça pedidos
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. ROTA GET: Busca os candidatos da tabela 'candidates'
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    }

    // 2. ROTA POST: Regista um voto na tabela 'votes'
    if (req.method === 'POST') {
      const { candidateId } = req.body;

      if (!candidateId) {
        return res.status(400).json({ error: 'O ID do candidato e obrigatorio.' });
      }

      const { data, error } = await supabase
        .from('votes')
        .insert([{ candidate_id: candidateId }]);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  return res.status(405).json({ error: 'Metodo nao permitido.' });
}