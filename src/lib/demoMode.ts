/**
 * 演示模式（作品集 / 面试演示用）
 *
 * 访问 `?demo=1` 即进入演示模式：
 * - 跳过激活码门禁，访客可以直接把五个模块点一遍
 * - AI 分析强制走本地规则引擎，不调用云端模型、不消耗激活码额度
 * - 用 sessionStorage 记忆：同一标签页内跳转保持演示状态，关掉标签页即恢复原样
 * - 不写 localStorage，不与真实激活码状态互相污染
 *
 * 正常访问（不带参数）行为完全不变，门禁与云端 AI 照旧。
 */
const DEMO_KEY = "aja_demo_mode";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") {
      // 记住这次演示状态（站内跳转时 URL 可能不带参数，靠它兜住），
      // 但**不要**把地址栏里的 ?demo=1 删掉——访客会复制地址栏发给别人，
      // 参数一删，对方打开就变成需要激活码的正常站点。
      window.sessionStorage.setItem(DEMO_KEY, "1");
      return true;
    }
    return window.sessionStorage.getItem(DEMO_KEY) === "1";
  } catch {
    // 隐私模式下 storage 不可用时，退化为只看本次 URL 参数
    try {
      return new URLSearchParams(window.location.search).get("demo") === "1";
    } catch {
      return false;
    }
  }
}

export function exitDemoMode(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DEMO_KEY);
  } catch {
    /* 忽略 */
  }
}
