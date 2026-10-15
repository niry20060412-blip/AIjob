"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { LicenseInfo } from "@/lib/licenseClient";
import {
  validateLicense,
  saveLicense,
  getActiveCode,
  getLicenseInfo,
  clearLicense,
} from "@/lib/licenseClient";
import { ProductTour, TOUR_STEP_KEY } from "@/components/ProductTour";

const ONBOARD_KEY = "ai-job-assistant-onboarded";

interface LicenseContextValue {
  code: string | null;
  info: LicenseInfo | null;
  needsActivation: boolean;
  activate: (code: string) => Promise<void>;
  reset: () => void;
  reopenGuide: () => void;
}

const LicenseContext = createContext<LicenseContextValue | null>(null);

export function useLicense(): LicenseContextValue {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error("useLicense must be used within LicenseGate");
  return ctx;
}

function reasonToMessage(reason?: string): string {
  switch (reason) {
    case "invalid":
      return "激活码无效，请检查后重新输入。";
    case "inactive":
      return "该激活码已停用，请联系卖家更换。";
    case "quota_exceeded":
      return "激活码额度已用完，请加购或联系卖家获取新码。";
    default:
      return "激活码校验失败，请重试或联系卖家。";
  }
}

export function LicenseGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // 卖家后台不走买家激活码门禁（后台自己免口令，与买家激活码无关）
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const [code, setCode] = useState<string | null>(null);
  const [info, setInfo] = useState<LicenseInfo | null>(null);
  const [needsActivation, setNeedsActivation] = useState(true);
  // mounted：客户端水合完成前，门禁一律不渲染，避免「已激活用户每次加载都先闪一下激活页」
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [startTour, setStartTour] = useState(false);
  // 每次手动重开自增，作为 ProductTour 的 key 强制重挂载 → 彻底从第 1 步开始
  const [tourNonce, setTourNonce] = useState(0);

  // 激活门禁期间锁住页面滚动，避免半透明遮罩后方内容被滑出来"透看"
  useEffect(() => {
    if (mounted && needsActivation && !isAdmin) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mounted, needsActivation, isAdmin]);

  function closeGuide() {
    if (typeof window !== "undefined") window.localStorage.setItem(ONBOARD_KEY, "1");
    setShowTour(false);
  }

  function reopenGuide() {
    // 手动重开 = 从头开始：清掉上次进行到的步骤，否则恢复到停在别的页面的步骤时
    // 引导会"隐形等待"回到那个页面，看起来就像点了没反应
    if (typeof window !== "undefined") window.localStorage.removeItem(TOUR_STEP_KEY);
    setTourNonce((n) => n + 1);
    if (pathname === "/") setShowTour(true);
    else router.push("/?tour=1");
  }

  // 每次挂载（首屏 / 客户端导航 / 整页刷新）都从 localStorage 重新判定激活状态。
  // 这样已激活用户无论怎么跳转都不会再弹激活页；未激活用户每次都会重新弹。
  useEffect(() => {
    const savedCode = getActiveCode();
    const savedInfo = getLicenseInfo();
    setCode(savedCode);
    setInfo(savedInfo);
    setNeedsActivation(!(savedCode && savedInfo));
    setMounted(true);
  }, []);

  // 用量扣减失败时（配额用尽 / 激活码失效）licenseClient 会清掉本地凭证并派发该事件，
  // 这里监听后重新弹出门禁，避免「已失效却还能继续用」的空窗。
  useEffect(() => {
    function onInvalid() {
      setCode(null);
      setInfo(null);
      setNeedsActivation(true);
    }
    window.addEventListener("license-invalid", onInvalid);
    return () => window.removeEventListener("license-invalid", onInvalid);
  }, []);

  // 从页脚「新手引导」带 ?tour=1 跳回首页时，自动开启引导。
  // 依赖 pathname：LicenseGate 挂在 layout 上不会随客户端跳转卸载，
  // 只有放进依赖才能在「非首页点页脚 → router.push('/?tour=1')」时重新触发。
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "1") {
      // 页脚手动重开：从头开始（清掉上次步骤，原因同 reopenGuide）
      window.localStorage.removeItem(TOUR_STEP_KEY);
      setTourNonce((n) => n + 1);
      setShowTour(true);
      // 消费掉参数，避免在同一会话内来回导航反复弹窗
      params.delete("tour");
      const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, [pathname]);

  // 在非首页完成激活后，回到首页再开启引导
  useEffect(() => {
    if (startTour && pathname === "/") {
      setShowTour(true);
      setStartTour(false);
    }
  }, [startTour, pathname]);

  async function activate(rawCode: string) {
    const trimmed = rawCode.trim();
    if (!trimmed) {
      setError("请输入激活码");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await validateLicense(trimmed);
      if (!res.ok) {
        setError(reasonToMessage(res.reason));
        return;
      }
      const newInfo: LicenseInfo = { used: res.used ?? 0, quota: res.quota ?? 0 };
      saveLicense(trimmed, newInfo);
      setCode(trimmed);
      setInfo(newInfo);
      setNeedsActivation(false);
      // 首次激活后，自动开启高亮引导（只引导一次）
      if (typeof window !== "undefined" && !window.localStorage.getItem(ONBOARD_KEY)) {
        window.localStorage.setItem(ONBOARD_KEY, "1");
        if (pathname === "/") setShowTour(true);
        else {
          setStartTour(true);
          router.push("/");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "激活失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    clearLicense();
    setCode(null);
    setInfo(null);
    setInput("");
    setError(null);
    setNeedsActivation(true);
  }

  return (
    <LicenseContext.Provider value={{ code, info, needsActivation, activate, reset, reopenGuide }}>
      {children}
      {showTour && !isAdmin ? <ProductTour key={tourNonce} open={showTour} onClose={closeGuide} /> : null}
      {mounted && needsActivation && !isAdmin ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-[#f7f8fc] px-4 py-8">
          <div className="my-auto w-[min(92vw,420px)] rounded-3xl bg-white p-7 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-950">激活你的求职助手</h2>
            <p className="mt-1 text-sm text-slate-500">请输入激活码以解锁全部 AI 功能。</p>
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) activate(input);
              }}
              placeholder="例如 A7CB0E74BED4"
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />
            {error ? <p className="mt-2 text-xs text-rose-500">{error}</p> : null}
            <button
              onClick={() => activate(input)}
              disabled={loading}
              className="mt-5 w-full rounded-2xl bg-indigo-600 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? "校验中…" : "激活并使用"}
            </button>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">需要使用时请联系：</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {qrFailed ? (
                    <div className="flex h-full w-full items-center justify-center text-center text-[10px] leading-3 text-slate-400">
                      卖家
                      <br />
                      二维码
                    </div>
                  ) : (
                    <img
                      src="/contact-qr.png"
                      alt="联系二维码"
                      className="h-full w-full object-cover"
                      onError={() => setQrFailed(true)}
                    />
                  )}
                </div>
                <p className="text-xs leading-5 text-slate-400">
                  微信扫码联系卖家
                  <br />
                  获取激活码 / 咨询使用
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </LicenseContext.Provider>
  );
}
