const webAppImportUrl = "http://127.0.0.1:3000/job-matching?importJob=1";
const fields = ["jobTitle", "companyName", "salary", "city", "pageTitle", "pageUrl", "jdText"];

function setStatus(message, type = "") {
  const element = document.getElementById("status");
  element.textContent = message;
  element.className = `status ${type}`;
}

function setForm(data) {
  for (const field of fields) {
    document.getElementById(field).value = data[field] || "";
  }
}

function getFormData() {
  const data = {
    source: "chrome-extension-mv3",
    collectedAt: new Date().toISOString(),
  };

  for (const field of fields) {
    data[field] = document.getElementById(field).value.trim();
  }

  return data;
}

async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function collectByMessage(tabId) {
  return await chrome.tabs.sendMessage(tabId, { type: "COLLECT_JOB_INFO" });
}

async function collectByInjection(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
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

      function getMetaContent(selectors) {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          const content = element?.getAttribute("content");
          if (content) return compactText(content);
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
        for (const script of scripts) flatten(safeJsonParse(script.textContent || ""));
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
        const metaTitle = getMetaContent(["meta[property='og:title']", "meta[name='twitter:title']", "meta[name='title']"]);
        return compactText((metaTitle || pageTitle).split(/[|｜_—–-]/)[0]).slice(0, 80);
      }

      function extractCompanyName(jsonLd, pageText) {
        const hiringOrg = jsonLd?.hiringOrganization || jsonLd?.organization;
        const jsonLdCompany = compactText(typeof hiringOrg === "string" ? hiringOrg : hiringOrg?.name || "");
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
        return extractFromPageText([/(?:公司名称|公司|企业)[:：]\s*([^\n。|｜]{2,60})/, /([^\n。|｜]{2,40})(?:正在招聘|直聘|招聘)/], pageText);
      }

      function extractSalary(jsonLd, pageText) {
        const explicit = queryText(["[data-testid*='salary']", "[class*='salary']", "[class*='wage']", "[class*='pay']", "[class*='job-salary']"], { maxLength: 80, minLength: 2 });
        if (explicit) return explicit.replace(/薪资[:：]?|待遇[:：]?/g, "").slice(0, 80);
        return extractFromPageText([
          /((?:\d+(?:\.\d+)?\s*[kK千万])\s*[-~至]\s*(?:\d+(?:\.\d+)?\s*[kK千万])(?:\s*[·x×]\s*\d+薪)?)/,
          /((?:\d+(?:\.\d+)?\s*[-~至]\s*\d+(?:\.\d+)?)\s*[kK千万](?:\s*[·x×]\s*\d+薪)?)/,
          /(面议|薪资面议|工资面议)/
        ], pageText);
      }

      function extractCity(jsonLd, pageText) {
        const location = Array.isArray(jsonLd?.jobLocation) ? jsonLd.jobLocation[0] : jsonLd?.jobLocation;
        const address = location?.address || location;
        const jsonLdCity = compactText(address?.addressLocality || address?.addressRegion || "");
        if (jsonLdCity) return jsonLdCity.slice(0, 60);
        const explicit = queryText(["[data-testid*='location']", "[data-testid*='city']", "[class*='location']", "[class*='city']", "[class*='address']", "[class*='workplace']"], { maxLength: 80, minLength: 2 });
        if (explicit && !/登录|注册|首页/.test(explicit)) return explicit;
        return extractFromPageText([/(?:城市|地点|工作地|工作地点|办公地点)[:：]\s*([^\n。|｜]{2,40})/, /(北京|上海|广州|深圳|杭州|成都|武汉|南京|苏州|西安|重庆|天津|厦门|长沙|郑州|合肥|青岛|宁波|佛山|东莞|远程)(?:市|[·\-\s])?/], pageText);
      }

      function scoreMainCandidate(element) {
        const text = cleanText(element.innerText || element.textContent || "");
        if (text.length < 120) return -1;
        const classAndId = `${element.className || ""} ${element.id || ""}`.toLowerCase();
        let score = Math.min(text.length / 120, 80);
        if (/job|position|detail|description|desc|content|main|职责|要求/.test(classAndId)) score += 80;
        if (/nav|footer|header|sidebar|menu|comment|recommend|广告|banner/.test(classAndId)) score -= 80;
        if (/岗位职责|职位描述|任职要求|岗位要求|工作职责|职位要求|job description|responsibilities/i.test(text)) score += 120;
        return score;
      }

      function filterMainText(text) {
        const blockedPhrases = ["登录", "注册", "下载APP", "隐私政策", "用户协议", "举报", "分享", "收藏"];
        return text
          .split(/\n|(?<=。)/)
          .map((line) => compactText(line))
          .filter((line) => line.length > 4)
          .filter((line, index, array) => array.indexOf(line) === index)
          .filter((line) => !blockedPhrases.some((phrase) => line === phrase || line.startsWith(phrase)))
          .join("\n")
          .slice(0, 12000);
      }

      function extractMainText(jsonLd) {
        const jsonLdDescription = cleanText(jsonLd?.description || "");
        if (jsonLdDescription.length >= 80) return jsonLdDescription.slice(0, 12000);
        const preferredSelectors = ["[data-testid*='description']", "[data-testid*='detail']", "[class*='job-detail']", "[class*='jobDetail']", "[class*='position-detail']", "[class*='positionDetail']", "[class*='job-description']", "[class*='description']", "[class*='desc']", "article", "main"];
        for (const selector of preferredSelectors) {
          const element = document.querySelector(selector);
          const text = cleanText(element?.innerText || element?.textContent || "");
          if (text.length >= 120) return filterMainText(text);
        }
        const best = Array.from(document.querySelectorAll("main, article, section, div"))
          .map((element) => ({ element, score: scoreMainCandidate(element) }))
          .sort((a, b) => b.score - a.score)[0]?.element;
        return filterMainText(cleanText(best?.innerText || document.body.innerText || document.body.textContent || ""));
      }

      const pageTitle = compactText(document.title);
      const pageText = cleanText(document.body.innerText || document.body.textContent || "");
      const jsonLd = extractJsonLd();
      return {
        source: "chrome-extension-mv3-injection",
        collectedAt: new Date().toISOString(),
        pageTitle,
        pageUrl: window.location.href,
        jobTitle: extractJobTitle(pageTitle, jsonLd),
        companyName: extractCompanyName(jsonLd, pageText),
        salary: extractSalary(jsonLd, pageText),
        city: extractCity(jsonLd, pageText),
        jdText: extractMainText(jsonLd),
        note: "由浏览器插件主动注入采集，请导入前人工确认。插件不会自动登录、自动投递或自动发送消息。"
      };
    },
  });

  return { ok: true, data: result };
}

