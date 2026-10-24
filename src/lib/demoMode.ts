/**
 * 演示模式（作品集 / 面试演示用）
 *
 * 访问 `?demo=1` 即进入演示模式：
 * - 跳过激活码门禁，访客可以直接把五个模块点一遍
 * - AI 分析强制走本地规则引擎，不调用云端模型、不消耗激活码额度
 * - 判断**只看地址栏参数**：带 `?demo=1` 才是演示，不带就是正常站点
 * - 不写 localStorage / sessionStorage，绝不让演示状态残留到裸域名
 *
 * 为什么不记忆状态：
 * 早期版本把演示标记写进了 sessionStorage，结果是同一标签页里先看过演示链接、
 * 再打开裸域名，页面仍然显示「演示模式」——访客无法判断自己看的是真站还是演示。
 * 现在站内跳转由 React 状态兜住（门禁挂在 layout 上不会重新挂载），
 * 地址栏参数由 AppShell 自动补齐，所以完全不需要 storage。
 *
 * 正常访问（不带参数）行为完全不变，门禁与云端 AI 照旧。
 */

/** 旧版本写在 sessionStorage 里的键，仅用于清理残留 */
const LEGACY_DEMO_KEY = "aja_demo_mode";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("demo") === "1";
  } catch {
    return false;
  }
}

/**
 * 演示模式下给站内链接补上 `?demo=1`。
 * 已有参数不重复加，原有查询串和锚点都保留，路径按静态导出规则补齐结尾斜杠。
 */
export function withDemoParam(href: string, isDemo: boolean): string {
  if (!isDemo) return href;

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  const queryIndex = withoutHash.indexOf("?");
  const rawPath = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "";
  const path = rawPath === "/" || rawPath.endsWith("/") ? rawPath : `${rawPath}/`;

  const parts = query ? query.split("&") : [];
  const already = parts.some((part) => part === "demo=1");
  const nextQuery = already ? parts : [...parts, "demo=1"];

  return `${path}?${nextQuery.join("&")}${hash}`;
}

/** 退出演示时清掉旧版本可能残留的标记（新逻辑不再写入，仅做兜底清理） */
export function exitDemoMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(LEGACY_DEMO_KEY);
  } catch {
    /* 隐私模式下 storage 不可用，忽略 */
  }
}
