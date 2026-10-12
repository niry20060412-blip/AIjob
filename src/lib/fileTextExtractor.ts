export type ExtractedFileText = {
  text: string;
  fileName: string;
  fileType: string;
  warning?: string;
};

const maxFileSize = 12 * 1024 * 1024;
const minTextLength = 20;

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function createResult(file: File, text: string, warning?: string): ExtractedFileText {
  const normalizedText = normalizeText(text);
  const shortWarning = normalizedText.length > 0 && normalizedText.length < minTextLength ? "识别文本较短，请确认文件是否包含可复制文字，或手动补充内容。" : undefined;
  return {
    text: normalizedText,
    fileName: file.name,
    fileType: getExtension(file.name) || file.type || "unknown",
    warning: warning || shortWarning,
  };
}

async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  const text = normalizeText(pages.join("\n\n"));
  if (!text) throw new Error("PDF 无法提取文字，可能是扫描件或图片型 PDF。后续可接 OCR 处理。");
  return text;
}

async function extractDocxText(file: File) {
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = normalizeText(result.value || "");
  if (!text) throw new Error("DOCX 解析失败或文档中没有可识别文本。");
  return text;
}

export async function extractTextFromFile(file: File): Promise<ExtractedFileText> {
  if (!file) throw new Error("未选择文件。");
  if (file.size === 0) throw new Error("文件为空，请重新上传包含内容的文件。");
  if (file.size > maxFileSize) throw new Error("文件过大，MVP 暂只支持 12MB 以内的附件。");

  const extension = getExtension(file.name);
  const mimeType = file.type;

  if (["png", "jpg", "jpeg"].includes(extension) || mimeType.startsWith("image/")) {
    return createResult(file, "", "图片 OCR 即将支持。当前请先上传 TXT、MD、PDF、DOCX，或手动复制粘贴文字。");
  }

  if (extension === "doc") {
    return createResult(file, "", "暂不支持旧版 DOC 文件，请先转为 DOCX 或 PDF 后再上传。");
  }

  if (extension === "txt" || extension === "md" || mimeType.startsWith("text/")) {
    const text = await file.text();
    if (!text.trim()) throw new Error("文件为空或没有可识别文本。");
    return createResult(file, text);
  }

  if (extension === "pdf" || mimeType === "application/pdf") {
    try {
      const text = await extractPdfText(file);
      return createResult(file, text);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "PDF 无法提取文字，请尝试复制文本或转为 DOCX。");
    }
  }

  if (extension === "docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      const text = await extractDocxText(file);
      return createResult(file, text);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "DOCX 解析失败，请检查文件是否损坏。");
    }
  }

  throw new Error("暂不支持该文件类型。MVP 支持 TXT、MD、PDF、DOCX；图片 OCR 后续支持，旧版 DOC 请转为 DOCX 或 PDF。");
}
