/**
 * 卖家后台接口客户端
 *
 * 安全要点：
 * - 浏览器**不持有**服务端的管理 token。页面只发用户输入的口令（x-admin-pass 头），
 *   Worker 校验通过后，用它自己环境变量里的真 token 去调云端。
 * - 所以即使有人翻遍前端代码，也拿不到能直接用的管理凭证。
 * - 口令走 HTTPS 请求体，不落 localStorage（只在本标签页 sessionStorage 里暂存，关掉即失效）。
 */

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLOUD_PUBLISHABLE_KEY || "";
const RPC_BASE = "/.cloud/database/rest/rpc";

/** 口令错误（Worker 返回 403） */
export class AdminAuthError extends Error {}

/** 环境没配好：缺发布密钥，或 Worker 没设服务端口令 */
export class AdminConfigError extends Error {}

/** 云端是否已配置：没配时后台连不上，应直接提示而不是显示一堆 0 */
export const isAdminCloudConfigured = Boolean(PUBLISHABLE_KEY);

export interface UsageLog {
  id: number;
  code: string;
  action: string;
  detail: string | null;
  created_at: string;
}

async function adminRpc<T>(fn: string, params: Record<string, unknown>, pass: string): Promise<T> {
  if (!PUBLISHABLE_KEY) {
    throw new AdminConfigError("云端未配置：构建时缺少 NEXT_PUBLIC_CLOUD_PUBLISHABLE_KEY，后台无法连接云端。");
  }

  const res = await fetch(`${RPC_BASE}/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-pass": pass,
      "x-wb-webapp-access-key": PUBLISHABLE_KEY,
    },
    body: JSON.stringify(params),
  });

  if (res.status === 403) throw new AdminAuthError("口令不正确");
  if (res.status === 503) throw new AdminConfigError("服务端未配置后台口令，请联系开发者设置。");

  const text = await res.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    /* 非 JSON 响应，下面按失败处理 */
  }

  if (!res.ok) {
    const reason =
      payload && typeof payload === "object" && "reason" in payload
        ? String((payload as { reason?: unknown }).reason ?? "")
        : "";
    throw new Error(reason || `请求失败（HTTP ${res.status}）`);
  }

  // 兼容两种返回：直接返回函数结果，或包一层 { data: ... }
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export async function adminListCodes(pass: string) {
  return adminRpc<{ ok: boolean; reason?: string; codes?: Array<{ code: string; quota: number; used: number; active: boolean; created_at: string }> }>(
    "admin_list_codes",
    {},
    pass,
  );
}

export async function adminListUsage(pass: string) {
  return adminRpc<{ ok: boolean; reason?: string; logs?: UsageLog[] }>("admin_list_usage", {}, pass);
}

export async function adminCreateCodes(pass: string, count: number, quota: number) {
  return adminRpc<{ ok: boolean; reason?: string; codes?: Array<{ code: string; quota: number }> }>(
    "admin_create_codes",
    { p_count: count, p_quota: quota },
    pass,
  );
}
