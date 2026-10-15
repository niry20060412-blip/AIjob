import { createWorkBuddyCloud } from "@tencent-ai/workbuddy-cloud-sdk";

const endpoint = process.env.NEXT_PUBLIC_CLOUD_ENDPOINT;
const publishableKey = process.env.NEXT_PUBLIC_CLOUD_PUBLISHABLE_KEY;
const oauthRelayBaseUrl = process.env.NEXT_PUBLIC_CLOUD_OAUTH_RELAY;

/**
 * 是否已配置真实 AI 云服务。
 * - 未配置时，所有 AI 分析自动回退到本地智能规则，保证开箱即用。
 * - 配置方式见项目根目录 `.env.local.example`。
 *
 * endpoint 可省略：SDK 会自动以"当前网页域名"为基址（配合同域反向代理使用，
 * 便于把静态站点部署到任意自有域名，如 Cloudflare Pages + Worker 转发）。
 */
export const isCloudConfigured = Boolean(publishableKey);

type CloudClient = ReturnType<typeof createWorkBuddyCloud>;

export const cloud: CloudClient | null = isCloudConfigured
  ? createWorkBuddyCloud({
      ...(endpoint ? { endpoint } : {}),
      publishableKey: publishableKey as string,
      ...(oauthRelayBaseUrl ? { oauthRelayBaseUrl } : {}),
    })
  : null;
