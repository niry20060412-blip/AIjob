export type CandidateProfile = {
  summary: string;
  yearsOfExperience: string;
  industryExperience: string[];
  coreSkills: string[];
  transferableSkills: string[];
  strengths: string[];
  weaknesses: string[];
  targetSeniority: string;
};

export type JobRecommendation = {
  title: string;
  reason: string;
  fitScore: number;
  focus: string[];
};

export type JobRecommendations = {
  primary: JobRecommendation[];
  expanded: JobRecommendation[];
  stretch: JobRecommendation[];
  notRecommended: JobRecommendation[];
};

import { callAiJson } from "@/lib/aiClient";

export type ResumeAnalysisResult = {
  profile: CandidateProfile;
  recommendations: JobRecommendations;
  generatedAt: string;
  source: "real-ai" | "local-mock";
};

const keywordGroups = {
  product: ["产品", "需求", "PRD", "原型", "用户", "体验", "增长", "迭代", "路线图"],
  ai: ["AI", "人工智能", "大模型", "AIGC", "LLM", "提示词", "智能体", "RAG", "算法"],
  data: ["数据", "SQL", "分析", "指标", "看板", "AB", "A/B", "转化", "留存"],
  operations: ["运营", "社群", "活动", "内容", "增长", "用户增长", "投放"],
  design: ["设计", "Figma", "交互", "体验", "可用性", "信息架构"],
  tech: ["前端", "后端", "React", "Next", "Python", "API", "工程", "开发"],
  business: ["商业", "客户", "B端", "SaaS", "CRM", "销售", "行业", "解决方案"],
};

