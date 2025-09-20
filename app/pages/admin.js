import { useState } from 'react';
import Head from 'next/head';

export default function Admin() {
  const [formData, setFormData] = useState({
    title: '',
    answer: '',
    image: null,
    imagePreview: null
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image || !formData.title || !formData.answer) {
      setMessage('请填写所有字段');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      // 1. 先上传图片到Supabase存储（或其他图床）
      const { imageUrl, error: uploadError } = await uploadImage(formData.image);
      if (uploadError) throw new Error(uploadError);

      // 2. 调用API添加题目
      const response = await fetch('/api/admin/add-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          answer: formData.answer,
          imageUrl: imageUrl,
          imageBase64: formData.imagePreview // 用于生成向量
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('题目添加成功！');
        setFormData({ title: '', answer: '', image: null, imagePreview: null });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('上传失败:', error);
      setMessage(`上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const uploadImage = async (file) => {
    // 这里实现图片上传逻辑，可以上传到Supabase Storage或其他图床
    // 返回图片的URL
    return { imageUrl: 'https://example.com/image.jpg' };
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Head>
        <title>管理后台 - AI作业助手</title>
      </Head>

      <h1>题目管理后台</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label>题目图片: </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {formData.imagePreview && (
            <div style={{ marginTop: '10px' }}>
              <img 
                src={formData.imagePreview} 
                alt="预览" 
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>题目描述: </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="输入题目描述..."
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>答案和解析: </label>
          <textarea
            name="answer"
            value={formData.answer}
            onChange={handleInputChange}
            placeholder="输入详细的答案和解析..."
            style={{ width: '100%', padding: '8px', minHeight: '100px' }}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          style={{
            padding: '10px 20px',
            backgroundColor: uploading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? '上传中...' : '添加题目'}
        </button>
      </form>

      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('失败') ? '#ffebee' : '#e8f5e8',
          border: `1px solid ${message.includes('失败') ? '#f44336' : '#4caf50'}`,
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {message}
        </div>
      )}

      <div>
        <h2>系统状态</h2>
        <button 
          onClick={async () => {
            const response = await fetch('/api/health');
            const data = await response.json();
            alert(`API状态: ${data.status}`);
          }}
          style={{ marginRight: '10px' }}
        >
          检查API状态
        </button>
        
        <button 
          onClick={async () => {
            const response = await fetch(`${process.env.VERCEL_URL}/api/embed/health`);
            const data = await response.json();
            alert(`Python服务状态: ${data.status}`);
          }}
        >
          检查Python服务
        </button>
      </div>
    </div>
  );
}