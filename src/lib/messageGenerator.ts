import { callAiJson, AiNotConfiguredError } from "@/lib/aiClient";

export type ApplicationMessage = {
  style: "专业简洁型" | "真诚求职型" | "应届生/转行解释型" | "高匹配强调型";
  description: string;
  content: string;
};

export type ApplicationMessagesResult = {
  jobTitle: string;
  highlights: string[];
  messages: ApplicationMessage[];
  source: "real-ai" | "local-mock";
};

const capabilityRules = [
  { label: "AI 应用", keywords: ["AI", "人工智能", "大模型", "AIGC", "LLM", "RAG", "智能体", "提示词"] },
  { label: "产品规划", keywords: ["产品", "需求", "PRD", "原型", "迭代", "路线图"] },
  { label: "数据分析", keywords: ["数据", "SQL", "指标", "A/B", "AB", "转化", "留存", "看板"] },
  { label: "B 端 SaaS", keywords: ["B端", "SaaS", "企业", "客户", "后台", "协作工具", "CRM"] },
  { label: "用户增长", keywords: ["增长", "运营", "获客", "投放", "转化", "活动", "社群"] },
  { label: "体验设计", keywords: ["体验", "交互", "Figma", "用户研究", "访谈", "可用性"] },
  { label: "项目推进", keywords: ["跨团队", "协作", "推动", "上线", "落地", "研发", "设计"] },
];

function includesAny(text: string, keywords: string[]) {
  const lowerText = text.toLowerCase();
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()));
}

function extractJobTitle(jdText: string) {
  const lines = jdText
    .split(/\n|。|；|;/)
    .map((line) => line.trim())
    .filter(Boolean);
  const titleLine = lines.find((line) => /岗位|职位|招聘|title|position/i.test(line));
  const rawTitle = titleLine || lines[0] || "目标岗位";
  const cleaned = rawTitle
    .replace(/岗位名称|职位名称|招聘岗位|岗位|职位|title|position|[:：]/gi, "")
    .replace(/我们正在寻找|诚聘|招聘|急招/g, "")
    .trim();
  return cleaned.length > 2 && cleaned.length < 28 ? cleaned : "目标岗位";
}

function extractHighlights(resumeText: string, jdText: string) {
  const resume = resumeText.trim();
  const jd = jdText.trim();
  const matched = capabilityRules
    .filter((rule) => includesAny(resume, rule.keywords) && includesAny(jd, rule.keywords))
    .map((rule) => rule.label);

  const quantMatches = resume.match(/[^。；\n]*(\d+%|提升|增长|降低|转化|留存|上线|落地)[^。；\n]*/g) || [];
  const quantHighlight = quantMatches[0]?.trim();
  const baseHighlights = matched.length ? matched : ["需求理解", "项目推进", "快速学习"];

  return Array.from(new Set([...baseHighlights.slice(0, 3), ...(quantHighlight ? [quantHighlight] : [])])).slice(0, 4);
}

function joinHighlights(highlights: string[]) {
  if (highlights.length <= 1) return highlights[0] || "相关经历";
  return `${highlights.slice(0, -1).join("、")}和${highlights[highlights.length - 1]}`;
}

export function generateApplicationMessages(resumeText: string, jdText: string): ApplicationMessagesResult {
  if (!resumeText.trim() || !jdText.trim()) {
    throw new Error("请先填写简历和岗位 JD，再生成投递话术。");
  }
  const jobTitle = extractJobTitle(jdText);
  const highlights = extractHighlights(resumeText, jdText);
  const highlightText = joinHighlights(highlights.slice(0, 3));
  const resultHighlight = highlights.find((item) => /\d+%|提升|增长|降低|转化|留存|上线|落地/.test(item));
  const resultSentence = resultHighlight ? `其中一个项目里，${resultHighlight.replace(/^[，。；\s]+/, "")}。` : "我也比较重视把需求拆成可落地的方案，并持续复盘实际效果。";

  return {
    jobTitle,
    highlights,
    messages: [
      {
        style: "专业简洁型",
        description: "适合 Boss 直聘、邮件开场或较正式的投递场景。",
        content: `您好，我关注到贵团队正在招聘${jobTitle}。我的经历和岗位中提到的${highlightText}比较相关，过去也参与过从需求分析、方案设计到上线复盘的完整流程。${resultSentence}如果方便的话，希望能进一步沟通这个岗位的具体要求，我也可以补充更详细的项目材料。`,
      },
      {
        style: "真诚求职型",
        description: "语气更自然，适合想降低距离感的私信沟通。",
        content: `您好，我认真看了这个${jobTitle}岗位，感觉它不是单纯执行需求，而是需要理解业务场景、判断优先级并推动结果，这点和我之前的经历比较接近。我做过的内容里，${highlightText}是比较能拿出来展开聊的部分。也想坦诚说，我不是想海投，而是觉得这个方向和我的积累有交集，所以想争取一次沟通机会。`,
      },
      {
        style: "应届生/转行解释型",
        description: "适合经历不完全匹配、应届生、转行或需要解释迁移能力的场景。",
        content: `您好，我目前和${jobTitle}岗位的要求不是每一项都完全一一对应，但我过往经历中有几块能力可以迁移：${highlightText}。我理解这个岗位核心不是堆关键词，而是能快速理解用户和业务问题，再把问题推进成可落地的产品方案。若有机会，我希望用具体项目来说明我的学习速度、执行力和对这个方向的长期兴趣。`,
      },
      {
        style: "高匹配强调型",
        description: "适合匹配度较高、希望突出优势并推动面试的场景。",
        content: `您好，这个${jobTitle}岗位和我的经历匹配度比较高，尤其是${highlightText}这几方面。${resultSentence}我比较有信心能快速理解岗位当前的业务问题，并在产品方案、跨团队推进和效果复盘上直接贡献。如果团队正在筛选候选人，我很希望能进入下一轮沟通，也可以先发一版针对该 JD 调整后的简历。`,
      },
    ],
    source: "local-mock",
  };
}

export async function generateApplicationMessagesWithAi(resumeText: string, jdText: string): Promise<ApplicationMessagesResult> {
  const resume = resumeText.trim();
  const jd = jdText.trim();
  if (!resume || !jd) {
    throw new Error("请先填写简历和岗位 JD，再生成投递话术。");
  }

  try {
    const result = await callAiJson<Omit<ApplicationMessagesResult, "source">>({
      action: "pitch",
      systemPrompt: "你是专业但克制的中文求职沟通顾问。只基于用户提供的简历和 JD 生成话术，不夸大、不编造。输出必须是合法 JSON。",
      userPrompt: `请根据简历和 JD 生成投递话术，输出 JSON，字段必须严格符合：{\"jobTitle\":string,\"highlights\":string[],\"messages\":ApplicationMessage[]}。ApplicationMessage 为 {\"style\":\"专业简洁型\"|\"真诚求职型\"|\"应届生/转行解释型\"|\"高匹配强调型\",\"description\":string,\"content\":string}。必须生成 4 条 messages，每条 80-160 字，适合真实求职沟通，不能承诺不存在的经历。\n简历：\n${resume}\n\n岗位 JD：\n${jd}`,
      temperature: 0.7,
    });

    return {
      ...result,
      source: "real-ai",
    };
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return generateApplicationMessages(resumeText, jdText);
    }
    throw error;
  }
}
