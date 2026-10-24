// Cloudflare Worker：静态站点 + 云端 API 同域转发
// - 普通路径 -> 返回静态文件（Next.js 静态导出产物 out/）
// - /.cloud/* -> 转发到 WorkBuddy 云端（去掉 Origin/Referer/Cookie，云端只校验
//   发布密钥，不带来源头即放行；同域请求浏览器也几乎不产生跨域问题）
// - /.cloud/database/rest/rpc/admin_* -> 卖家后台接口，必须带 x-admin-pass 口令，
//   校验通过后由 Worker 把服务端真 token 填进请求体再转发。
//   **真 token 只存在于 Worker 的环境变量里，永远不下发到浏览器。**
const UPSTREAM_HOST = "ai-job-assistant-33282.app.workbuddy.host";

/** 卖家后台的 RPC 标记：命中即走口令校验 */
const ADMIN_RPC_MARK = "/rpc/admin_";

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** 等长比较，避免按字节提前返回泄露口令内容 */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/.cloud/" || url.pathname.startsWith("/.cloud/")) {
      const isAdminRpc = url.pathname.includes(ADMIN_RPC_MARK);
      let adminBody = null;

      if (isAdminRpc) {
        const expectedPass = env.ADMIN_PASS;
        const realToken = env.ADMIN_TOKEN;
        // 没配好就明确失败，绝不退化成「无口令也能用」
        if (!expectedPass || !realToken) {
          return jsonResponse({ ok: false, reason: "admin_not_configured" }, 503);
        }
        const pass = request.headers.get("x-admin-pass") || "";
        if (!safeEqual(pass, expectedPass)) {
          return jsonResponse({ ok: false, reason: "forbidden" }, 403);
        }

        // 用服务端真 token 覆盖 p_token：客户端不该、也不需要知道它
        const raw = await request.text();
        let payload;
        try {
          payload = raw ? JSON.parse(raw) : {};
        } catch {
          return jsonResponse({ ok: false, reason: "bad_request" }, 400);
        }
        if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
          return jsonResponse({ ok: false, reason: "bad_request" }, 400);
        }
        payload.p_token = realToken;
        adminBody = JSON.stringify(payload);
      }

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
      // 口令只用于 Worker 自己的校验，不往上游带
      headers.delete("x-admin-pass");
      headers.set("Host", UPSTREAM_HOST);

      const method = request.method.toUpperCase();
      const init = {
        method,
        headers,
        body:
          method === "GET" || method === "HEAD"
            ? undefined
            : adminBody !== null
              ? adminBody
              : request.body,
        redirect: "manual",
      };

      const resp = await fetch(upstream.toString(), init);
      const respHeaders = new Headers(resp.headers);
      respHeaders.set("Access-Control-Allow-Origin", url.origin);
      respHeaders.set(
        "Access-Control-Allow-Headers",
        "Content-Type, x-wb-webapp-access-key, Authorization, x-admin-pass",
      );
      respHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      return new Response(resp.body, { status: resp.status, headers: respHeaders });
    }

    // 其余路径走静态资源
    const resp = await env.ASSETS.fetch(request);

    // HTML 一律要求边缘回源校验（no-cache），不带强缓存。
    // 原因：页面里引用的 JS/CSS 都带内容哈希，一旦边缘继续返回旧 HTML，
    // 它指向的旧 chunk 在新版本里已经不存在，访客会白屏或功能错乱；
    // 反过来新的 HTML 也必须能被旧缓存住的页面刷到，部署才能真正生效。
    const contentType = resp.headers.get("Content-Type") || "";
    if (contentType.includes("text/html")) {
      const headers = new Headers(resp.headers);
      headers.set("Cache-Control", "no-cache, must-revalidate");
      return new Response(resp.body, {
        status: resp.status,
        statusText: resp.statusText,
        headers,
      });
    }

    return resp;
  },
};
