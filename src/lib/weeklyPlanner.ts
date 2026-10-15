import { callAiJson, AiNotConfiguredError } from "@/lib/aiClient";

export type WeeklyPlanDay = {
  id: string;
  day: string;
  theme: string;
  dailyGoal: string;
  tasks: string[];
  suggestedApplications: number;
  resumeOptimization: string;
  followUpAction: string;
};

export type WeeklyPlanResult = {
  profile: string;
  targetJobs: string[];
  totalSuggestedApplications: number;
  days: WeeklyPlanDay[];
  source: "real-ai" | "local-mock";
};

const dayNames = ["第 1 天", "第 2 天", "第 3 天", "第 4 天", "第 5 天", "第 6 天", "第 7 天"];

const jobStrategies: Record<string, { keywords: string[]; resumeFocus: string; taskFocus: string }> = {
  "AI 产品经理": {
    keywords: ["AI 应用", "大模型场景", "提示词", "智能体", "产品闭环"],
    resumeFocus: "强化 AI 应用项目、用户场景、产品方案和上线结果。",
    taskFocus: "优先筛选 AI 应用、Agent、RAG、AIGC 工具类岗位。",
  },
  "增长产品经理": {
    keywords: ["增长指标", "转化", "留存", "实验", "数据分析"],
    resumeFocus: "补充增长实验、指标口径、转化漏斗和量化结果。",
    taskFocus: "优先筛选增长、商业化、用户转化相关岗位。",
  },
  "B 端产品经理": {
    keywords: ["业务流程", "权限", "配置", "客户场景", "SaaS"],
    resumeFocus: "突出 B 端业务流程、客户问题、权限配置和跨团队推进。",
    taskFocus: "优先筛选 SaaS、企业服务、协作工具和后台产品岗位。",
  },
  "产品运营": {
    keywords: ["用户运营", "活动", "内容", "转化", "复盘"],
    resumeFocus: "突出运营策略、活动结果、用户分层和内容转化案例。",
    taskFocus: "优先筛选产品运营、用户运营和增长运营岗位。",
  },
  "用户体验策略": {
    keywords: ["用户研究", "访谈", "体验洞察", "信息架构", "可用性"],
    resumeFocus: "补充用户研究方法、体验洞察、原型改版和效果对比。",
    taskFocus: "优先筛选体验策略、用户研究和产品设计协作岗位。",
  },
};

function getPrimaryStrategy(targetJobs: string[]) {
  const primary = targetJobs[0] || "AI 产品经理";
  return {
    job: primary,
    strategy: jobStrategies[primary] || jobStrategies["AI 产品经理"],
  };
}

