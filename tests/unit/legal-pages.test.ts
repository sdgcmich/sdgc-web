import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TermsOfUsePage, {
  generateMetadata as generateTermsMetadata,
} from "@/app/(public)/terms/page";
import PrivacyPolicyPage, {
  generateMetadata as generatePrivacyMetadata,
} from "@/app/(public)/privacy/page";

describe("Dynamic Legal Pages", () => {
  it("renders Terms of Use page with headings, sections, and metadata", async () => {
    const meta = await generateTermsMetadata();
    expect(meta.title).toContain("Terms of Use");

    const pageElement = await TermsOfUsePage();
    const html = renderToStaticMarkup(pageElement);

    expect(html).toContain("Terms of Use");
    expect(html).toContain("Legal &amp; Club Policies");
    expect(html).toContain("Organization &amp; Acceptance of Terms");
    expect(html).toContain("Annual, Non-Recurring Dues");
    expect(html).toContain("Annual Garden Walk &amp; Event Ticketing");
    expect(html).toContain("Horticultural Advice Disclaimer");
    expect(html).toContain("Limitation of Liability");
  });

  it("renders Privacy Policy page with headings, sections, and metadata", async () => {
    const meta = await generatePrivacyMetadata();
    expect(meta.title).toContain("Privacy Policy");

    const pageElement = await PrivacyPolicyPage();
    const html = renderToStaticMarkup(pageElement);

    expect(html).toContain("Privacy Policy");
    expect(html).toContain("Member Data &amp; Trust");
    expect(html).toContain("Our Commitment to Your Privacy");
    expect(html).toContain("Information We Collect");
    expect(html).toContain("Member Directory Privacy &amp; Opt-Out Controls");
    expect(html).toContain("Payment Processing &amp; Financial Security");
  });
});
