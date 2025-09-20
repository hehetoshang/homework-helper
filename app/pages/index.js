import { useState, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text'); // 'text' 或 'image'
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // 文本搜索
  const searchByText = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理图片选择
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(file);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 拍照搜题
  const searchByImage = async () => {
    if (!selectedImage) {
      alert('请先选择图片');
      return;
    }

    setOcrLoading(true);
    try {
      // 1. 先进行图像矫正
      const rectifyResponse = await fetch('/api/rectify-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imagePreview }),
      });
      
      const rectifyData = await rectifyResponse.json();
      let processedImage = imagePreview;
      
      if (rectifyData.success) {
        processedImage = rectifyData.rectifiedImage;
      }

      // 2. 同时进行OCR和图像搜索
      const [ocrResponse, imageSearchResponse] = await Promise.allSettled([
        // OCR识别
        fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: processedImage }),
        }),
        // 图像搜索
        fetch('/api/image-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: processedImage }),
        })
      ]);

      let finalResults = [];
      let ocrText = '';

      // 处理OCR结果
      if (ocrResponse.status === 'fulfilled') {
        const ocrData = await ocrResponse.value.json();
        if (ocrData.success) {
          ocrText = ocrData.text;
          // 将OCR识别出的文字填入搜索框
          setKeyword(ocrText);
        }
      }

      // 处理图像搜索结果
      if (imageSearchResponse.status === 'fulfilled') {
        const searchData = await imageSearchResponse.value.json();
        if (searchData.results) {
          finalResults = searchData.results;
        }
      }

      // 如果没有图像搜索结果但OCR成功，用OCR文字进行文本搜索
      if (finalResults.length === 0 && ocrText) {
        const textSearchResponse = await fetch('/api/image-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: ocrText }),
        });
        const textSearchData = await textSearchResponse.json();
        finalResults = textSearchData.results || [];
      }

      setResults(finalResults);

      if (finalResults.length === 0) {
        alert('没有找到匹配的题目，请尝试重新拍摄或使用文字搜索');
      }

    } catch (error) {
      console.error('图片搜索失败:', error);
      alert('搜索失败，请重试');
    } finally {
      setOcrLoading(false);
    }
  };

  // 清除图片
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container">
      <Head>
        <title>AI作业助手 - 智能题目搜索</title>
        <meta name="description" content="基于AI技术的智能作业帮助工具，支持拍照搜题和文字搜索" />
      </Head>

      <header className="header">
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#0070f3' }}>
          AI作业助手
        </h1>

        {/* 搜索模式切换 */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <button
            onClick={() => setActiveTab('text')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'text' ? '#0070f3' : '#f0f0f0',
              color: activeTab === 'text' ? 'white' : '#666',
              border: 'none',
              borderRadius: '5px 0 0 5px',
              cursor: 'pointer'
            }}
          >
            📝 文字搜索
          </button>
          <button
            onClick={() => setActiveTab('image')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'image' ? '#0070f3' : '#f0f0f0',
              color: activeTab === 'image' ? 'white' : '#666',
              border: 'none',
              borderRadius: '0 5px 5px 0',
              cursor: 'pointer'
            }}
          >
            📷 拍照搜题
          </button>
        </div>

        {/* 文字搜索面板 */}
        {activeTab === 'text' && (
          <div className="search-box">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入题目关键词，如：'二次函数求导'、'三角函数计算'..."
              className="search-input"
              onKeyPress={(e) => e.key === 'Enter' && searchByText()}
            />
            <button
              onClick={searchByText}
              disabled={loading || !keyword.trim()}
              className="search-button"
            >
              {loading ? '🔍 搜索中...' : '搜索'}
            </button>
          </div>
        )}

        {/* 图片搜索面板 */}
        {activeTab === 'image' && (
          <div style={{ textAlign: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            
            {!imagePreview ? (
              <div>
                <button
                  onClick={triggerFileSelect}
                  style={{
                    padding: '15px 30px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    marginBottom: '10px'
                  }}
                >
                  📁 选择图片
                </button>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  或直接拍照上传题目图片
                </p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <img 
                    src={imagePreview} 
                    alt="题目预览" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '300px', 
                      borderRadius: '8px',
                      border: '2px solid #eee'
                    }}
                  />
                </div>
                <div>
                  <button
                    onClick={searchByImage}
                    disabled={ocrLoading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: ocrLoading ? '#ccc' : '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: ocrLoading ? 'not-allowed' : 'pointer',
                      marginRight: '10px'
                    }}
                  >
                    {ocrLoading ? '🔍 识别中...' : '开始搜题'}
                  </button>
                  <button
                    onClick={clearImage}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    重新选择
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 搜索结果 */}
      <div className="results-container">
        {results.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h2>搜索结果 ({results.length} 条)</h2>
          </div>
        )}
        
        {results.map((question, index) => (
          <div key={question.id || index} className="result-card">
            <h3 className="result-title">📚 题目 {index + 1}</h3>
            <p style={{ marginBottom: '15px', fontSize: '16px' }}>
              {question.title}
            </p>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '6px',
              borderLeft: '4px solid #0070f3'
            }}>
              <strong>✅ 解答：</strong>
              <p className="result-answer" style={{ margin: '10px 0 0 0' }}>
                {question.answer}
              </p>
            </div>
            {question.image_url && (
              <div style={{ marginTop: '15px' }}>
                <img 
                  src={question.image_url} 
                  alt="题目图示" 
                  style={{ 
                    maxWidth: '100%', 
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            )}
          </div>
        ))}

        {!loading && !ocrLoading && results.length === 0 && activeTab === 'text' && keyword && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            <p>🔍 没有找到相关题目</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>
              尝试使用更具体的关键词，或切换到"拍照搜题"
            </p>
          </div>
        )}
      </div>

      {/* 加载状态 */}
      {(loading || ocrLoading) && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px' 
        }}>
          <div style={{ 
            display: 'inline-block',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #0070f3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }}></div>
            <p>{activeTab === 'text' ? '正在搜索题目...' : '正在识别图片内容...'}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}