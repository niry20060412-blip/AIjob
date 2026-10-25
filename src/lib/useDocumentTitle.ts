"use client";

import { useEffect } from "react";

/**
 * 强制指定标签页标题。
 *
 * 为什么不能只写一次 `document.title = x`：
 * Next 的 metadata 会在 <head> 里渲染一个 <title>，水合完成后（以及客户端跳转后）
 * 会把标题重新写回 layout 里那个值，把我们的赋值冲掉。实测：赋值成功但几秒后变回原名。
 *
 * 所以这里加一个 MutationObserver 兜底：一旦 <title> 被别人改回，就再写一次。
 * 写入后自身也会触发一次观察回调，但那时标题已相等、不会再写，因此不会死循环。
 *
 * @param title 传 null 表示「不干预」，交给页面自身的 metadata
 */
export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    if (!title || typeof document === "undefined") return;

    let stopped = false;
    const apply = () => {
      if (stopped) return;
      if (document.title !== title) document.title = title;
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => {
      stopped = true;
      observer.disconnect();
    };
  }, [title]);
}
