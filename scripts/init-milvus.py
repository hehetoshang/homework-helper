#!/usr/bin/env python3
from pymilvus import connections, utility, FieldSchema, CollectionSchema, DataType, Collection

def init_milvus():
    # 连接Milvus
    connections.connect(host="localhost", port="19530")
    
    # 集合名称和维度
    collection_name = "question_vectors"
    dim = 512  # CLIP向量维度
    
    # 如果集合已存在，则删除
    if utility.has_collection(collection_name):
        utility.drop_collection(collection_name)
        print(f"已删除现有集合: {collection_name}")
    
    # 定义字段
    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=False),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=dim)
    ]
    
    # 创建集合
    schema = CollectionSchema(fields=fields, description="AI Homework Helper Question Vectors")
    collection = Collection(name=collection_name, schema=schema)
    
    # 创建索引
    index_params = {
        "metric_type": "L2",
        "index_type": "IVF_FLAT",
        "params": {"nlist": 1024}
    }
    
    collection.create_index(field_name="embedding", index_params=index_params)
    collection.load()
    
    print(f"集合 {collection_name} 初始化成功！")
    print(f"向量维度: {dim}")
    print(f"索引类型: IVF_FLAT")

if __name__ == "__main__":
    init_milvus()