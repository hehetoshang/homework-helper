#!/usr/bin/env python3
import os
import json
import requests
from pymilvus import connections, Collection

def preprocess_existing_images():
    """预处理现有图片并生成向量"""
    
    # 连接数据库
    connections.connect(host="localhost", port="19530")
    collection = Collection("question_vectors")
    
    # 这里应该是从你的数据库获取现有图片的逻辑
    # 示例：假设你有一些本地图片需要处理
    image_dir = "path/to/your/images"
    
    print("开始预处理现有图片...")
    
    for filename in os.listdir(image_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(image_dir, filename)
            print(f"处理图片: {filename}")
            
            try:
                # 调用FastAPI服务生成向量
                with open(image_path, 'rb') as f:
                    image_data = f.read()
                
                # 将图片转换为base64
                import base64
                image_base64 = base64.b64encode(image_data).decode('utf-8')
                
                # 调用本地API生成向量
                response = requests.post(
                    "http://localhost:3000/api/embed",
                    json={"image_base64": f"data:image/jpeg;base64,{image_base64}"},
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    embedding = result['embedding']
                    
                    # 生成唯一ID（这里用文件名hash作为示例）
                    import hashlib
                    question_id = int(hashlib.md5(filename.encode()).hexdigest()[:8], 16)
                    
                    # 存入Milvus
                    data = [
                        [question_id],  # ID
                        [embedding]     # 向量
                    ]
                    
                    collection.insert(data)
                    print(f"✓ 成功处理: {filename}")
                    
                else:
                    print(f"✗ 处理失败: {filename} - {response.text}")
                    
            except Exception as e:
                print(f"✗ 处理错误: {filename} - {str(e)}")
    
    print("预处理完成！")
    collection.flush()

if __name__ == "__main__":
    preprocess_existing_images()