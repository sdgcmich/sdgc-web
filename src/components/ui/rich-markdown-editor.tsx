"use client";

import * as React from "react";
import { MarkdownContent } from "@/components/ui/markdown-content";

export interface RichMarkdownEditorProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  minHeight?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
}

export function RichMarkdownEditor({
  id,
  name,
  value,
  onChange,
  placeholder = "Write in Markdown (headings, lists, links, bold, italic)...",
  rows = 10,
  minHeight = "220px",
  disabled = false,
  required = false,
  label,
  helperText,
  className = "",
}: RichMarkdownEditorProps) {
  const [activeTab, setActiveTab] = React.useState<"write" | "preview">("write");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (prefix: string, suffix = "", defaultText = "") => {
    if (disabled) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end);

    let replacement: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (prefix === "## " || prefix === "### " || prefix === "> ") {
      if (selectedText.includes("\n")) {
        const lines = selectedText.split("\n");
        replacement = lines
          .map((line) => {
            const clean = line.replace(/^(#{1,6}\s*|>\s*)/, "");
            return clean ? `${prefix}${clean}` : "";
          })
          .join("\n");
        newCursorStart = start;
        newCursorEnd = start + replacement.length;
      } else {
        const text = selectedText || defaultText;
        replacement = `${prefix}${text}`;
        newCursorStart = start + prefix.length;
        newCursorEnd = start + replacement.length;
      }
    } else if (prefix === "- " || prefix === "1. ") {
      if (selectedText.includes("\n")) {
        const lines = selectedText.split("\n");
        replacement = lines
          .map((line, idx) => {
            const clean = line.replace(/^([-*]|\d+\.)\s*/, "");
            const marker = prefix === "1. " ? `${idx + 1}. ` : "- ";
            return clean ? `${marker}${clean}` : "";
          })
          .join("\n");
        newCursorStart = start;
        newCursorEnd = start + replacement.length;
      } else {
        const text = selectedText || defaultText;
        replacement = `${prefix}${text}`;
        newCursorStart = start + prefix.length;
        newCursorEnd = start + replacement.length;
      }
    } else if (prefix === "[" && suffix === ")") {
      if (selectedText) {
        if (/^https?:\/\//i.test(selectedText.trim())) {
          replacement = `[link title](${selectedText.trim()})`;
          newCursorStart = start + 1;
          newCursorEnd = start + 11;
        } else {
          replacement = `[${selectedText}](https://)`;
          newCursorStart = start + replacement.length - 8;
          newCursorEnd = start + replacement.length - 1;
        }
      } else {
        replacement = `[${defaultText || "link text"}](https://)`;
        newCursorStart = start + 1;
        newCursorEnd = start + 1 + (defaultText || "link text").length;
      }
    } else {
      const text = selectedText || defaultText;
      replacement = `${prefix}${text}${suffix}`;
      if (selectedText) {
        newCursorStart = start;
        newCursorEnd = start + replacement.length;
      } else {
        newCursorStart = start + prefix.length;
        newCursorEnd = start + prefix.length + defaultText.length;
      }
    }

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);
    const nextVal = `${before}${replacement}${after}`;

    onChange(nextVal);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorStart, newCursorEnd);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        applyFormatting("**", "**", "bold text");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        applyFormatting("*", "*", "italic text");
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        applyFormatting("[", ")", "link text");
      }
    }
  };

  const wordCount = React.useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [value]);

  const charCount = value.length;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Optional Header with Label and Write / Preview Switch */}
      <div className="flex items-center justify-between gap-2">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {label} {required && <span className="text-destructive">*</span>}
          </label>
        )}
        <div className="ml-auto inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`rounded-md px-2.5 py-1 transition-all ${
              activeTab === "write"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`rounded-md px-2.5 py-1 transition-all ${
              activeTab === "preview"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Editor Box */}
      <div className="rounded-xl border border-border bg-card shadow-xs focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all overflow-hidden">
        {/* Markdown Formatting Toolbar (visible only on Write tab) */}
        {activeTab === "write" && (
          <div
            role="toolbar"
            aria-label="Markdown formatting tools"
            className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5 text-foreground"
          >
            {/* Bold */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyFormatting("**", "**", "bold text")}
              title="Bold (Ctrl+B)"
              aria-label="Bold text"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs hover:bg-muted focus:outline-none focus:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-40"
            >
              B
            </button>

            {/* Italic */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyFormatting("*", "*", "italic text")}
              title="Italic (Ctrl+I)"
              aria-label="Italic text"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md italic font-serif text-xs hover:bg-muted focus:outline-none focus:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-40"
            >
              I
            </button>

            <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

            {/* Heading 2 */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyFormatting("## ", "", "Heading 2")}
              title="Heading 2 (##)"
              aria-label="Heading 2"
              className="inline-flex h-7 px-1.5 items-center justify-center rounded-md font-serif font-bold text-xs hover:bg-muted focus:outline-none focus:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-40"
            >
              H2
            </button>

            {/* Heading 3 */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyFormatting("### ", "", "Heading 3")}
              title="Heading 3 (###)"
              aria-label="Heading 3"
              className="inline-flex h-7 px-1.5 items-center justify-center rounded-md font-serif font-semibold text-xs hover:bg-muted focus:outline-none focus:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-40"
            >
              H3
            </button>

            <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

            {/* Bullet List */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyFormatting("- ", "", "List item")}
              title="Bulleted List (- )"
              aria-label="Bulleted list"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-40"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>

            {/* Numbered List */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyFormatting("1. ", "", "Numbered item")}
              title="Numbered List (1. )"
              aria-label="Numbered list"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-40 text-xs font-mono font-semibold"
            >
              1.
            </button>

            {/* Blockquote */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyFormatting("> ", "", "Quoted text")}
              title="Blockquote (> )"
              aria-label="Quote block"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-40"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2 0 4-1 6-1 8z" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2 0 4-1 6-1 8z" />
              </svg>
            </button>

            <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

            {/* Link */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyFormatting("[", ")", "link text")}
              title="Insert Link (Ctrl+K)"
              aria-label="Insert link"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:bg-muted text-foreground/80 hover:text-foreground disabled:opacity-40"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>

            {/* Helper Hint */}
            <span className="ml-auto text-[10px] text-muted-foreground hidden sm:inline">
              Ctrl+B bold &bull; Ctrl+I italic &bull; Ctrl+K link
            </span>
          </div>
        )}

        {/* Content Area */}
        {activeTab === "write" ? (
          <textarea
            ref={textareaRef}
            id={id}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            required={required}
            style={{ minHeight }}
            className="w-full bg-transparent p-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed resize-y"
          />
        ) : (
          <div style={{ minHeight }} className="p-4 bg-muted/10 overflow-y-auto max-h-[500px]">
            {value.trim() ? (
              <MarkdownContent content={value} />
            ) : (
              <div className="flex h-full min-h-[160px] items-center justify-center text-xs text-muted-foreground italic">
                No content entered yet. Switch to the Write tab to start drafting.
              </div>
            )}
          </div>
        )}

        {/* Editor Footer Status Bar */}
        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
            <span>&bull;</span>
            <span>
              {charCount} {charCount === 1 ? "character" : "characters"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-primary/80">
            <span>Markdown Enabled</span>
          </div>
        </div>
      </div>

      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}
