from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import towhee
import logging
import base64
from io import BytesIO
from PIL import Image
import numpy as np

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Homework Helper API", version="1.0.0")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmbedRequest(BaseModel):
    image_base64: str

@app.post("/api/embed")
async def generate_embedding(request: EmbedRequest):
    """生成图像特征向量"""
    try:
        if not request.image_base64:
            raise HTTPException(status_code=400, detail="缺少 image_base64 参数")
        
        logger.info("开始处理图像生成向量...")
        
        # 使用 Towhee 处理 Base64 图像
        result = (
            towhee.dc['data']([request.image_base64])
            .image_decode_base64['data', 'img']()
            .image_embedding.timm['img', 'vec'](
                model_name='clip_vit_base_patch32'
            )
            .to_list()
        )
        
        embedding = result[0][1].tolist()
        logger.info(f"向量生成成功，维度: {len(embedding)}")

        return {
            "status": "success",
            "embedding": embedding,
            "dimension": len(embedding)
        }

    except Exception as e:
        logger.error(f"处理图像时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"内部服务器错误: {str(e)}")

@app.get("/")
async def root():
    return {"message": "AI Homework Helper Embedding API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Vercel Serverless 入口点
handler = app