function countMatches(text: string, keywords: string[]) {
  return keywords.reduce((count, keyword) => count + (text.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function inferYearsOfExperience(text: string) {
  const patterns = [/(\d+)\s*年[^，。；\n]*(经验|经历|工作)/, /(工作|从业)[^，。；\n]*(\d+)\s*年/, /(\d+)\s*\+\s*年/];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const year = Number(match[1] || match[2]);
      if (!Number.isNaN(year) && year > 0) return `${year} 年`;
    }
  }
  if (text.length > 1000) return "3-5 年（根据简历信息量估算）";
  if (text.length > 500) return "1-3 年（根据简历信息量估算）";
  return "0-1 年或信息不足";
}

function inferIndustryExperience(text: string) {
  const industries = [
    { label: "AI / 大模型应用", keywords: keywordGroups.ai },
    { label: "SaaS / B 端工具", keywords: ["SaaS", "B端", "企业", "协作", "CRM", "后台", "管理系统"] },
    { label: "互联网产品 / 用户增长", keywords: ["增长", "用户", "转化", "留存", "活动", "运营"] },
    { label: "数据分析 / 商业分析", keywords: keywordGroups.data },
    { label: "内容 / 社区 / 新媒体", keywords: ["内容", "社区", "新媒体", "公众号", "小红书", "社群"] },
    { label: "教育 / 知识服务", keywords: ["教育", "课程", "学习", "培训", "知识"] },
  ];

  const matched = industries.filter((item) => countMatches(text, item.keywords) > 0).map((item) => item.label);
  return matched.length ? matched : ["行业信息不足，建议在简历中补充目标行业和业务场景"];
}

function inferCoreSkills(text: string) {
  const skillMap = [
    { label: "产品规划与需求拆解", keywords: keywordGroups.product },
    { label: "AI 应用理解与提示词设计", keywords: keywordGroups.ai },
    { label: "数据分析与指标拆解", keywords: keywordGroups.data },
    { label: "用户增长与运营策略", keywords: keywordGroups.operations },
    { label: "交互设计与用户体验", keywords: keywordGroups.design },
    { label: "技术协作与 API 理解", keywords: keywordGroups.tech },
    { label: "B 端业务理解与客户沟通", keywords: keywordGroups.business },
  ];

  const skills = skillMap.filter((item) => countMatches(text, item.keywords) >= 1).map((item) => item.label);
  return skills.length ? skills : ["结构化表达", "跨团队协作", "快速学习与执行"];
}

function inferStrengths(text: string, skills: string[]) {
  const strengths = [];
  if (/\d+%|增长|提升|降低|转化|留存|GMV|DAU|MAU/i.test(text)) strengths.push("简历中包含一定结果量化信息，便于证明业务价值");
  if (skills.some((skill) => skill.includes("AI"))) strengths.push("具备 AI 应用或大模型相关经历，适合切入 AI 工具型岗位");
  if (skills.some((skill) => skill.includes("数据"))) strengths.push("有数据分析意识，可支撑岗位匹配、增长和策略类工作");
  if (skills.some((skill) => skill.includes("产品"))) strengths.push("产品方法论基础较完整，能承接需求分析到方案落地");
  if (text.length > 800) strengths.push("经历信息相对完整，后续适合做岗位定制化改写");
  return strengths.length ? strengths : ["具备基础职业经历，可通过补充项目结果和关键词增强竞争力"];
}

function inferWeaknesses(text: string) {
  const weaknesses = [];
  if (!/\d+%|增长|提升|降低|转化|留存|GMV|DAU|MAU/i.test(text)) weaknesses.push("项目成果量化不足，建议补充具体指标、规模或业务结果");
  if (!/AI|人工智能|大模型|AIGC|LLM|智能体|RAG/i.test(text)) weaknesses.push("AI 相关关键词较弱，若目标是 AI 产品岗位需要补充相关项目或学习成果");
  if (!/负责.*(结果|上线|落地)|主导|推动|从0到1|0-1/.test(text)) weaknesses.push("个人贡献边界不够突出，建议强化“我做了什么”和“带来什么结果”");
  if (text.length < 500) weaknesses.push("简历文本偏短，可能无法充分支持岗位匹配判断");
  return weaknesses.length ? weaknesses : ["整体表达较完整，下一步重点是针对不同岗位做版本化优化"];
}

export function recommendJobs(profile: CandidateProfile): JobRecommendations {
  const hasAi = profile.coreSkills.some((skill) => skill.includes("AI"));
  const hasProduct = profile.coreSkills.some((skill) => skill.includes("产品"));
  const hasData = profile.coreSkills.some((skill) => skill.includes("数据"));
  const hasBusiness = profile.coreSkills.some((skill) => skill.includes("B 端"));

  return {
    primary: [
      {
        title: hasAi ? "AI 产品经理" : "产品经理",
        reason: hasAi && hasProduct ? "AI 应用理解与产品规划能力同时具备，是当前最适合主攻的方向。" : "产品能力基础较明显，可作为主线求职方向。",
        fitScore: hasAi && hasProduct ? 92 : 84,
        focus: ["突出目标用户与场景", "补充产品方案和上线结果", "准备 1 个完整项目案例"],
      },
      {
        title: hasData ? "增长产品经理" : "用户产品经理",
        reason: hasData ? "数据分析与指标意识可迁移到增长、转化和留存场景。" : "用户理解和需求拆解能力适合用户产品方向。",
        fitScore: hasData ? 88 : 80,
        focus: ["补充指标口径", "强调实验设计", "呈现业务结果"],
      },
    ],
    expanded: [
      {
        title: hasBusiness ? "B 端产品经理" : "产品运营",
        reason: hasBusiness ? "具备 B 端业务理解和跨团队协作基础，可拓展企业服务岗位。" : "运营与产品交叉能力可作为更稳妥的拓展方向。",
        fitScore: hasBusiness ? 83 : 78,
        focus: ["梳理业务流程", "突出客户问题", "展示协同推进能力"],
      },
      {
        title: "用户研究 / 体验策略",
        reason: "如果简历中能补充用户洞察、访谈和体验优化案例，可拓展到体验策略类岗位。",
        fitScore: 74,
        focus: ["补充用户研究方法", "沉淀洞察结论", "展示改版前后对比"],
      },
    ],
    stretch: [
      {
        title: "AI 产品负责人 / 0-1 产品 Owner",
        reason: "需要更强的业务 ownership、团队协同和完整商业化结果，目前可作为冲刺方向。",
        fitScore: 68,
        focus: ["补充 0-1 项目闭环", "强化决策权重", "呈现商业化或规模化结果"],
      },
      {
        title: "解决方案顾问",
        reason: "如果能加强行业理解、客户沟通和方案包装能力，可尝试偏售前/方案岗位。",
        fitScore: 65,
        focus: ["行业场景沉淀", "客户痛点表达", "方案型案例"],
      },
    ],
    notRecommended: [
      {
        title: "纯算法工程师",
        reason: "当前画像更偏产品、策略和应用落地，算法岗位通常要求更深的模型训练和工程背景。",
        fitScore: 35,
        focus: ["除非补充算法项目", "不建议作为短期主攻方向"],
      },
      {
        title: "纯销售岗",
        reason: "与当前产品决策、简历诊断和岗位匹配能力线偏离较大，容易损失过往经历复利。",
        fitScore: 42,
        focus: ["若选择需强调客户转化", "不建议替代产品主线"],
      },
    ],
  };
}

export function analyzeResume(resumeText: string): ResumeAnalysisResult {
  const normalizedText = resumeText.trim();
  if (!normalizedText) {
    throw new Error("请先粘贴或上传简历文本，再进行分析。");
  }
  const text = normalizedText;
  const coreSkills = inferCoreSkills(text);
  const profile: CandidateProfile = {
    summary: coreSkills.some((skill) => skill.includes("AI"))
      ? "偏 AI 应用与产品落地方向的复合型候选人，适合主攻 AI 产品、增长产品和 B 端工具类岗位。"
      : "偏产品规划与业务推进方向的候选人，适合主攻产品经理、增长产品和产品运营类岗位。",
    yearsOfExperience: inferYearsOfExperience(text),
    industryExperience: inferIndustryExperience(text),
    coreSkills,
    transferableSkills: unique([
      "需求拆解与结构化表达",
      "跨团队沟通协作",
      "用户问题洞察",
      coreSkills.some((skill) => skill.includes("数据")) ? "指标分析与复盘" : "快速学习与信息整合",
      coreSkills.some((skill) => skill.includes("产品")) ? "从问题到方案的产品化能力" : "项目推进与执行落地",
    ]),
    strengths: inferStrengths(text, coreSkills),
    weaknesses: inferWeaknesses(text),
    targetSeniority: inferYearsOfExperience(text).includes("0-1") ? "初级 / 助理级" : inferYearsOfExperience(text).includes("1-3") ? "初中级" : "中级 / 资深预备",
  };

  return {
    profile,
    recommendations: recommendJobs(profile),
    generatedAt: new Date().toISOString(),
    source: "local-mock",
  };
}

export async function analyzeResumeWithAi(resumeText: string): Promise<ResumeAnalysisResult> {
  const normalizedText = resumeText.trim();
  if (!normalizedText) {
    throw new Error("请先粘贴或上传简历文本，再进行分析。");
  }

  const result = await callAiJson<Omit<ResumeAnalysisResult, "generatedAt" | "source">>({
    systemPrompt: "你是严谨的中文求职顾问。只基于用户提供的简历文本做判断，不编造不存在的经历。输出必须是合法 JSON。",
    userPrompt: `请分析下面这份简历，输出 JSON，字段必须严格符合：{\"profile\":{\"summary\":string,\"yearsOfExperience\":string,\"industryExperience\":string[],\"coreSkills\":string[],\"transferableSkills\":string[],\"strengths\":string[],\"weaknesses\":string[],\"targetSeniority\":string},\"recommendations\":{\"primary\":JobRecommendation[],\"expanded\":JobRecommendation[],\"stretch\":JobRecommendation[],\"notRecommended\":JobRecommendation[]}}。JobRecommendation 为 {\"title\":string,\"reason\":string,\"fitScore\":number,\"focus\":string[]}。每类岗位给 1-3 个，fitScore 为 0-100。简历：\n${normalizedText}`,
  });

  return {
    ...result,
    generatedAt: new Date().toISOString(),
    source: "real-ai",
  };
}
