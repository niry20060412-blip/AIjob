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
        description="本政策说明「AI 精准求职投递助手」如何处理你的信息。本产品为本地优先工具，请在使用前仔细阅读。"
      />

      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-bold text-slate-950">1. 我们收集的信息</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li><strong>你主动提供的内容：</strong>你上传或粘贴的简历文本、岗位 JD 文本，以及通过插件导入的招聘信息。这些内容默认仅保存在你自己的浏览器本地。</li>
            <li><strong>我们不会收集账号信息：</strong>本产品不要求注册登录，因此不会收集邮箱、手机号等身份信息。</li>
            <li><strong>我们不会收集：</strong>银行/支付密码、身份证号等敏感财务与身份凭证。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">2. 信息如何使用</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>将你的简历与岗位信息发送给大模型（仅在你配置了 AI 服务 key 时），生成诊断、匹配、话术与计划等结果。</li>
            <li>未配置 AI 服务时，所有分析在本机完成，内容不会离开你的设备。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">3. 信息存储与保留</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>数据仅保存在你当前浏览器本地（localStorage），不会上传任何服务器。</li>
            <li>你可随时在「首页 / 投递管理」清除本地记录；清除后数据无法恢复。</li>
            <li>请理解浏览器本地存储可能被本机其他用户或清理工具访问，敏感简历信息请自行妥善保管。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">4. 第三方与 AI 服务</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>只有当你自行配置了 AI 服务 key，相关输入才会按该服务商的隐私条款发送给对应模型服务。</li>
            <li>我们不会向任何第三方出售你的个人信息。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">5. 你的权利</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
            <li>随时清除保存在本地的全部信息；</li>
            <li>就个人信息处理提出询问。</li>
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-slate-950">6. 联系我们</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            如对本政策有疑问，可通过产品说明文档中提供的联系方式与我们沟通。
          </p>
        </Card>

        <p className="text-xs text-slate-400">
          最后更新：2026-10-12。本政策可能随产品与法规更新而调整。
        </p>

        <div>
          <Link href="/" className="text-sm font-semibold text-indigo-600 hover:underline">返回首页</Link>
        </div>
      </div>
    </AppShell>
  );
}
