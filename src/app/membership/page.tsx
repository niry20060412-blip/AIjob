"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, PageHeader } from "@/components/Ui";
import { useAuth } from "@/lib/auth";
import { getUsageState, isMemberActive, setMemberActive, FREE_DAILY_LIMIT, MEMBER_DAILY_LIMIT, type UsageState } from "@/lib/usageLimit";

export default function MembershipPage() {
  const { user, loading } = useAuth();
  const [usage, setUsage] = useState<UsageState>({
    used: 0,
    limit: FREE_DAILY_LIMIT,
    remaining: FREE_DAILY_LIMIT,
    isMember: false,
    date: "",
  });
  const [member, setMember] = useState(false);

  useEffect(() => {
    window.setTimeout(() => {
      setUsage(getUsageState());
      setMember(isMemberActive());
    }, 0);
  }, []);

  function refresh() {
    setUsage(getUsageState());
    setMember(isMemberActive());
  }

  const tiers = [
    {
      name: "免费版",
      price: "¥0",
      period: "永久",
      highlight: false,
      features: [
        `每日 ${FREE_DAILY_LIMIT} 次 AI 分析`,
        "简历诊断 / 岗位匹配 / 话术生成 / 一周计划",
        "本地数据保存",
        "浏览器插件采集岗位",
      ],
    },
    {
      name: "会员版",
      price: "¥29",
      period: "每月",
      highlight: true,
      features: [
        `每日 ${MEMBER_DAILY_LIMIT} 次 AI 分析`,
        "以上全部功能",
        "云端账户同步（多设备）",
        "优先模型与更快响应",
        "专属会员客服",
      ],
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="会员中心"
        title="升级会员，解锁更高额度"
        description="会员用于覆盖真实 AI 模型调用成本，并提供云端同步与优先体验。免费版已可完整体验全部功能。"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">当前方案</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{member ? "会员版" : "免费版"}</p>
          <Badge tone={member ? "green" : "slate"}>{member ? "已激活" : "未激活"}</Badge>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">今日已用 / 上限</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {usage.used} <span className="text-base font-normal text-slate-400">/ {usage.limit}</span>
          </p>
          <p className="mt-2 text-xs text-slate-400">剩余 {usage.remaining} 次，每日 0 点重置</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">登录状态</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            {loading ? "检查中" : user ? (user.email ?? user.phone ?? "已登录") : "未登录"}
          </p>
          {!user && (
            <Link href="/login" className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline">
              去登录
            </Link>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-3xl border p-6 ${
              tier.highlight ? "border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-lg shadow-indigo-100" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">{tier.name}</h3>
              {tier.highlight && <Badge tone="green">推荐</Badge>}
            </div>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-3xl font-bold text-slate-950">{tier.price}</span>
              <span className="mb-1 text-sm text-slate-500">/ {tier.period}</span>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-indigo-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Card className="mt-6">
        <h3 className="text-lg font-bold text-slate-950">开通会员</h3>
        {member ? (
          <div className="mt-4">
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">你已是会员，正在享受会员额度。</p>
            <button
              type="button"
              onClick={() => {
                setMemberActive(false);
                refresh();
              }}
              className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              演示：取消会员（恢复免费额度）
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              当前为<strong>演示模式</strong>：点击下方按钮可在本机激活会员额度，用于体验完整流程。正式版本将接入支付（微信 / 支付宝），支付成功后自动开通，无需手动操作。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setMemberActive(true);
                  refresh();
                }}
                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5"
              >
                演示：本机激活会员
              </button>
              <Link
                href="/login"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                登录后开通
              </Link>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-6">
        <h3 className="text-lg font-bold text-slate-950">关于用量与计费</h3>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
          <li>免费版每日 AI 分析次数可在「会员中心」实时查看，到达上限后次日自动恢复。</li>
          <li>会员按自然月计费，有效期内享受对应额度；正式支付接入后支持续费与退款规则说明。</li>
          <li>我们仅通过具备资质的第三方支付机构收款，不存储你的支付凭据。</li>
        </ul>
        <p className="mt-4 text-xs text-slate-400">
          需要企业批量授权、私有化部署或定制功能？可通过产品反馈渠道联系我们。
        </p>
      </Card>
    </AppShell>
  );
}
