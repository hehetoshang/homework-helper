/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    MILVUS_ADDRESS: process.env.MILVUS_ADDRESS,
    VERCEL_URL: process.env.VERCEL_URL,
  },
  images: {
    domains: ['你的Supabase存储域名'],
  },
}

module.exports = nextConfig