import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configured = Boolean(supabaseUrl && supabaseKey && !supabaseUrl.includes('SEU-PROJETO') && !supabaseKey.includes('COLE_SUA'));
const supabase = configured
  ? createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '').split(',').map(v => v.trim()).filter(Boolean);

function routeFrom(req) {
  if (typeof req.query?.path === 'string') return '/' + req.query.path.replace(/^\/+/, '').replace(/\/+$/, '');
  const pathname = new URL(req.url || '/', 'https://local.invalid').pathname;
  return pathname.replace(/^\/api(?=\/|$)/, '') || '/';
}
function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
function cors(req, res) {
  const origin = req.headers?.origin;
  if (origin && allowedOrigins.length && !allowedOrigins.includes(origin)) {
    send(res, 403, { error: 'Origem não permitida pelo CORS. Configure FRONTEND_ORIGIN na Vercel.' });
    return false;
  }
  res.setHeader('Access-Control-Allow-Origin', origin && allowedOrigins.length ? origin : '*');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return true;
}
async function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new Error('Corpo JSON inválido.'); }
}
function dbError(res, error) {
  console.error('[Supabase]', error?.message || error);
  send(res, 500, { error: 'Falha ao consultar o Supabase.', detail: error?.message || 'Erro desconhecido.' });
}

export default async function apiHandler(req, res) {
  if (!cors(req, res)) return;
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const route = routeFrom(req);
  const method = req.method || 'GET';
  if (route === '/' && method === 'GET') return send(res, 200, {
    name: 'Eleições Digitais — Grupo 6: Clube de Esportes', status: 'online',
    databaseConfigured: configured,
    routes: ['/api/health','/api/election','/api/candidates','/api/candidates/:id','/api/proposals','/api/votes','/api/results','/api/events']
  });
  if (route === '/health' && method === 'GET') {
    if (!configured) return send(res, 503, { ok: false, database: 'not_configured', error: 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis da Vercel.' });
    const { error } = await supabase.from('candidates').select('id').limit(1);
    if (error) return dbError(res, error);
    return send(res, 200, { ok: true, database: 'connected' });
  }
  if (!configured) return send(res, 503, { error: 'Backend sem Supabase configurado. Adicione SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.' });
  try {
    if (route === '/election' && method === 'GET') {
      const { data, error } = await supabase.from('election_settings').select('*').eq('id', 1).maybeSingle();
      if (error) return dbError(res, error);
      return send(res, data ? 200 : 404, data || { error: 'Eleição não configurada. Execute supabase/schema.sql.' });
    }
    if (route === '/candidates' && method === 'GET') {
      const { data, error } = await supabase.from('candidates').select('id,number,name,slogan,photo_url,created_at').order('number');
      if (error) return dbError(res, error);
      return send(res, 200, data || []);
    }
    const candidateMatch = route.match(/^\/candidates\/([^/]+)$/);
    if (candidateMatch && method === 'GET') {
      const { data, error } = await supabase.from('candidates').select('id,number,name,slogan,photo_url,created_at,proposals(id,title,description)').eq('id', candidateMatch[1]).maybeSingle();
      if (error) return dbError(res, error);
      return send(res, data ? 200 : 404, data || { error: 'Candidato não encontrado.' });
    }
    if (route === '/proposals' && method === 'GET') {
      const query = new URL(req.url || '/', 'https://local.invalid').searchParams;
      const candidateId = req.query?.candidate_id || query.get('candidate_id');
      let q = supabase.from('proposals').select('id,candidate_id,title,description,created_at').order('created_at');
      if (candidateId) q = q.eq('candidate_id', String(candidateId));
      const { data, error } = await q;
      if (error) return dbError(res, error);
      return send(res, 200, data || []);
    }
    if (route === '/votes' && method === 'POST') {
      let body;
      try { body = await bodyOf(req); } catch (error) { return send(res, 400, { error: error.message }); }
      const { candidate_id, voter_key } = body;
      if (!candidate_id || typeof voter_key !== 'string' || voter_key.length < 8 || voter_key.length > 120) return send(res, 400, { error: 'Informe candidate_id e voter_key válido.' });
      const { data: election, error: electionError } = await supabase.from('election_settings').select('id,is_open').eq('id', 1).maybeSingle();
      if (electionError) return dbError(res, electionError);
      if (!election || !election.is_open) return send(res, 409, { error: 'A votação está encerrada ou não configurada.' });
      const { data: candidate, error: candidateError } = await supabase.from('candidates').select('id').eq('id', candidate_id).maybeSingle();
      if (candidateError) return dbError(res, candidateError);
      if (!candidate) return send(res, 400, { error: 'Candidato inválido.' });
      const { data, error } = await supabase.from('votes').insert({ election_id: 1, candidate_id: candidate.id, voter_key }).select('id,candidate_id,created_at').single();
      if (error?.code === '23505') return send(res, 409, { error: 'Esta sessão já registrou um voto nesta eleição.' });
      if (error) return dbError(res, error);
      return send(res, 201, { message: 'Voto simulado registrado no Supabase.', vote: data });
    }
    if (route === '/results' && method === 'GET') {
      const { data: candidates, error: candidateError } = await supabase.from('candidates').select('id,number,name,slogan,photo_url').order('number');
      if (candidateError) return dbError(res, candidateError);
      const { data: votes, error: voteError } = await supabase.from('votes').select('candidate_id').eq('election_id', 1);
      if (voteError) return dbError(res, voteError);
      const total = (votes || []).length;
      const counts = new Map();
      for (const vote of votes || []) counts.set(String(vote.candidate_id), (counts.get(String(vote.candidate_id)) || 0) + 1);
      return send(res, 200, (candidates || []).map(candidate => {
        const count = counts.get(String(candidate.id)) || 0;
        return { ...candidate, votes: count, total_votes: total, percentage: total ? Number((count / total * 100).toFixed(1)) : 0 };
      }));
    }
    if (route === '/events' && method === 'GET') {
      const { data, error } = await supabase.from('election_events').select('id,title,message,created_at').order('created_at', { ascending: false }).limit(30);
      if (error?.code === '42P01') return send(res, 200, []);
      if (error) return dbError(res, error);
      return send(res, 200, data || []);
    }
    if (route === '/events' && method === 'POST') {
      let body;
      try { body = await bodyOf(req); } catch (error) { return send(res, 400, { error: error.message }); }
      const { title, message } = body;
      if (typeof title !== 'string' || !title.trim() || title.length > 100 || typeof message !== 'string' || !message.trim() || message.length > 500) return send(res, 400, { error: 'Informe título (até 100 caracteres) e mensagem (até 500).' });
      const { data, error } = await supabase.from('election_events').insert({ title: title.trim(), message: message.trim() }).select('id,title,message,created_at').single();
      if (error) return dbError(res, error);
      return send(res, 201, data);
    }
    return send(res, 404, { error: `Rota não encontrada: ${method} ${route}` });
  } catch (error) {
    console.error('[API]', error);
    return send(res, 500, { error: 'Erro interno da API.' });
  }
}
