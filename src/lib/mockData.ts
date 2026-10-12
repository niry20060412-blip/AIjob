export const navItems = [
  { href: "/", label: "首页", icon: "⌂" },
  { href: "/resume-diagnosis", label: "简历诊断", icon: "◐" },
  { href: "/job-matching", label: "岗位匹配", icon: "◎" },
  { href: "/pitch-generator", label: "话术生成", icon: "✦" },
  { href: "/applications", label: "投递管理", icon: "▣" },
  { href: "/weekly-plan", label: "一周计划", icon: "□" },
  { href: "/membership", label: "会员中心", icon: "★" },
];

export const metrics = [
  { label: "目标岗位", value: "18", trend: "+6 本周新增" },
  { label: "简历匹配均分", value: "82", trend: "较上周 +9" },
  { label: "精准投递", value: "12", trend: "4 个待跟进" },
  { label: "面试机会", value: "3", trend: "2 个本周安排" },
];

export const resumeScores = [
  { name: "岗位关键词覆盖", score: 86, advice: "补充 SaaS、增长实验、B 端转化等关键词。" },
  { name: "项目结果量化", score: 72, advice: "将“负责活动”改为“带来 23% 留存提升”。" },
  { name: "经历结构清晰度", score: 90, advice: "结构较好，可增加每段经历的一句话定位。" },
  { name: "风险项", score: 64, advice: "最近一段空窗期建议用学习计划和作品集解释。" },
];

export const jobs = [
  { title: "AI 产品经理", company: "澜舟智能", match: 93, tags: ["AIGC", "B端", "0-1"], reason: "产品定位与 AI 工具化经历高度匹配" },
  { title: "增长产品经理", company: "青藤科技", match: 87, tags: ["SaaS", "数据分析", "转化"], reason: "增长指标和实验设计经验可迁移" },
  { title: "用户体验策略", company: "灵犀协作", match: 81, tags: ["协作工具", "研究", "信息架构"], reason: "适合突出用户研究和复杂流程拆解" },
];

export const scripts = [
  { scene: "Boss 直聘开场", content: "您好，我关注到贵团队正在招聘 AI 产品经理。我过去做过求职工具与 SaaS 增长项目，擅长把用户痛点转化为可落地的产品方案，想进一步了解这个岗位。" },
  { scene: "内推私信", content: "你好，我正在重点关注 AI 应用方向，看到贵司岗位与我的产品规划、数据分析和项目推进经历比较契合，方便请你帮忙看一下是否适合内推吗？" },
  { scene: "投后跟进", content: "您好，上周我投递了 AI 产品经理岗位，补充发一份针对该岗位优化后的简历。期待有机会进一步沟通，也欢迎指出需要补充的材料。" },
];

export const applications = [
  { company: "澜舟智能", role: "AI 产品经理", status: "待沟通", date: "10/12", priority: "高" },
  { company: "青藤科技", role: "增长产品经理", status: "已投递", date: "10/11", priority: "中" },
  { company: "灵犀协作", role: "体验策略", status: "待优化简历", date: "10/13", priority: "中" },
  { company: "北极光数据", role: "产品运营", status: "暂缓", date: "10/15", priority: "低" },
];

export const weeklyPlan = [
  { day: "周一", tasks: ["筛选 5 个 AI 产品岗位", "更新简历关键词模块"] },
  { day: "周二", tasks: ["为 2 个岗位生成定制话术", "投递高匹配岗位 3 个"] },
  { day: "周三", tasks: ["复盘已投递反馈", "准备项目案例 STAR 表达"] },
  { day: "周四", tasks: ["联系 2 位内推人", "优化作品集首页"] },
  { day: "周五", tasks: ["模拟面试 30 分钟", "整理下周目标公司清单"] },
];
