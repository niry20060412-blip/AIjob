import { callAiJson } from "@/lib/aiClient";

export type JobMatchResult = {
  jobTitle: string;
  score: number;
  recommendation: "建议投递" | "谨慎投递" | "暂不建议投递";
  matchedPoints: string[];
  missingPoints: string[];
  resumeSuggestions: string[];
  applicationAdvice: string[];
  source: "real-ai" | "local-mock";
};

type KeywordRule = {
  label: string;
  keywords: string[];
  suggestion: string;
};

const keywordRules: KeywordRule[] = [
  {
    label: "AI / 大模型应用",
    keywords: ["AI", "人工智能", "大模型", "AIGC", "LLM", "RAG", "智能体", "提示词", "Agent"],
    suggestion: "补充 AI 应用、提示词设计、RAG 或智能体相关项目经历。",
  },
  {
    label: "产品规划与需求分析",
    keywords: ["产品", "需求", "PRD", "原型", "路线图", "迭代", "用户故事", "需求分析"],
    suggestion: "突出从用户问题、需求拆解到产品方案落地的完整链路。",
  },
  {
    label: "数据分析与指标意识",
    keywords: ["数据", "SQL", "指标", "看板", "A/B", "AB", "转化", "留存", "DAU", "MAU"],
    suggestion: "补充关键指标、分析方法、实验设计和结果提升数据。",
  },
  {
    label: "B 端 / SaaS 业务理解",
    keywords: ["B端", "SaaS", "企业", "客户", "CRM", "后台", "管理系统", "协作工具"],
    suggestion: "增加 B 端业务流程、客户痛点、权限/流程/配置类能力说明。",
  },
  {
    label: "增长与运营能力",
    keywords: ["增长", "运营", "活动", "社群", "投放", "获客", "转化", "留存"],
    suggestion: "说明增长目标、策略动作、实验过程和转化结果。",
  },
  {
    label: "用户研究与体验设计",
    keywords: ["用户研究", "访谈", "体验", "交互", "Figma", "可用性", "信息架构"],
    suggestion: "补充用户访谈、体验洞察、原型方案和改版前后效果。",
  },
  {
    label: "项目推进与跨团队协作",
    keywords: ["跨团队", "协作", "推动", "上线", "落地", "研发", "设计", "测试"],
    suggestion: "强化你在项目中的角色、推进难点和最终上线结果。",
  },
  {
    label: "商业化与行业理解",
    keywords: ["商业化", "收入", "付费", "行业", "解决方案", "售前", "客户成功"],
    suggestion: "补充商业目标、客户价值、行业场景和收入相关成果。",
  },
];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function containsAny(text: string, keywords: string[]) {
  const lowerText = normalize(text);
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

function inferRecommendation(score: number): JobMatchResult["recommendation"] {
  if (score >= 78) return "建议投递";
  if (score >= 58) return "谨慎投递";
  return "暂不建议投递";
}

function buildApplicationAdvice(score: number, matchedCount: number, missingCount: number) {
  if (score >= 78) {
    return [
      "建议投递，但不要直接使用通用简历，先围绕匹配点做一版定制简历。",
      "投递话术中优先强调 2-3 个最强匹配点，并补一句你能解决该岗位的核心问题。",
      "如果 JD 提到业务指标，建议在简历和沟通中补充可量化成果。",
    ];
  }

  if (score >= 58) {
    return [
      "可以作为拓展岗位投递，但建议先补齐缺失点，否则简历筛选通过率不稳定。",
      `当前有 ${matchedCount} 个明确匹配点、${missingCount} 个缺失点，建议优先补强 JD 高频关键词。`,
      "投递时可采用“相关经历 + 快速补齐计划”的表达，降低岗位不完全匹配的风险。",
    ];
  }

  return [
    "暂不建议作为主投岗位，除非你能快速补充强相关项目或作品集。",
    "如果仍想尝试，建议只作为冲刺投递，并在开场话术中解释能力迁移路径。",
    "优先寻找与当前简历关键词重合度更高的岗位，避免消耗过多求职精力。",
  ];
}

export function analyzeJobMatch(resumeText: string, jdText: string): JobMatchResult {
  const resume = resumeText.trim();
  const jd = jdText.trim();
  if (!resume || !jd) {
    throw new Error("请先填写简历和岗位 JD，再进行匹配分析。");
  }
  const matchedRules = keywordRules.filter((rule) => containsAny(jd, rule.keywords) && containsAny(resume, rule.keywords));
  const missingRules = keywordRules.filter((rule) => containsAny(jd, rule.keywords) && !containsAny(resume, rule.keywords));
  const jdRuleCount = keywordRules.filter((rule) => containsAny(jd, rule.keywords)).length;
  const denominator = Math.max(jdRuleCount, 1);
  const keywordScore = Math.round((matchedRules.length / denominator) * 70);
  const detailBonus = Math.min(20, Math.floor(resume.length / 120));
  const quantBonus = /\d+%|提升|增长|降低|转化|留存|GMV|DAU|MAU/i.test(resume) ? 10 : 0;
  const score = Math.min(96, Math.max(28, keywordScore + detailBonus + quantBonus));

  const matchedPoints = matchedRules.map((rule) => `匹配 ${rule.label}：简历和 JD 都出现相关关键词。`);
  const missingPoints = missingRules.map((rule) => `缺少 ${rule.label}：JD 有要求，但简历表达不明显。`);
  const resumeSuggestions = missingRules.map((rule) => rule.suggestion);

  if (!/\d+%|提升|增长|降低|转化|留存|GMV|DAU|MAU/i.test(resume)) {
    resumeSuggestions.push("补充量化结果，例如转化率、效率提升、用户规模、收入或项目周期。");
  }

  if (!/主导|负责|推动|上线|落地|从0到1|0-1/.test(resume)) {
    resumeSuggestions.push("强化个人贡献边界，使用“我负责/主导/推动了什么，并带来什么结果”的表达。");
  }

  return {
    jobTitle: extractJobTitle(jd),
    score,
    recommendation: inferRecommendation(score),
    matchedPoints: matchedPoints.length ? matchedPoints : ["暂未识别到强匹配点，建议补充更完整的简历和 JD 文本。"],
    missingPoints: missingPoints.length ? missingPoints : ["暂未发现明显缺失点，可以继续检查岗位年限、行业背景和作品集要求。"],
    resumeSuggestions: Array.from(new Set(resumeSuggestions)).slice(0, 6),
    applicationAdvice: buildApplicationAdvice(score, matchedRules.length, missingRules.length),
    source: "local-mock",
  };
}

export async function analyzeJobMatchWithAi(resumeText: string, jdText: string): Promise<JobMatchResult> {
  const resume = resumeText.trim();
  const jd = jdText.trim();
  if (!resume || !jd) {
    throw new Error("请先填写简历和岗位 JD，再进行匹配分析。");
  }

  const result = await callAiJson<Omit<JobMatchResult, "source">>({
    systemPrompt: "你是严格的招聘匹配分析师。只能基于用户提供的简历和 JD 判断，不编造经历。输出必须是合法 JSON。",
    userPrompt: `请对简历和 JD 做匹配分析，输出 JSON，字段必须严格符合：{\"jobTitle\":string,\"score\":number,\"recommendation\":\"建议投递\"|\"谨慎投递\"|\"暂不建议投递\",\"matchedPoints\":string[],\"missingPoints\":string[],\"resumeSuggestions\":string[],\"applicationAdvice\":string[]}。score 为 0-100，matchedPoints/ missingPoints/ resumeSuggestions/ applicationAdvice 各 3-6 条，建议要具体可执行。\n简历：\n${resume}\n\n岗位 JD：\n${jd}`,
  });

  return {
    ...result,
    source: "real-ai",
  };
}
