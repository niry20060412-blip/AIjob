import { cloud } from "@/lib/cloudClient";

export type AiSource = "real-ai" | "local-fallback";

export class AiJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiJsonError";
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "AI 调用失败，请稍后重试。";
}

export function normalizeAiError(error: unknown) {
  const maybeError = error as { error?: { code?: string | null; message?: string }; requestId?: string; retryAfterMs?: number };
  const code = maybeError?.error?.code || "";
  const requestId = maybeError?.requestId;

  if (code.startsWith("quota_")) {
    return `AI 用量暂时不可用或已达到限制，请稍后再试。${requestId ? `请求编号：${requestId}` : ""}`;
  }

  if (code.startsWith("auth_")) {
    return `当前访问域名未通过云服务校验，请重新发布正式版本后再试。${requestId ? `请求编号：${requestId}` : ""}`;
  }

  if (code.startsWith("gateway_") || code.startsWith("model_")) {
    return `模型服务暂时繁忙，请稍后重试。${requestId ? `请求编号：${requestId}` : ""}`;
  }

  if (code.startsWith("request_")) {
    return `AI 请求参数异常，请刷新页面后重试。${requestId ? `请求编号：${requestId}` : ""}`;
  }

  return `${maybeError?.error?.message || getErrorMessage(error)}${requestId ? ` 请求编号：${requestId}` : ""}`;
}

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

export async function callAiJson<T>({
  systemPrompt,
  userPrompt,
  temperature = 0.4,
}: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}): Promise<T> {
  const models = await cloud.llm.models.list();
  const model = models.find((item) => item.disabled !== true);

  if (!model) {
    throw new Error("当前没有可用 AI 模型，请稍后再试。 ");
  }

  let answer = "";

  for await (const chunk of cloud.llm.chat.completions.create({
    model: model.id,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: true,
    response_format: { type: "json_object" },
    temperature,
  })) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) answer += delta;
  }

  try {
    return JSON.parse(stripJsonFence(answer)) as T;
  } catch {
    throw new AiJsonError("AI 返回格式无法解析，请重新生成一次。 ");
  }
}
