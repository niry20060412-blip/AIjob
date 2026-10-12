import { createWorkBuddyCloud } from "@tencent-ai/workbuddy-cloud-sdk";

const publicConfig = {
  resourceId: "wbcs_3eCdz1KI38WCxaELYg0HW9",
  endpoint: "https://ai-job-assistant-33282.app.workbuddy.host",
  oauthRelayBaseUrl: "https://www.workbuddy.cn/v2/as/genie-baas/oauth",
  publishableKey: "wbpk_Z4JEPldKcVwcaQZF6nNoXJ_wNJiS7OJzhHYrggO1VAiIcgJtBn8yfOT",
};

export const cloud = createWorkBuddyCloud({
  endpoint: publicConfig.endpoint,
  oauthRelayBaseUrl: publicConfig.oauthRelayBaseUrl,
  publishableKey: publicConfig.publishableKey,
});
