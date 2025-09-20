import milvusClient from '../../../../lib/milvusClient';
import { supabase } from '../../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, title, answer, imageUrl } = req.body;

    // 1. 调用FastAPI服务生成向量
    const embeddingResponse = await fetch(`${process.env.VERCEL_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64 }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Embedding service failed');
    }

    const embeddingData = await embeddingResponse.json();

    // 2. 生成唯一ID
    const questionId = Date.now();

    // 3. 存入Milvus
    const insertResult = await milvusClient.insert({
      collection_name: "question_vectors",
      data: [
        [questionId],
        [embeddingData.embedding]
      ],
    });

    // 4. 存入Supabase
    const { error } = await supabase
      .from('questions')
      .insert({
        id: questionId,
        title,
        answer,
        image_url: imageUrl
      });

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      message: '题目添加成功！',
      id: questionId
    });

  } catch (error) {
    console.error('添加题目失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}