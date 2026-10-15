"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface TourStep {
  /** 该步目标元素所在的页面路径 */
  path: string;
  /** 目标元素（data-tour 选择器），缺省则居中显示卡片（无聚光） */
  selector?: string;
  title: string;
  desc: string;
  /** 目标暂时不存在时（如 AI 分析中结果未出），气泡居中显示等待提示 */
  waitIfMissing?: boolean;
  /** 点击高亮元素是否自动进入下一步（默认 true；纯查看型步骤设 false，避免抢步） */
  advanceOnClick?: boolean;
  /** 气泡内附卖家联系二维码 */
  qr?: boolean;
}

// 全流程跨页面引导：每一步建立在上一步完成的基础上，点击高亮元素真实操作后自动往下走
const STEPS: TourStep[] = [
  // —— 简历诊断 ——
  {
    path: "/",
    selector: "[data-tour='resume-cta']",
    title: "第一步：导入你的简历",
    desc: "点击这个按钮进入「简历诊断」页，跟着引导上传你的简历。",
  },
  {
    path: "/resume-diagnosis",
    selector: "[data-tour='resume-upload']",
    title: "在这里上传你的简历",
    desc: "点击上传或拖拽文件进来（支持 TXT / MD / PDF / DOCX），也可以在下方直接粘贴简历文本。放心上传：简历只保存在你自己的浏览器本地，不会公开、不会外泄给任何人；AI 仅用内容生成分析，用完即走。",
  },
  {
    path: "/resume-diagnosis",
    selector: "[data-tour='start-analyze']",
    title: "上传完就点「开始分析」",
    desc: "AI 会读取简历并生成诊断报告。分析需要一点时间（通常 20~60 秒，内容多会更久），期间可以切走页面，结果会自动保存在本地，回来不丢。",
  },
  {
    path: "/resume-diagnosis",
    selector: "[data-tour='result-section']",
    waitIfMissing: true,
    advanceOnClick: false,
    title: "下滑查看你的分析结果",
    desc: "分析完成后，往下滚动查看：候选人画像、简历优劣势，以及按「主推 / 拓展 / 冲刺 / 不建议」分类的推荐岗位方向。",
  },
  {
    path: "/resume-diagnosis",
    selector: "[data-tour='nav-/job-matching']",
    title: "下一步：匹配目标岗位",
    desc: "简历诊断完成后，点击左侧「岗位匹配」，开始分析你和目标岗位的匹配度。",
  },
  // —— 岗位匹配 ——
  {
    path: "/job-matching",
    selector: "[data-tour='jd-import-json']",
    advanceOnClick: false,
    qr: true,
    title: "把岗位 JD 粘贴到这里",
    desc: "在招聘网站的岗位页，用配套的浏览器插件一键复制岗位信息，粘贴到这个框里（手动复制 JD 文本粘贴也可以）。还没装插件或需要帮忙？微信扫码联系我。",
  },
  {
    path: "/job-matching",
    selector: "[data-tour='jd-import-fill']",
    title: "点「导入并填充 JD」",
    desc: "粘贴后点这个按钮，右边会立即显示对应的岗位信息（岗位 / 公司 / 城市 / 薪资），确认导入是否正确。",
  },
  {
    path: "/job-matching",
    selector: "[data-tour='jd-source']",
    advanceOnClick: false,
    title: "往下滑，内容已自动填充",
    desc: "简历和岗位 JD 都已自动填好（简历用的就是你刚才诊断过的那份），确认无误即可。也可以在这里手动修改补充。",
  },
  {
    path: "/job-matching",
    selector: "[data-tour='jd-start-analyze']",
    title: "点「开始匹配分析」",
    desc: "AI 会分析简历和 JD 的匹配度、匹配点、缺失点和简历修改建议。大约需要 1~2 分钟，请耐心等待，切走页面结果也不会丢。",
  },
  {
    path: "/job-matching",
    selector: "[data-tour='jd-result']",
    waitIfMissing: true,
    advanceOnClick: false,
    title: "下滑查看匹配结果",
    desc: "分析完成后，往下滚动查看：匹配度评分、匹配点、缺失点、简历修改建议和投递建议。",
  },
  {
    path: "/job-matching",
    selector: "[data-tour='jd-to-pitch']",
    title: "下一步：生成投递话术",
    desc: "结果看完，点这个按钮带着简历和 JD 直接进入「投递话术生成」。",
  },
  // —— 投递话术 ——
  {
    path: "/pitch-generator",
    selector: "[data-tour='pitch-generate']",
    title: "点「生成投递话术」",
    desc: "AI 会生成 4 种风格的投递话术（专业简洁 / 真诚求职 / 应届生解释 / 高匹配强调），需要一点时间，请耐心等待。",
  },
  {
    path: "/pitch-generator",
    selector: "[data-tour='pitch-result']",
    waitIfMissing: true,
    advanceOnClick: false,
    title: "下滑查看生成结果",
    desc: "生成后往下滚动：每条话术右上角都有「复制」按钮，点一下就能直接粘贴到 Boss 直聘、私信或邮件里使用。",
  },
  {
    path: "/pitch-generator",
    selector: "[data-tour='nav-/applications']",
    title: "顺手记录这次投递",
    desc: "话术复制投递后，点击左侧「投递管理」，把这次投递记下来，避免投完就忘。",
  },
  // —— 投递管理 ——
  {
    path: "/applications",
    selector: "[data-tour='application-form']",
    advanceOnClick: false,
    title: "手动填写投递记录",
    desc: "在「新增投递记录」里填上公司和岗位即可保存，还能跟踪回复、面试进展（自动记录功能后续会上线）。",
  },
  {
    path: "/applications",
    selector: "[data-tour='nav-/weekly-plan']",
    title: "最后：生成一周投递计划",
    desc: "点左侧「一周计划」，让 AI 根据你的简历和目标岗位，排好未来 7 天每天要做的事。",
  },
  // —— 一周计划 ——
  {
    path: "/weekly-plan",
    selector: "[data-tour='weekly-generate']",
    title: "点「生成 7 天计划」",
    desc: "候选人画像会自动同步你的简历；也可以先勾选本周目标岗位方向，再点这个按钮生成。",
  },
  {
    path: "/weekly-plan",
    selector: "[data-tour='weekly-plan-result']",
    waitIfMissing: true,
    advanceOnClick: false,
    title: "勾选完成，进度自动更新",
    desc: "生成后往下滚动：每一天的任务都可以勾选完成，右上角的完成进度会自动更新，照着做就行。",
  },
  // —— 收尾：引导入口 ——
  {
    path: "/weekly-plan",
    title: "引导结束，随时可以重看",
    desc: "忘了怎么用？拉到任意页面最底部，点「新手引导」就能重新打开这份引导。祝你求职顺利！",
  },
];

