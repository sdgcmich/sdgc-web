import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NoticeDetail } from "./components/notice-detail";
import type { Notice } from "./types";
import {
  slugifyNoticeTitle,
  isValidNoticeCategory,
  isValidNoticePriority,
  detectAttachmentType,
  type NoticeCategory,
  type NoticePriority,
} from "./types";

describe("notices helpers and validation", () => {
  describe("slugifyNoticeTitle", () => {
    it("converts title to clean URL slug", () => {
      expect(slugifyNoticeTitle("First Autumn Frost Warning & Garden Protection")).toBe(
        "first-autumn-frost-warning-garden-protection",
      );
    });

    it("handles special characters, punctuation, and multiple spaces", () => {
      expect(slugifyNoticeTitle("  Urgent: 2026 Annual Garden Walk -- Call #1 Volunteers!  ")).toBe(
        "urgent-2026-annual-garden-walk-call-1-volunteers",
      );
    });

    it("handles single word titles", () => {
      expect(slugifyNoticeTitle("Announcements")).toBe("announcements");
    });
  });

  describe("isValidNoticeCategory", () => {
    it("validates recognized categories", () => {
      const valid: NoticeCategory[] = [
        "general",
        "urgent",
        "meeting",
        "volunteer",
        "event",
        "beautification",
      ];
      for (const cat of valid) {
        expect(isValidNoticeCategory(cat)).toBe(true);
      }
    });

    it("rejects unknown categories", () => {
      expect(isValidNoticeCategory("random")).toBe(false);
      expect(isValidNoticeCategory("")).toBe(false);
    });
  });

  describe("isValidNoticePriority", () => {
    it("validates priority levels", () => {
      const valid: NoticePriority[] = ["low", "normal", "high", "urgent"];
      for (const p of valid) {
        expect(isValidNoticePriority(p)).toBe(true);
      }
    });

    it("rejects unknown priority", () => {
      expect(isValidNoticePriority("critical")).toBe(false);
    });
  });

  describe("detectAttachmentType", () => {
    it("identifies PDF files correctly", () => {
      expect(detectAttachmentType("https://example.com/minutes.pdf")).toBe("pdf");
      expect(detectAttachmentType("/uploads/application-form.PDF")).toBe("pdf");
    });

    it("identifies image files correctly", () => {
      expect(detectAttachmentType("https://example.com/garden-map.jpg")).toBe("image");
      expect(detectAttachmentType("photo.jpeg")).toBe("image");
      expect(detectAttachmentType("banner.png")).toBe("image");
      expect(detectAttachmentType("scheme.webp")).toBe("image");
      expect(detectAttachmentType("animation.gif")).toBe("image");
    });

    it("identifies documents and spreadsheets correctly", () => {
      expect(detectAttachmentType("bylaws.doc")).toBe("doc");
      expect(detectAttachmentType("minutes.docx")).toBe("doc");
      expect(detectAttachmentType("budget.xls")).toBe("doc");
      expect(detectAttachmentType("roster.xlsx")).toBe("doc");
      expect(detectAttachmentType("survey.csv")).toBe("doc");
    });

    it("defaults to other for unspecified extensions", () => {
      expect(detectAttachmentType("archive.zip")).toBe("other");
      expect(detectAttachmentType("https://external-link.org")).toBe("other");
    });
  });

  describe("NoticeDetail component markdown rendering", () => {
    it("renders formatted headings, bold text, bullet lists, and links instead of raw tags", () => {
      const notice: Notice = {
        id: "notice-123",
        title: "2027 Annual Garden Walk",
        slug: "2027-annual-garden-walk",
        category: "volunteer",
        priority: "normal",
        isPinned: true,
        isPublished: true,
        expiresAt: null,
        excerpt: "Nominations are now open for featured private tour gardens.",
        content: `Planning is underway for the **47th Annual Saugatuck-Douglas Garden Walk Fundraiser**!

### Volunteer Opportunities Open:
- **Garden Docents & Hosts**: 2-hour shifts greeting visitors.
- **Refreshments & Hospitality**: Providing baked goods.

To volunteer, contact us via the [Contact Page](/contact).`,
        publishedAt: "2026-10-22T10:00:00Z",
        createdAt: "2026-10-22T10:00:00Z",
        updatedAt: "2026-10-22T10:00:00Z",
        authorId: "author-1",
        authorName: "Club Officers",
        attachments: [
          {
            name: "Volunteer Handbook 2027",
            url: "https://example.com/volunteer-handbook.pdf",
            type: "pdf",
          },
          {
            name: "Route Map Overview",
            url: "https://example.com/route-map.jpg",
            type: "image",
          },
        ],
      };

      const html = renderToStaticMarkup(React.createElement(NoticeDetail, { notice }));

      // Verify headings parsed
      expect(html).toContain("<h3");
      expect(html).toContain("Volunteer Opportunities Open:");

      // Verify bold tags rendered
      expect(html).toContain("<strong");
      expect(html).toContain("47th Annual Saugatuck-Douglas Garden Walk Fundraiser");
      expect(html).toContain("Garden Docents &amp; Hosts");

      // Verify list tags rendered
      expect(html).toContain("<ul");
      expect(html).toContain("<li");
      expect(html).toContain("2-hour shifts greeting visitors.");

      // Verify markdown links rendered
      expect(html).toContain('<a href="/contact"');
      expect(html).toContain("Contact Page</a>");

      // Verify raw markdown delimiters are NOT present
      expect(html).not.toContain("**47th");
      expect(html).not.toContain("### Volunteer");
      expect(html).not.toContain("[Contact Page](/contact)");

      // Verify attachments are rendered
      expect(html).toContain("Attached Documents &amp; Files");
      expect(html).toContain("Volunteer Handbook 2027");
      expect(html).toContain("Route Map Overview");
      expect(html).toContain('href="https://example.com/volunteer-handbook.pdf"');
      expect(html).toContain('href="https://example.com/route-map.jpg"');
      expect(html).toContain("PDF");
      expect(html).toContain("IMG");
    });
  });
});