async function collect() {
  setStatus("正在读取当前页面...");
  const tab = await getCurrentTab();

  if (!tab?.id) {
    setStatus("无法读取当前标签页。", "error");
    return;
  }

  if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("edge://") || tab.url?.startsWith("chrome-extension://")) {
    setStatus("浏览器内部页面不能采集，请打开招聘网站岗位详情页。", "error");
    return;
  }

  try {
    let response;
    try {
      response = await collectByMessage(tab.id);
    } catch {
      response = await collectByInjection(tab.id);
    }

    if (!response?.ok) {
      setStatus(response?.error || "采集失败。", "error");
      return;
    }

    setForm(response.data);
    const jdLength = response.data?.jdText?.length || 0;
    if (jdLength < 80) {
      setStatus("已读取页面，但 JD 内容偏少。请确认页面是否完全加载，或手动复制 JD。", "error");
      return;
    }
    setStatus("采集完成，请确认并编辑后再复制或发送。", "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "当前页面暂不可采集，请刷新页面后重试。", "error");
  }
}

async function copyToClipboard() {
  const data = getFormData();
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  setStatus("已复制 JSON，可粘贴到 Web 应用的导入岗位入口。", "success");
}

async function sendToWebApp() {
  const data = getFormData();
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  await chrome.tabs.create({ url: webAppImportUrl });
  setStatus("已打开 Web 应用，并将 JSON 复制到剪贴板。请在导入框粘贴确认。", "success");
}

function ready() {
  document.getElementById("refreshBtn").addEventListener("click", collect);
  document.getElementById("copyBtn").addEventListener("click", () => void copyToClipboard());
  document.getElementById("sendBtn").addEventListener("click", () => void sendToWebApp());
  void collect();
}

document.addEventListener("DOMContentLoaded", ready);
