import 'dotenv/config';
import express from 'express';
import apiHandler from './lib/api-handler.js';
const app = express();
app.use(express.json({ limit: '100kb' }));
app.use((req, res) => apiHandler(req, res));
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API Eleições Digitais em http://localhost:${port}`));
