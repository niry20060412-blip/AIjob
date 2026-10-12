import type { CandidateProfile, JobRecommendation } from "@/lib/resumeAnalyzer";

export type CompanyVerification = {
  status: "已核查" | "需复核" | "谨慎";
  checks: string[];
  risks: string[];
};

export type JobOpportunity = {
  id: string;
  title: string;
  companyName: string;
  platform: "BOSS直聘" | "拉勾" | "猎聘" | "脉脉" | "前程无忧";
  city: string;
  salary: string;
  postedAt: string;
  freshness: "近 24 小时" | "近 3 天" | "近 7 天" | "近 14 天";
  fitScore: number;
  sourceUrl: string;
  matchReason: string;
  verification: CompanyVerification;
};

export const opportunityPool: JobOpportunity[] = [
  {
    id: "opp-ai-pm-1",
    title: "AI 产品经理",
    companyName: "云启智能科技",
    platform: "BOSS直聘",
    city: "北京",
    salary: "25-40K·14薪",
    postedAt: "2026-10-11",
    freshness: "近 24 小时",
    fitScore: 92,
    sourceUrl: "https://www.zhipin.com/job_detail/7d8f9a0b1c2d3e4f1XB93tq5ElQ~.html?lid=mock-ai-pm-1",
    matchReason: "JD 强调大模型应用、需求拆解和跨团队落地，和当前画像中的 AI 产品与项目推进能力高度匹配。",
    verification: {
      status: "已核查",
      checks: ["工商登记信息完整", "招聘主体与官网主体一致", "近期多平台仍有招聘动态"],
      risks: ["需面试前确认岗位是否真实 HC"],
    },
  },
  {
    id: "opp-growth-pm-1",
    title: "增长产品经理",
    companyName: "知行数据科技",
    platform: "拉勾",
    city: "上海",
    salary: "22-35K",
    postedAt: "2026-10-10",
    freshness: "近 3 天",
    fitScore: 88,
    sourceUrl: "https://www.lagou.com/wn/jobs/12540001.html",
    matchReason: "岗位关注转化漏斗、留存和实验设计，适合有数据分析与增长意识的候选人。",
    verification: {
      status: "已核查",
      checks: ["公司主体存续", "招聘平台企业认证可见", "岗位描述与业务方向一致"],
      risks: ["需确认是否需要强投放经验"],
    },
  },
  {
    id: "opp-b2b-pm-1",
    title: "B 端产品经理",
    companyName: "星河协同软件",
    platform: "猎聘",
    city: "深圳",
    salary: "20-35K",
    postedAt: "2026-10-09",
    freshness: "近 3 天",
    fitScore: 84,
    sourceUrl: "https://www.liepin.com/job/1962845731.shtml",
    matchReason: "企业协作、后台流程和客户问题拆解与 B 端 SaaS 经历相关，可作为稳妥投递方向。",
    verification: {
      status: "已核查",
      checks: ["公开工商状态正常", "招聘主体与产品官网匹配", "无明显高风险描述"],
      risks: ["需确认客户现场支持比例"],
    },
  },
  {
    id: "opp-ai-owner-1",
    title: "AI 产品 Owner",
    companyName: "灵犀应用实验室",
    platform: "脉脉",
    city: "杭州",
    salary: "30-50K",
    postedAt: "2026-10-08",
    freshness: "近 7 天",
    fitScore: 76,
    sourceUrl: "https://maimai.cn/jobs/detail/1825000101",
    matchReason: "偏 0-1 产品负责人方向，机会质量较高，但需要补充 ownership 和商业化结果。",
    verification: {
      status: "需复核",
      checks: ["公开信息可查", "招聘描述与 AI 应用方向一致"],
      risks: ["团队规模和融资信息需进一步确认", "建议面试前核对劳动合同主体"],
    },
  },
  {
    id: "opp-product-ops-1",
    title: "产品运营",
    companyName: "青杉教育科技",
    platform: "前程无忧",
    city: "广州",
    salary: "15-25K",
    postedAt: "2026-10-06",
    freshness: "近 7 天",
    fitScore: 72,
    sourceUrl: "https://jobs.51job.com/guangzhou/156780001.html",
    matchReason: "适合扩大机会池，能承接用户运营、内容策略和产品反馈闭环。",
    verification: {
      status: "已核查",
      checks: ["招聘主体信息完整", "岗位职责边界清晰"],
      risks: ["需确认是否偏执行运营而非产品策略"],
    },
  },
  {
    id: "opp-risk-sales-1",
    title: "AI 解决方案销售",
    companyName: "快招企业服务",
    platform: "BOSS直聘",
    city: "成都",
    salary: "12-30K",
    postedAt: "2026-10-04",
    freshness: "近 14 天",
    fitScore: 48,
    sourceUrl: "https://www.zhipin.com/job_detail/2a3b4c5d6e7f8g9h1XF_3tm4FlU~.html?lid=mock-risk-sales-1",
    matchReason: "与产品主线偏离较大，更偏销售转化，不建议作为当前主攻岗位。",
    verification: {
      status: "谨慎",
      checks: ["岗位描述佣金导向明显"],
      risks: ["薪资结构可能包含较高浮动部分", "需谨慎核实底薪、试用期和社保缴纳主体"],
    },
  },
];

function hasSkill(profile: CandidateProfile, keyword: string) {
  const text = [profile.summary, ...profile.coreSkills, ...profile.industryExperience, ...profile.transferableSkills].join(" ");
  return text.includes(keyword);
}

export function getJobOpportunityById(id: string) {
  return opportunityPool.find((item) => item.id === id) || null;
}

export function buildOpportunityJd(opportunity: JobOpportunity) {
  return `岗位名称：${opportunity.title}\n公司名称：${opportunity.companyName}\n城市：${opportunity.city}\n薪资：${opportunity.salary}\n来源平台：${opportunity.platform}\n发布时间：${opportunity.postedAt}（${opportunity.freshness}）\n匹配原因：${opportunity.matchReason}\n公司核查：${opportunity.verification.checks.join("；")}\n风险提示：${opportunity.verification.risks.join("；")}`;
}

export function searchRecentJobOpportunities(profile: CandidateProfile, recommendations: JobRecommendation[]) {
  const titles = recommendations.map((item) => item.title).join(" ");
  const hasAi = hasSkill(profile, "AI") || titles.includes("AI");
  const hasData = hasSkill(profile, "数据") || titles.includes("增长");
  const hasB2b = hasSkill(profile, "B 端") || hasSkill(profile, "SaaS");

  return opportunityPool
    .map((item) => {
      let bonus = 0;
      if (hasAi && item.title.includes("AI")) bonus += 4;
      if (hasData && item.title.includes("增长")) bonus += 4;
      if (hasB2b && item.title.includes("B 端")) bonus += 4;
      return { ...item, fitScore: Math.min(98, item.fitScore + bonus) };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}
