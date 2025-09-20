import { MilvusClient } from "@zilliz/milvus2-sdk-node";

let milvusClient;

if (!milvusClient) {
  milvusClient = new MilvusClient({
    address: process.env.MILVUS_ADDRESS || "localhost:19530",
  });
}

export default milvusClient;