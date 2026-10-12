"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isCloudConfigured } from "@/lib/cloudClient";
import {
  clearLicense,
  getActiveCode,
  getLicenseInfo,
  saveLicense,
  validateLicense,
  type LicenseInfo,
} from "@/lib/licenseClient";

interface LicenseContextValue {
  code: string | null;
  info: LicenseInfo | null;
  needsActivation: boolean;
  activate: (code: string) => Promise<void>;
  reset: () => void;
}

const LicenseContext = createContext<LicenseContextValue | null>(null);

export function useLicense(): LicenseContextValue {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error("useLicense must be used within LicenseGate");
  return ctx;
}

// 这些页面不需要激活码即可访问
const PUBLIC_PATHS = ["/admin", "/privacy", "/terms"];

export function LicenseGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const skip = PUBLIC_PATHS.includes(pathname);
  const [code, setCode] = useState<string | null>(null);
  const [info, setInfo] = useState<LicenseInfo | null>(null);
  const [needsActivation, setNeedsActivation] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (skip || !isCloudConfigured) {
      setNeedsActivation(false);
      return;
    }
    const existingCode = getActiveCode();
    if (existingCode) {
      setCode(existingCode);
      setInfo(getLicenseInfo());
      setNeedsActivation(false);
    } else {
      setNeedsActivation(true);
    }
    const onInvalid = () => {
      setCode(null);
      setInfo(null);
      setNeedsActivation(true);
    };
    window.addEventListener("license-invalid", onInvalid);
    return () => window.removeEventListener("license-invalid", onInvalid);
  }, [skip]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function activate(inputCode: string) {
    const res = await validateLicense(inputCode.trim());
    if (!res.ok) {
      throw new Error(
        res.reason === "invalid"
          ? "激活码无效，请检查后重新输入。"
          : res.reason === "inactive"
            ? "该激活码已停用，请联系卖家。"
            : res.reason === "quota_exceeded"
              ? "该激活码额度已用完，请加购或联系卖家。"
              : "激活码校验失败，请重试。",
      );
    }
    const newInfo: LicenseInfo = { used: res.used ?? 0, quota: res.quota ?? 0 };
    saveLicense(inputCode.trim(), newInfo);
    setCode(inputCode.trim());
    setInfo(newInfo);
    setNeedsActivation(false);
  }

  function reset() {
    clearLicense();
    setCode(null);
    setInfo(null);
    setNeedsActivation(true);
  }

  return (
    <LicenseContext.Provider value={{ code, info, needsActivation, activate, reset }}>
      {children}
      {needsActivation ? <ActivationModal /> : null}
    </LicenseContext.Provider>
  );
}

function ActivationModal() {
  const { activate } = useLicense();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!value.trim()) {
      setError("请输入激活码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await activate(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "激活失败，请重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white">
            AI
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">激活你的求职助手</h2>
            <p className="text-xs text-slate-500">输入卖家提供的激活码即可使用全部 AI 功能</p>
          </div>
        </div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="例如 A1B2C3D4E5F6"
          autoFocus
          className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm tracking-wider text-slate-800 outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? "校验中..." : "激活并进入"}
        </button>
        <p className="mt-3 text-center text-xs leading-5 text-slate-400">
          激活码由卖家发放，每个码含固定 AI 调用次数。遇到问题请联系卖家。
        </p>
      </div>
    </div>
  );
}
