import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
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
    const { imageBase64 } = req.body;

    // 这里应该调用百度OCR API或其他OCR服务
    // 以下是模拟实现
    const ocrResult = await simulateOCR(imageBase64);

    res.status(200).json({
      success: true,
      text: ocrResult,
      words: ocrResult.split(' ')
    });

  } catch (error) {
    console.error('OCR处理失败:', error);
    res.status(500).json({ 
      success: false, 
      error: 'OCR处理失败' 
    });
  }
}

// 模拟OCR函数（实际项目中替换为真实的OCR API调用）
async function simulateOCR(imageBase64) {
  // 这里模拟OCR识别结果
  const sampleTexts = [
    "已知函数 f(x) = x^2 + 2x + 1，求 f(3) 的值",
    "解二元一次方程组: 2x + 3y = 7, x - y = 1",
    "计算三角函数值: sin(π/6) + cos(π/3)",
    "几何证明: 证明直角三角形斜边上的中线等于斜边的一半",
    "概率问题: 从52张扑克牌中随机抽取2张，都是红心的概率是多少"
  ];
  
  return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
}