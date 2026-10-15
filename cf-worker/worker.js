// Cloudflare Worker：静态站点 + 云端 API 同域转发
// - 普通路径 -> 返回静态文件（Next.js 静态导出产物 out/）
// - /.cloud/* -> 转发到 WorkBuddy 云端（去掉 Origin/Referer/Cookie，云端只校验
//   发布密钥，不带来源头即放行；同域请求浏览器也几乎不产生跨域问题）
const UPSTREAM_HOST = "ai-job-assistant-33282.app.workbuddy.host";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/.cloud/" || url.pathname.startsWith("/.cloud/")) {
      const upstream = new URL(request.url);
      upstream.hostname = UPSTREAM_HOST;
      upstream.protocol = "https:";
      upstream.port = "";

      const headers = new Headers(request.headers);
      headers.delete("Origin");
      headers.delete("Referer");
      headers.delete("Cookie");
      headers.delete("X-Forwarded-For");
      headers.delete("X-Forwarded-Proto");
      headers.delete("X-Real-IP");
      headers.set("Host", UPSTREAM_HOST);

      const method = request.method.toUpperCase();
      const init = {
        method,
        headers,
        body: method === "GET" || method === "HEAD" ? undefined : request.body,
        redirect: "manual",
      };

      const resp = await fetch(upstream.toString(), init);
      const respHeaders = new Headers(resp.headers);
      respHeaders.set("Access-Control-Allow-Origin", url.origin);
      respHeaders.set("Access-Control-Allow-Headers", "Content-Type, x-wb-webapp-access-key, Authorization");
      respHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      return new Response(resp.body, { status: resp.status, headers: respHeaders });
    }

    // 其余路径走静态资源
    return env.ASSETS.fetch(request);
  },
};