// 引导进行到的步骤序号持久化键（刷新可续）。手动重开时应清掉它，从第 1 步重新开始。
export const TOUR_STEP_KEY = "ai-job-assistant-tour-step";
const STEP_KEY = TOUR_STEP_KEY;

export function ProductTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const rawPath = usePathname();
  // 静态导出会带末尾斜杠（如 /resume-diagnosis/），统一去掉再和步骤比对
  const pathname = rawPath ? (rawPath.length > 1 && rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath) : "/";
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // 打开时恢复上次进行到的步骤（刷新后也能续上）
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    const saved = Number(window.localStorage.getItem(STEP_KEY) || "0");
    if (Number.isInteger(saved) && saved >= 0 && saved < STEPS.length) {
      setCurrent(saved);
    }
  }, [open]);

  const applyStep = useCallback((index: number) => {
    setCurrent(index);
    if (typeof window !== "undefined") window.localStorage.setItem(STEP_KEY, String(index));
  }, []);

  // 只测量高亮位置，不强制滚动。此前每次滚动都 scrollIntoView 会把页面"拽回去"，
  // 用户根本无法自由下滑（滚动即被弹回）。自由滚动时只跟随更新高亮框位置。
  const measure = useCallback(() => {
    const step = STEPS[current];
    const el = step?.selector ? document.querySelector(step.selector) : null;
    setRect(el ? el.getBoundingClientRect() : null);
  }, [current]);

  // 进入某一步时：平滑滚到目标元素（只此一次），滚动落定前后各测一次高亮位置
  useEffect(() => {
    if (!open) return;
    const step = STEPS[current];
    if (!step?.selector) return;
    const el = document.querySelector(step.selector);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t1 = setTimeout(measure, 150);
    const t2 = setTimeout(measure, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, current, pathname, measure]);

  // 滚动 / 缩放时重新测量，保证高亮框跟随
  useEffect(() => {
    if (!open) return;
    const onScroll = () => measure();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, measure]);

  // 等待模式下（目标暂时不存在）定时重测：目标一渲染出来，带用户滚过去一次并高亮。
  // 适用于所有 pending 步骤（不只 waitIfMissing）：否则目标缺席时引导会整个隐形。
  useEffect(() => {
    const step = STEPS[current];
    if (!open || rect || !step?.selector) return;
    const selector = step.selector;
    const t = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        // 只在"目标刚出现"这一刻滚一次（rect 设置后本 effect 即停），不影响用户之后的自由滚动
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setRect(el.getBoundingClientRect());
      }
    }, 800);
    return () => clearInterval(t);
  }, [open, rect, current]);

  // 用户点击了高亮的真实元素 = 完成了这一步，自动进入下一步（查看型步骤除外）
  useEffect(() => {
    if (!open) return;
    const step = STEPS[current];
    if (!step?.selector || step.advanceOnClick === false) return;
    const el = document.querySelector(step.selector);
    if (!el) return;
    const onAdvance = () => {
      if (current < STEPS.length - 1) applyStep(current + 1);
    };
    el.addEventListener("click", onAdvance, true);
    return () => el.removeEventListener("click", onAdvance, true);
  }, [open, current, pathname, rect, applyStep]);

  // 跨页面：用户点了高亮链接跳转后，若下一步匹配当前页面则自动跟过去
  useEffect(() => {
    if (!open) return;
    const step = STEPS[current];
    if (step && step.path !== pathname) {
      const nxt = STEPS[current + 1];
      if (nxt && nxt.path === pathname) applyStep(current + 1);
    }
  }, [pathname, open, current, applyStep]);

  function finish() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ai-job-assistant-onboarded", "1");
      window.localStorage.removeItem(STEP_KEY);
    }
    setCurrent(0);
    onClose();
  }

  if (!open) return null;

  const step = STEPS[current];
  if (!step) {
    finish();
    return null;
  }

  const onRightPage = step.path === pathname;
  const isLast = current === STEPS.length - 1;

  // 不在目标页面：引导挂起（不渲染），等用户回到对应页面自动继续
  if (!onRightPage) return null;

  const centered = !step.selector; // 无目标元素：居中卡片（收尾说明）
  const pending = Boolean(step.selector) && !rect;
  // 目标还没出现（AI 结果未出/前面的操作没做）：显示等待气泡，绝不隐形消失

  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  const pad = 8;
  const tw = Math.min(340, vw - 20);

  let top = vh / 2 - 90;
  let left = Math.max(12, Math.min(vw / 2 - tw / 2, vw - tw - 12));
  if (!centered && rect) {
    if (rect.bottom + 16 + 220 > vh) {
      top = Math.max(rect.top - 16 - 220, 12);
    } else {
      top = rect.bottom + 16;
    }
    left = Math.max(12, Math.min(rect.left, vw - tw - 12));
  }

  function next() {
    if (isLast) {
      finish();
      return;
    }
    const nxt = STEPS[current + 1];
    if (nxt && nxt.path !== pathname) {
      // 下一步在其他页面：直接跳过去，到达后自动继续
      applyStep(current + 1);
      router.push(nxt.path);
    } else {
      applyStep(current + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-[70]" style={{ pointerEvents: "none" }}>
      {!centered && rect ? (
        <div
          className="absolute rounded-2xl"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.55)",
            border: "2px solid #6366f1",
            transition: "all 0.2s ease",
          }}
        />
      ) : null}

      <div
        className="absolute rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
        style={{ top, left, width: tw, pointerEvents: "auto" }}
      >
        <p className="text-xs font-semibold text-indigo-600">
          新手引导 {current + 1}/{STEPS.length}
        </p>
        <h3 className="mt-1 text-base font-bold text-slate-950">{step.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{step.desc}</p>
        {step.qr ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img src="/contact-qr.png" alt="联系二维码" className="h-full w-full object-cover" />
            </div>
            <p className="text-xs leading-5 text-slate-500">
              微信扫码联系卖家
              <br />
              （获取插件 / 使用求助）
            </p>
          </div>
        ) : null}
        {pending ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-600">
            这一步的按钮/内容还没出现——通常是在等 AI 出结果。出来后会自动带你过去看；等不及也可以点「下一步」先跳过。
          </p>
        ) : null}
        {!isLast ? (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
            没耐心也没关系：直接点右下角「下一步」就能跳过这步；想全部结束就点「跳过引导」。
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between">
          <button onClick={finish} className="text-xs text-slate-400 hover:text-slate-600">
            跳过引导
          </button>
          <div className="flex gap-2">
            {current > 0 ? (
              <button
                onClick={() => applyStep(current - 1)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                上一步
              </button>
            ) : null}
            <button
              onClick={next}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {isLast ? "完成" : "下一步"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
