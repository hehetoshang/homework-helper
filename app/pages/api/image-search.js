import milvusClient from '../../../lib/milvusClient';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { keyword } = req.body;

    // 文本搜索逻辑（简化示例）
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .ilike('title', `%${keyword}%`)
      .limit(10);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database search failed' });
    }

    res.status(200).json({ results: questions || [] });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}