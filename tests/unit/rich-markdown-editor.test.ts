import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RichMarkdownEditor } from "@/components/ui/rich-markdown-editor";

describe("RichMarkdownEditor Component", () => {
  it("renders editor with write tab, toolbar buttons, and textarea", () => {
    const html = renderToStaticMarkup(
      React.createElement(RichMarkdownEditor, {
        id: "test-editor",
        value: "## Welcome\n\nThis is botanical copy.",
        onChange: () => {},
        label: "Content Body",
      }),
    );

    // Label and Buttons
    expect(html).toContain("Content Body");
    expect(html).toContain("Write");
    expect(html).toContain("Preview");
    expect(html).toContain('aria-label="Markdown formatting tools"');

    // Formatting tools
    expect(html).toContain('aria-label="Bold text"');
    expect(html).toContain('aria-label="Italic text"');
    expect(html).toContain('aria-label="Heading 2"');
    expect(html).toContain('aria-label="Heading 3"');
    expect(html).toContain('aria-label="Bulleted list"');
    expect(html).toContain('aria-label="Numbered list"');
    expect(html).toContain('aria-label="Quote block"');
    expect(html).toContain('aria-label="Insert link"');

    // Textarea content
    expect(html).toContain("This is botanical copy.");
    expect(html).toContain("6 words");
  });

  it("renders with placeholder and helperText when supplied", () => {
    const html = renderToStaticMarkup(
      React.createElement(RichMarkdownEditor, {
        value: "",
        onChange: () => {},
        placeholder: "Type custom guidelines here...",
        helperText: "Format with markdown tools.",
      }),
    );

    expect(html).toContain("Type custom guidelines here...");
    expect(html).toContain("Format with markdown tools.");
    expect(html).toContain("0 words");
    expect(html).toContain("0 characters");
  });

  it("disables toolbar buttons and textarea when disabled prop is true", () => {
    const html = renderToStaticMarkup(
      React.createElement(RichMarkdownEditor, {
        value: "Disabled text",
        onChange: () => {},
        disabled: true,
      }),
    );

    expect(html).toContain("disabled");
  });
});
