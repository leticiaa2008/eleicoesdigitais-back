// Vercel serverless entry point. All routes are handled centrally by lib/api-handler.js.
import apiHandler from '../lib/api-handler.js';
export default async function handler(req, res) {
  return apiHandler(req, res);
}
