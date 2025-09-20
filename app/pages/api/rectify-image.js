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

    // 在实际项目中，这里会调用OpenCV进行图像矫正
    // 现在返回原图作为演示
    res.status(200).json({
      success: true,
      rectifiedImage: imageBase64,
      message: '图像矫正完成（演示模式）'
    });

  } catch (error) {
    console.error('图像矫正失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '图像矫正失败' 
    });
  }
}