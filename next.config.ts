import type { NextConfig } from "next";

// STATIC_EXPORT=1 时输出纯静态站点（out/ 目录），供 Cloudflare Pages 等静态托管使用；
// 默认（本地 dev / 常规构建）行为完全不变。
const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  /* config options here */
  ...(isStaticExport ? { output: "export" as const, trailingSlash: true } : {}),
  // 静态导出（STATIC_EXPORT=1）时关闭 cacheComponents / partialPrefetching，否则 export 模式报 PPR 冲突
  cacheComponents: !isStaticExport,
  partialPrefetching: !isStaticExport,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
