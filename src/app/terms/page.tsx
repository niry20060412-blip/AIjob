"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, PageHeader } from "@/components/Ui";

export default function TermsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="法律文件"
        title="用户协议"
        description="本协议约定你使用「AI 精准求职投递助手」的权利、义务与责任边界。使用即视为同意本协议。"
      />

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-bold text-slate-950">1. 服务性质</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            本产品是一款<strong>辅助决策工具</strong>，围绕用户自行导入的简历与岗位信息，提供诊断、匹配、话术生成与计划排布。它帮助你更高效地做求职决策，<strong>不替代</strong>你本人对投递对象、简历真实性与求职结果的最终判断。
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">2. AI 生成内容说明</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>系统输出由人工智能模型生成，可能存在不准确、不完整或过时的情况，<strong>仅供参考</strong>。</li>
            <li>AI 生成内容已在界面标注「由 AI 生成」，请你结合实际核验后使用。</li>
            <li>我们不对基于本工具输出所做的任何求职决策及其结果作出保证或承诺。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">3. 用户承诺</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>你提供的简历、岗位等信息应<strong>真实、合法</strong>，不得含有虚假经历或伪造材料。</li>
            <li>本工具用于<strong>精准、合规</strong>的求职投递，不得用于骚扰招聘方、批量滥用或违反招聘平台规则的行为。</li>
            <li>你对自己的简历真实性、投递行为与求职结果负完全责任。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">4. 产品形态与费用</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>本产品为本地优先的求职辅助工具，不要求注册、不提供订阅会员，本地分析功能不收费。</li>
            <li>若你自行配置第三方 AI 服务 key 以启用真实 AI 分析，相关费用由该服务商按其与你的约定收取，与本工具无关。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">5. 免责声明</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>岗位匹配度、企业核查结果基于公开信息与模型推断，<strong>不构成</strong>对任何企业的资质背书或投资/求职建议。</li>
            <li>因网络、第三方服务（含大模型、支付机构）中断或故障导致的不可用，我们在力所能及范围内补救，但不承担由此产生的间接损失。</li>
            <li>在法律允许范围内，本产品对使用本服务产生的直接或间接损失不承担责任。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">6. 协议变更</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            我们可能根据产品与法规变化修订本协议，修订后将在产品内公示。你继续使用即视为接受修订后的协议。
          </p>
        </Card>

        <p className="text-xs text-slate-400">
          最后更新：2026-10-12。
        </p>

        <div>
          <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">返回首页</Link>
        </div>
      </div>
    </AppShell>
  );
}
