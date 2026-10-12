import { cloud, isCloudConfigured } from "@/lib/cloudClient";

const LICENSE_CODE_KEY = "aja_license_code";
const LICENSE_INFO_KEY = "aja_license_info";

export interface LicenseInfo {
  used: number;
  quota: number;
}

type RpcResult = { data: unknown; error: unknown };
type RpcRunner = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<RpcResult>;
};

export class LicenseError extends Error {
  reason: string;
  constructor(reason: string, message: string) {
    super(message);
    this.name = "LicenseError";
    this.reason = reason;
  }
}

export class LicenseRequiredError extends Error {
  constructor(message = "请先输入激活码") {
    super(message);
    this.name = "LicenseRequiredError";
  }
}

function callRpc(fn: string, args?: Record<string, unknown>): Promise<RpcResult> {
  if (!cloud) return Promise.resolve({ data: null, error: new Error("cloud not configured") });
  return (cloud.database as unknown as RpcRunner).rpc(fn, args);
}

function reasonToMessage(reason: string): string {
  switch (reason) {
    case "invalid":
      return "激活码无效，请检查后重新输入。";
    case "inactive":
      return "该激活码已停用，请联系卖家更换。";
    case "quota_exceeded":
      return "激活码额度已用完，请加购或联系卖家获取新码。";
    case "unauthorized":
      return "无权操作。";
    default:
      return "激活码校验失败，请重试或联系卖家。";
  }
}

export function getActiveCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LICENSE_CODE_KEY);
}

export function getLicenseInfo(): LicenseInfo | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LICENSE_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LicenseInfo;
  } catch {
    return null;
  }
}

export function saveLicense(code: string, info: LicenseInfo) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LICENSE_CODE_KEY, code);
  window.localStorage.setItem(LICENSE_INFO_KEY, JSON.stringify(info));
}

export function clearLicense() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LICENSE_CODE_KEY);
  window.localStorage.removeItem(LICENSE_INFO_KEY);
  window.dispatchEvent(new Event("license-invalid"));
}

export async function validateLicense(
  code: string,
): Promise<{ ok: boolean; reason?: string; used?: number; quota?: number }> {
  // 本地开发（未配置云端）不校验，直接放行
  if (!isCloudConfigured || !cloud) return { ok: true };
  const { data, error } = await callRpc("validate_license", { p_code: code });
  if (error) throw error;
  return (data as { ok: boolean; reason?: string; used?: number; quota?: number }) || { ok: false, reason: "invalid" };
}

export async function consumeLicense(): Promise<LicenseInfo> {
  // 本地开发（未配置云端）不限制用量
  if (!isCloudConfigured || !cloud) return { used: 0, quota: 0 };

  const code = getActiveCode();
  if (!code) throw new LicenseRequiredError();

  const { data, error } = await callRpc("consume_license", { p_code: code });
  if (error) throw error;
  const res = (data as { ok: boolean; reason?: string; used?: number; quota?: number }) || { ok: false };
  if (!res.ok) {
    clearLicense();
    throw new LicenseError(res.reason || "invalid", reasonToMessage(res.reason || "invalid"));
  }
  const info: LicenseInfo = { used: res.used ?? 0, quota: res.quota ?? 0 };
  saveLicense(code, info);
  return info;
}

export async function adminListCodes(token: string) {
  if (!isCloudConfigured || !cloud) throw new Error("请在已部署的正式站点访问后台。");
  const { data, error } = await callRpc("admin_list_codes", { p_token: token });
  if (error) throw error;
  return data as {
    ok: boolean;
    reason?: string;
    codes?: Array<{ code: string; quota: number; used: number; active: boolean; created_at: string }>;
  };
}

export async function adminCreateCodes(token: string, count: number, quota: number) {
  if (!isCloudConfigured || !cloud) throw new Error("请在已部署的正式站点访问后台。");
  const { data, error } = await callRpc("admin_create_codes", {
    p_token: token,
    p_count: count,
    p_quota: quota,
  });
  if (error) throw error;
  return data as { ok: boolean; reason?: string; codes?: Array<{ code: string; quota: number }> };
}
