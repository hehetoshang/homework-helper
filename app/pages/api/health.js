export default async function handler(req, res) {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AI Homework Helper API',
    version: '1.0.0'
  });
}