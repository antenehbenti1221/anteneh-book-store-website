// Vercel serverless endpoint. Keep KAGGLE_API_TOKEN as a server-side environment secret.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.KAGGLE_API_TOKEN) {
    return res.status(503).json({ error: 'Kaggle API is not configured yet.' });
  }
  // The next stage will push a prepared Kaggle notebook/job using the authenticated API.
  return res.status(202).json({ status: 'queued', message: 'Video job accepted.' });
}
