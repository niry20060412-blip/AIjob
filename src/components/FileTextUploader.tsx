"use client";

import { useRef, useState } from "react";
import { extractTextFromFile, type ExtractedFileText } from "@/lib/fileTextExtractor";
import { Badge } from "@/components/Ui";

type UploadStatus = "idle" | "reading" | "success" | "warning" | "error";

export type UploadedFileMeta = { fileName: string; fileType: string; charCount: number };

/** 上次上传的文件记录（来自本地存储）：切走再回来时用它把卡片恢复成「已完成」 */
export type RestorableFileMeta = UploadedFileMeta & { warning?: string };

export function FileTextUploader({
  label,
  helperText,
  onTextExtracted,
  initialFile,
}: {
  label: string;
  helperText: string;
  onTextExtracted: (text: string, meta?: UploadedFileMeta) => void;
  initialFile?: RestorableFileMeta | null;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<UploadStatus>(initialFile ? "success" : "idle");
  const [fileInfo, setFileInfo] = useState<ExtractedFileText | null>(
    initialFile
      ? { fileName: initialFile.fileName, fileType: initialFile.fileType, text: "" }
      : null,
  );
  const [message, setMessage] = useState(
    initialFile
      ? `上次已识别「${initialFile.fileName}」，提取 ${initialFile.charCount} 个字符，内容已保存在本机。`
      : "等待上传 TXT / MD / PDF / DOCX",
  );
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setStatus("reading");
    setFileInfo({ fileName: file.name, fileType: file.name.split(".").pop() || file.type || "unknown", text: "" });
    setMessage("正在识别文本...");

    try {
      const result = await extractTextFromFile(file);
      setFileInfo(result);

      if (result.text) {
        onTextExtracted(result.text, {
          fileName: result.fileName,
          fileType: result.fileType,
          charCount: result.text.length,
        });
      }

      if (result.warning) {
        setStatus(result.text ? "warning" : "error");
        setMessage(result.warning);
      } else {
        setStatus("success");
        setMessage(`识别完成，已提取 ${result.text.length} 个字符。`);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "文件识别失败，请重试或手动粘贴文本。");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const statusTone = status === "success" ? "green" : status === "warning" ? "amber" : status === "error" ? "slate" : "indigo";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">{label}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{helperText}</p>
        </div>
        <Badge tone={statusTone}>{status === "reading" ? "识别中" : status === "idle" ? "待上传" : status === "success" ? "完成" : "提示"}</Badge>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-3xl border border-dashed p-6 text-center transition ${isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx,.doc,.png,.jpg,.jpeg,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl text-indigo-600 shadow-sm">↑</div>
        <p className="mt-3 text-sm font-semibold text-slate-800">点击上传或拖拽文件到这里</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">支持 TXT / MD / PDF / DOCX；图片 OCR 即将支持；旧版 DOC 请转为 DOCX 或 PDF。</p>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{fileInfo?.fileName || "未选择文件"}</span>
          {fileInfo?.fileType ? <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">{fileInfo.fileType}</span> : null}
        </div>
        <p className={`mt-2 text-sm leading-6 ${status === "error" ? "text-rose-600" : status === "warning" ? "text-amber-700" : "text-slate-500"}`}>{message}</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">提示：分析前可先在文本框中删除手机号、邮箱、身份证号等隐私信息。</p>
      </div>
    </div>
  );
}
