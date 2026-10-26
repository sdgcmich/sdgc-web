import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPageBySlug } from "@/features/content/queries";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { siteConfig } from "@/config/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    return {
      title: `Page Not Found | ${siteConfig.shortName}`,
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://saugatuckdouglasgardenclub.com";

  return {
    title: `${page.title} | ${siteConfig.shortName}`,
    description: page.metaDescription || `${page.title} — ${siteConfig.name}`,
    alternates: {
      canonical: `${siteUrl}/${page.slug}`,
    },
    openGraph: {
      title: `${page.title} | ${siteConfig.shortName}`,
      description: page.metaDescription || siteConfig.description,
      url: `${siteUrl}/${page.slug}`,
      siteName: siteConfig.name,
      type: "article",
    },
  };
}

export default async function CustomCmsPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const lastUpdated = page.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center space-x-2 text-xs text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none">
            {page.title}
          </li>
        </ol>
      </nav>

      {/* Header Banner */}
      <header className="mb-10 border-b border-border/60 pb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
          <span>SDGC Resource</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
          {page.title}
        </h1>
        {lastUpdated && (
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
            Last updated on {lastUpdated}
          </p>
        )}
      </header>

      {/* Main Content Body */}
      <article className="prose prose-slate dark:prose-invert max-w-none">
        <MarkdownContent content={page.content} />
      </article>

      {/* Bottom Navigation */}
      <div className="mt-12 pt-8 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          ← Return to Home
        </Link>
        <Link
          href="/events"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-2xs"
        >
          Browse Club Events →
        </Link>
      </div>
    </div>
  );
}
