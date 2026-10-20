import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Configuração dos cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path } = req.query;

  // Rota: GET /api/candidatos (Busca lista e votos do Supabase)
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('candidatos')
      .select('*')
      .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // Rota: POST /api/votar (Registra o voto no Supabase)
  if (req.method === 'POST') {
    const { candidatoId } = req.body;

    if (!candidatoId) {
      return res.status(400).json({ error: 'ID do candidato é obrigatório.' });
    }

    // Busca o número atual de votos
    const { data: candidato, error: fetchError } = await supabase
      .from('candidatos')
      .select('votos')
      .eq('id', candidatoId)
      .single();

    if (fetchError || !candidato) {
      return res.status(404).json({ error: 'Candidato não encontrado.' });
    }

    // Incrementa o voto
    const { data, error: updateError } = await supabase
      .from('candidatos')
      .update({ votos: candidato.votos + 1 })
      .eq('id', candidatoId)
      .select();

    if (updateError) return res.status(500).json({ error: updateError.message });
    return res.status(200).json({ success: true, data });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}