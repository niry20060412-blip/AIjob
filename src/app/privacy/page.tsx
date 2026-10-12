"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, PageHeader } from "@/components/Ui";

export default function PrivacyPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="法律文件"
        title="隐私政策"
        description="本政策说明「AI 精准求职投递助手」如何收集、使用、存储与保护你的个人信息。请在使用前仔细阅读。"
      />

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-bold text-slate-950">1. 我们收集的信息</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li><strong>你主动提供的内容：</strong>你上传或粘贴的简历文本、岗位 JD 文本，以及通过插件导入的招聘信息。</li>
            <li><strong>账号信息：</strong>你注册或登录时提供的邮箱（或手机号），用于身份认证与跨设备同步。</li>
            <li><strong>使用记录：</strong>为控制服务成本，我们会统计你的 AI 分析调用次数与会员状态（存储于你的浏览器或云端账户下）。</li>
            <li><strong>我们不会收集：</strong>你的银行/支付密码、身份证号等敏感财务与身份凭证；支付由第三方支付机构处理，我们不存储支付凭据。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">2. 信息如何使用</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>将你的简历与岗位信息发送给大模型，生成诊断、匹配、话术与计划等结果。</li>
            <li>在你的登录账户下保存简历、投递记录与计划，支持多设备访问。</li>
            <li>计算并展示你的功能使用额度与会员权益。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">3. 信息存储与保留</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>未登录时，数据仅保存在你当前浏览器本地（localStorage），不会上传服务器。</li>
            <li>登录后，简历、投递记录等会同步到你的云端账户，便于跨设备使用。</li>
            <li>你可随时在「投递管理 / 首页」清除本地记录；登录用户可通过退出账号或联系客服删除云端数据。</li>
            <li>我们采用传输加密与访问控制保护数据，但请理解互联网传输无法保证 100% 安全。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">4. 第三方与 AI 服务</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>AI 分析由已合规备案的大模型服务完成，你的输入会按模型服务商的隐私条款进行处理。</li>
            <li>支付环节由具备资质的第三方支付机构处理，我们仅接收支付结果通知。</li>
            <li>我们不会向无关第三方出售你的个人信息。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">5. 你的权利</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>访问、更正、删除你的个人信息；</li>
            <li>撤回同意、注销账号；</li>
            <li>就个人信息处理向我们提出询问或投诉。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">6. 联系我们</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            如对本政策有疑问，或需行使上述权利，可通过产品内「会员中心」页提供的联系方式与我们沟通。
          </p>
        </Card>

        <p className="text-xs text-slate-400">
          最后更新：2026-10-12。本政策可能随产品与法规更新而调整，重大变更会在产品内公告。
        </p>

        <div>
          <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">返回首页</Link>
        </div>
      </div>
    </AppShell>
  );
}
