"use client";

export const FREE_DAILY_LIMIT = 8;
export const MEMBER_DAILY_LIMIT = 200;

const MEMBER_FLAG_KEY = "ai-job-assistant-is-member";
const FREE_USAGE_KEY = "ai-job-assistant-usage-free";
const MEMBER_USAGE_KEY = "ai-job-assistant-usage-member";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function safeLocalStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isMemberActive(): boolean {
  const ls = safeLocalStorage();
  if (!ls) return false;
  return ls.getItem(MEMBER_FLAG_KEY) === "1";
}

export function setMemberActive(active: boolean) {
  const ls = safeLocalStorage();
  if (!ls) return;
  if (active) ls.setItem(MEMBER_FLAG_KEY, "1");
  else ls.removeItem(MEMBER_FLAG_KEY);
}

export type UsageState = {
  used: number;
  limit: number;
  remaining: number;
  isMember: boolean;
  date: string;
};

export function getUsageState(): UsageState {
  const isMember = isMemberActive();
  const limit = isMember ? MEMBER_DAILY_LIMIT : FREE_DAILY_LIMIT;
  let used = 0;
  const ls = safeLocalStorage();
  if (ls) {
    const raw = ls.getItem(isMember ? MEMBER_USAGE_KEY : FREE_USAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { date: string; used: number };
        if (parsed.date === todayKey()) used = parsed.used;
      } catch {
        used = 0;
      }
    }
  }
  return { used, limit, remaining: Math.max(0, limit - used), isMember, date: todayKey() };
}

export class UsageLimitError extends Error {
  state: UsageState;
  constructor(state: UsageState) {
    super("已达今日 AI 分析次数上限");
    this.name = "UsageLimitError";
    this.state = state;
  }
}

/**
 * 记录一次 AI 调用并校验额度。
 * - 达到上限时抛出 UsageLimitError（页面应捕获并提示升级/明日恢复）。
 * - 任何本地存储异常都会被吞掉，不会影响 AI 主流程（fail-open）。
 */
export function recordUsage(): UsageState {
  const isMember = isMemberActive();
  const state = getUsageState();
  if (state.remaining <= 0) {
    throw new UsageLimitError(state);
  }
  const ls = safeLocalStorage();
  if (ls) {
    const key = isMember ? MEMBER_USAGE_KEY : FREE_USAGE_KEY;
    ls.setItem(key, JSON.stringify({ date: todayKey(), used: state.used + 1 }));
  }
  return getUsageState();
}