export function generateWeeklyPlan(profile: string, targetJobs: string[]): WeeklyPlanResult {
  const selectedJobs = targetJobs.length ? targetJobs : ["AI 产品经理"];
  const { job, strategy } = getPrimaryStrategy(selectedJobs);
  const profileText = profile.trim();
  if (!profileText) {
    throw new Error("请先上传或填写简历/候选人画像，再生成一周计划。");
  }
  const hasExperience = /\d+年|经验|项目|负责|主导|推动/.test(profileText);
  const baseApplications = selectedJobs.length >= 3 ? 4 : 3;

  const days: WeeklyPlanDay[] = [
    {
      id: "day-1",
      day: dayNames[0],
      theme: "定位与素材整理",
      dailyGoal: `明确本周主攻方向：${job}，把简历素材整理成可复用版本。`,
      tasks: [`梳理 ${selectedJobs.join(" / ")} 的岗位关键词`, "整理 3 个最能证明能力的项目案例", "建立本周投递表和跟进节奏"],
      suggestedApplications: 0,
      resumeOptimization: `${strategy.resumeFocus} 今天先完成简历主版本定位。`,
      followUpAction: "整理过去已投递岗位，标记需要本周跟进的公司。",
    },
    {
      id: "day-2",
      day: dayNames[1],
      theme: "岗位筛选与 JD 匹配",
      dailyGoal: "筛掉低匹配岗位，只保留值得定制简历的机会。",
      tasks: [strategy.taskFocus, "挑选 8-10 个岗位并做匹配度判断", `记录 JD 高频词：${strategy.keywords.slice(0, 3).join("、")}`],
      suggestedApplications: 2,
      resumeOptimization: "为最高匹配的 2 个岗位调整简历摘要和项目标题。",
      followUpAction: "对上周已投岗位发送一次简短跟进，语气保持自然。",
    },
    {
      id: "day-3",
      day: dayNames[2],
      theme: "高质量定制投递",
      dailyGoal: "完成第一批精准投递，重点追求匹配度和回复率。",
      tasks: ["为每个岗位生成一版开场话术", "投递前检查岗位关键词是否进入简历", "记录投递平台、链接、状态和跟进日期"],
      suggestedApplications: baseApplications,
      resumeOptimization: hasExperience ? "把项目经历改成“动作 + 结果 + 指标”的表达。" : "补充学习项目、作品集或模拟项目，降低经验不足风险。",
      followUpAction: "当天投递后不立即追问，先记录 2-3 天后的跟进日期。",
    },
    {
      id: "day-4",
      day: dayNames[3],
      theme: "内推与关系触达",
      dailyGoal: "用更高信任度渠道补充投递，不只依赖平台海投。",
      tasks: ["寻找 3 位可能内推或了解岗位的人", "准备 2 版内推私信", "把作品集或项目说明链接整理好"],
      suggestedApplications: 2,
      resumeOptimization: "增加一段与目标岗位强相关的项目背景说明。",
      followUpAction: "跟进第 1-2 天筛选出的高优先级岗位，补充定制简历。",
    },
    {
      id: "day-5",
      day: dayNames[4],
      theme: "复盘与补缺",
      dailyGoal: "根据投递反馈调整方向，避免重复低效动作。",
      tasks: ["复盘已投岗位的匹配点和缺失点", "更新简历中被反复要求的关键词", "准备 1 个面试可讲的完整项目案例"],
      suggestedApplications: baseApplications,
      resumeOptimization: `围绕 ${strategy.keywords.slice(0, 2).join("、")} 增加更具体的证据。`,
      followUpAction: "对 3 天前投递且未读/未回复岗位进行一次礼貌跟进。",
    },
    {
      id: "day-6",
      day: dayNames[5],
      theme: "冲刺岗位与面试准备",
      dailyGoal: "尝试少量冲刺岗位，同时准备可能到来的面试。",
      tasks: ["选择 2 个略高于当前经验的冲刺岗位", "为冲刺岗位写高匹配强调型话术", "用 STAR 法整理项目讲述"],
      suggestedApplications: 2,
      resumeOptimization: "把最强项目放到简历前半部分，突出个人贡献边界。",
      followUpAction: "确认所有已回复岗位的下一步动作和时间。",
    },
    {
      id: "day-7",
      day: dayNames[6],
      theme: "周复盘与下周计划",
      dailyGoal: "沉淀本周有效策略，生成下周更精准的投递计划。",
      tasks: ["统计本周投递数、回复数、面试数", "标记最有效的话术和渠道", "整理下周目标公司清单"],
      suggestedApplications: 0,
      resumeOptimization: "基于本周反馈更新简历主版本，保留不同岗位方向版本。",
      followUpAction: "为下周一设置跟进清单，优先处理高匹配未回复岗位。",
    },
  ];

  return {
    profile: profileText,
    targetJobs: selectedJobs,
    totalSuggestedApplications: days.reduce((sum, day) => sum + day.suggestedApplications, 0),
    days,
    source: "local-mock",
  };
}

export async function generateWeeklyPlanWithAi(profile: string, targetJobs: string[]): Promise<WeeklyPlanResult> {
  const profileText = profile.trim();
  const selectedJobs = targetJobs.length ? targetJobs : ["AI 产品经理"];
  if (!profileText) {
    throw new Error("请先上传或填写简历/候选人画像，再生成一周计划。");
  }

  try {
    const result = await callAiJson<Omit<WeeklyPlanResult, "source">>({
      action: "weekly",
      systemPrompt: "你是务实的中文求职规划顾问。只基于用户提供的候选人画像和目标岗位制定计划，不编造经历。输出必须是合法 JSON。",
      userPrompt: `请生成 7 天精准求职计划，输出 JSON，字段必须严格符合：{\"profile\":string,\"targetJobs\":string[],\"totalSuggestedApplications\":number,\"days\":WeeklyPlanDay[]}。WeeklyPlanDay 为 {\"id\":string,\"day\":string,\"theme\":string,\"dailyGoal\":string,\"tasks\":string[],\"suggestedApplications\":number,\"resumeOptimization\":string,\"followUpAction\":string}。days 必须正好 7 天，id 使用 day-1 到 day-7，每天 tasks 3-5 条，建议强调精准投递而不是海投。\n候选人画像/简历：\n${profileText}\n\n目标岗位：${selectedJobs.join("、")}`,
    });

    return {
      ...result,
      source: "real-ai",
    };
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return generateWeeklyPlan(profile, targetJobs);
    }
    throw error;
  }
}
