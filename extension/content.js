function collectJobInfoFromPage() {
  function cleanText(text) {
    return String(text || "")
      .replace(/\u00a0/g, " ")
      .replace(/[\t ]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function compactText(text) {
    return cleanText(text).replace(/\s+/g, " ");
  }

  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function getMetaContent(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const content = element?.getAttribute("content");
      if (content) return compactText(content);
    }
    return "";
  }

  function queryText(selectors, options = {}) {
    const { maxLength = 120, minLength = 1 } = options;
    for (const selector of selectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      for (const element of elements) {
        const text = compactText(element?.textContent || element?.getAttribute("title") || "");
        if (text.length >= minLength && text.length <= maxLength) return text;
      }
    }
    return "";
  }

  function extractJsonLd() {
    const scripts = Array.from(document.querySelectorAll("script[type='application/ld+json']"));
    const items = [];

    function flatten(value) {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach(flatten);
        return;
      }
      if (typeof value === "object") {
        items.push(value);
        if (value["@graph"]) flatten(value["@graph"]);
      }
    }

    for (const script of scripts) {
      flatten(safeJsonParse(script.textContent || ""));
    }

    return items.find((item) => {
      const type = Array.isArray(item["@type"]) ? item["@type"].join(" ") : item["@type"];
      return /JobPosting|Occupation|Organization/i.test(String(type || ""));
    }) || null;
  }

  function extractFromPageText(patterns, text) {
    for (const pattern of patterns) {
      const matched = text.match(pattern);
      if (matched?.[1]) return compactText(matched[1]).slice(0, 120);
    }
    return "";
  }

  function extractJobTitle(pageTitle, jsonLd) {
    const jsonLdTitle = compactText(jsonLd?.title || "");
    if (jsonLdTitle) return jsonLdTitle.slice(0, 80);

    const explicit = queryText([
      "[data-testid*='job'][data-testid*='title']",
      "[data-testid*='position'][data-testid*='title']",
      "[class*='job-title']",
      "[class*='jobTitle']",
      "[class*='position-title']",
      "[class*='positionTitle']",
      "[class*='jobName']",
      "[class*='positionName']",
      "[class*='name'] h1",
      "h1",
      "h2"
    ], { maxLength: 100, minLength: 2 });
    if (explicit) return explicit;

    const metaTitle = getMetaContent([
      "meta[property='og:title']",
      "meta[name='twitter:title']",
      "meta[name='title']"
    ]);
    const titleSource = metaTitle || pageTitle;
    return compactText(titleSource.split(/[|｜_—–-]/)[0]).slice(0, 80);
  }

  function extractCompanyName(jsonLd, pageText) {
    const hiringOrg = jsonLd?.hiringOrganization || jsonLd?.organization;
    const jsonLdCompany = compactText(
      typeof hiringOrg === "string" ? hiringOrg : hiringOrg?.name || ""
    );
    if (jsonLdCompany) return jsonLdCompany.slice(0, 80);

    const explicit = queryText([
      "[data-testid*='company']",
      "[class*='company-name']",
      "[class*='companyName']",
      "[class*='company'] a",
      "[class*='company']",
      "[class*='brand']",
      "[data-company]"
    ], { maxLength: 100, minLength: 2 });
    if (explicit) return explicit;

    return extractFromPageText([
      /(?:公司名称|公司|企业)[:：]\s*([^\n。|｜]{2,60})/,
      /([^\n。|｜]{2,40})(?:正在招聘|直聘|招聘)/
    ], pageText);
  }

  function normalizeSalary(text) {
    return compactText(text)
      .replace(/薪资[:：]?/g, "")
      .replace(/待遇[:：]?/g, "")
      .slice(0, 80);
  }

  function extractSalary(jsonLd, pageText) {
    const baseSalary = jsonLd?.baseSalary;
    if (baseSalary) {
      const value = baseSalary.value || baseSalary;
      const min = value.minValue || value.min || "";
      const max = value.maxValue || value.max || "";
      const unit = value.unitText || baseSalary.unitText || "";
      const currency = baseSalary.currency || value.currency || "";
      const formatted = compactText(`${min}${max ? `-${max}` : ""}${currency ? ` ${currency}` : ""}${unit ? `/${unit}` : ""}`);
      if (formatted) return formatted;
    }

    const explicit = queryText([
      "[data-testid*='salary']",
      "[class*='salary']",
      "[class*='wage']",
      "[class*='pay']",
      "[class*='job-salary']"
    ], { maxLength: 80, minLength: 2 });
    if (explicit) return normalizeSalary(explicit);

    const patterns = [
      /((?:\d+(?:\.\d+)?\s*[kK千万])\s*[-~至]\s*(?:\d+(?:\.\d+)?\s*[kK千万])(?:\s*[·x×]\s*\d+薪)?)/,
      /((?:\d+(?:\.\d+)?\s*[-~至]\s*\d+(?:\.\d+)?)\s*[kK千万](?:\s*[·x×]\s*\d+薪)?)/,
      /((?:\d+(?:\.\d+)?万)\s*[-~至]\s*(?:\d+(?:\.\d+)?万))/,
      /(面议|薪资面议|工资面议)/
    ];
    const found = extractFromPageText(patterns, pageText);
    return normalizeSalary(found);
  }

  function extractCity(jsonLd, pageText) {
    const location = Array.isArray(jsonLd?.jobLocation) ? jsonLd.jobLocation[0] : jsonLd?.jobLocation;
    const address = location?.address || location;
    const jsonLdCity = compactText(address?.addressLocality || address?.addressRegion || "");
    if (jsonLdCity) return jsonLdCity.slice(0, 60);

    const explicit = queryText([
      "[data-testid*='location']",
      "[data-testid*='city']",
      "[class*='location']",
      "[class*='city']",
      "[class*='address']",
      "[class*='workplace']"
    ], { maxLength: 80, minLength: 2 });
    if (explicit && !/登录|注册|首页/.test(explicit)) return explicit;

    const city = extractFromPageText([
      /(?:城市|地点|工作地|工作地点|办公地点)[:：]\s*([^\n。|｜]{2,40})/,
      /(北京|上海|广州|深圳|杭州|成都|武汉|南京|苏州|西安|重庆|天津|厦门|长沙|郑州|合肥|青岛|宁波|佛山|东莞|远程)(?:市|[·\-\s])?/
    ], pageText);
    return city.replace(/^(城市|地点|工作地|工作地点|办公地点)[:：]?/, "");
  }

  function scoreMainCandidate(element) {
    const text = cleanText(element.innerText || element.textContent || "");
    if (text.length < 120) return -1;

    const classAndId = `${element.className || ""} ${element.id || ""}`.toLowerCase();
    let score = Math.min(text.length / 120, 80);

    if (/job|position|detail|description|desc|content|main|职责|要求/.test(classAndId)) score += 80;
    if (/nav|footer|header|sidebar|menu|comment|recommend|广告|banner/.test(classAndId)) score -= 80;
    if (/岗位职责|职位描述|任职要求|岗位要求|工作职责|职位要求|job description|responsibilities/i.test(text)) score += 120;
    if (/登录|注册|下载APP|隐私政策|用户协议|猜你喜欢|相关推荐/.test(text)) score -= 40;

    return score;
  }

  function filterMainText(text) {
    const blockedPhrases = ["登录", "注册", "下载APP", "隐私政策", "用户协议", "举报", "分享", "收藏"];
    const lines = text
      .split(/\n|(?<=。)/)
      .map((line) => compactText(line))
      .filter((line) => line.length > 4)
      .filter((line, index, array) => array.indexOf(line) === index)
      .filter((line) => !blockedPhrases.some((phrase) => line === phrase || line.startsWith(phrase)));

    return lines.join("\n").slice(0, 12000);
  }

  function extractMainText(jsonLd) {
    const jsonLdDescription = cleanText(jsonLd?.description || "");
    if (jsonLdDescription.length >= 80) return jsonLdDescription.slice(0, 12000);

    const preferredSelectors = [
      "[data-testid*='description']",
      "[data-testid*='detail']",
      "[class*='job-detail']",
      "[class*='jobDetail']",
      "[class*='position-detail']",
      "[class*='positionDetail']",
      "[class*='job-description']",
      "[class*='description']",
      "[class*='desc']",
      "article",
      "main"
    ];

    for (const selector of preferredSelectors) {
      const element = document.querySelector(selector);
      const text = cleanText(element?.innerText || element?.textContent || "");
      if (text.length >= 120) return filterMainText(text);
    }

    const candidates = Array.from(document.querySelectorAll("main, article, section, div"));
    const best = candidates
      .map((element) => ({ element, score: scoreMainCandidate(element) }))
      .sort((a, b) => b.score - a.score)[0]?.element;

    const text = cleanText(best?.innerText || document.body.innerText || document.body.textContent || "");
    return filterMainText(text);
  }

  const pageTitle = compactText(document.title);
  const pageText = cleanText(document.body.innerText || document.body.textContent || "");
  const jsonLd = extractJsonLd();
  const jdText = extractMainText(jsonLd);

  return {
    source: "chrome-extension-mv3",
    collectedAt: new Date().toISOString(),
    pageTitle,
    pageUrl: window.location.href,
    jobTitle: extractJobTitle(pageTitle, jsonLd),
    companyName: extractCompanyName(jsonLd, pageText),
    salary: extractSalary(jsonLd, pageText),
    city: extractCity(jsonLd, pageText),
    jdText,
    note: "由浏览器插件通用 DOM 规则采集，请导入前人工确认。插件不会自动登录、自动投递或自动发送消息。"
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "COLLECT_JOB_INFO") {
    try {
      sendResponse({ ok: true, data: collectJobInfoFromPage() });
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "采集失败" });
    }
  }
  return true;
});
