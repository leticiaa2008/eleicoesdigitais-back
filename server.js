import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = Number(process.env.PORT || 3000);
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || url.includes("SEU-PROJETO") || key.includes("COLE_SUA")) {
  console.error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const origins = (process.env.FRONTEND_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({ origin(origin, cb) { if (!origin || origins.length === 0 || origins.includes(origin)) return cb(null, true); return cb(new Error("Origem não permitida pelo CORS.")); } }));
app.use(express.json({ limit: "100kb" }));
const fail = (res, error) => { console.error("Supabase:", error.message); return res.status(500).json({ error: "Falha ao consultar o Supabase.", detail: error.message }); };

app.get("/", (_req, res) => res.json({ name: "Eleições Digitais — Grupo 6: Clube de Esportes", status: "online", routes: ["/api/health", "/api/election", "/api/candidates", "/api/proposals", "/api/votes", "/api/results", "/api/events"] }));
app.get("/api/health", async (_req, res) => { const { error } = await supabase.from("candidates").select("id").limit(1); if (error) return fail(res, error); res.json({ ok: true, database: "connected" }); });
app.get("/api/election", async (_req, res) => { const { data, error } = await supabase.from("election_settings").select("*").eq("id", 1).maybeSingle(); if (error) return fail(res, error); res.json(data); });
app.get("/api/candidates", async (_req, res) => { const { data, error } = await supabase.from("candidates").select("id, number, name, slogan, photo_url, created_at").order("number"); if (error) return fail(res, error); res.json(data); });
app.get("/api/candidates/:id", async (req, res) => { const { data, error } = await supabase.from("candidates").select("id, number, name, slogan, photo_url, proposals(id, title, description)").eq("id", req.params.id).maybeSingle(); if (error) return fail(res, error); if (!data) return res.status(404).json({ error: "Candidato não encontrado." }); res.json(data); });
app.get("/api/proposals", async (req, res) => { let q = supabase.from("proposals").select("id, candidate_id, title, description, created_at").order("created_at"); if (req.query.candidate_id) q = q.eq("candidate_id", String(req.query.candidate_id)); const { data, error } = await q; if (error) return fail(res, error); res.json(data); });

// Voto simulado: a restrição UNIQUE no banco impede repetição da mesma chave por eleição.
app.post("/api/votes", async (req, res) => {
  const { candidate_id, voter_key } = req.body || {};
  if (!candidate_id || typeof voter_key !== "string" || voter_key.length < 8 || voter_key.length > 120) return res.status(400).json({ error: "Informe candidate_id e voter_key válido." });
  const { data: election, error: ee } = await supabase.from("election_settings").select("id, is_open").eq("id", 1).maybeSingle();
  if (ee) return fail(res, ee); if (!election || !election.is_open) return res.status(409).json({ error: "A votação está encerrada ou não configurada." });
  const { data: candidate, error: ce } = await supabase.from("candidates").select("id").eq("id", candidate_id).maybeSingle();
  if (ce) return fail(res, ce); if (!candidate) return res.status(400).json({ error: "Candidato inválido." });
  const { data, error } = await supabase.from("votes").insert({ election_id: 1, candidate_id, voter_key }).select("id, candidate_id, created_at").single();
  if (error?.code === "23505") return res.status(409).json({ error: "Esta sessão já registrou um voto nesta eleição." });
  if (error) return fail(res, error); res.status(201).json({ message: "Voto simulado registrado no Supabase.", vote: data });
});
app.get("/api/results", async (_req, res) => {
  const { data: candidates, error: ce } = await supabase.from("candidates").select("id, number, name, slogan, photo_url").order("number"); if (ce) return fail(res, ce);
  const { data: votes, error: ve } = await supabase.from("votes").select("candidate_id").eq("election_id", 1); if (ve) return fail(res, ve);
  const total = votes.length, counts = new Map(); for (const v of votes) counts.set(v.candidate_id, (counts.get(v.candidate_id) || 0) + 1);
  res.json(candidates.map(c => { const n = counts.get(c.id) || 0; return { ...c, votes: n, total_votes: total, percentage: total ? Number((n / total * 100).toFixed(1)) : 0 }; }));
});
app.get("/api/events", async (_req, res) => { const { data, error } = await supabase.from("election_events").select("id, title, message, created_at").order("created_at", { ascending: false }).limit(30); if (error?.code === "42P01") return res.json([]); if (error) return fail(res, error); res.json(data); });
app.post("/api/events", async (req, res) => { const { title, message } = req.body || {}; if (typeof title !== "string" || !title.trim() || title.length > 100 || typeof message !== "string" || !message.trim() || message.length > 500) return res.status(400).json({ error: "Informe título (até 100 caracteres) e mensagem (até 500)." }); const { data, error } = await supabase.from("election_events").insert({ title: title.trim(), message: message.trim() }).select("id, title, message, created_at").single(); if (error) return fail(res, error); res.status(201).json(data); });
app.use((err, _req, res, _next) => { if (err.message?.includes("CORS")) return res.status(403).json({ error: err.message }); console.error(err); res.status(500).json({ error: "Erro interno da API." }); });
app.listen(port, () => console.log(`API Eleições Digitais rodando na porta ${port}`));
