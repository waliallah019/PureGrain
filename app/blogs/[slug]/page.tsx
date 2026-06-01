import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/config/db";
import blogService from "@/lib/services/blogService";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import { BackToTopButton } from "@/components/blog/BackToTopButton";

export const dynamic = "force-dynamic";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.puregrainexports.com").replace(/\/$/, "");

function formatDate(value?: Date) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractTocAndEnhanceContent(content: string): { enhancedContent: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const slugCount = new Map<string, number>();

  const enhancedContent = content.replace(/<h([23])(.*?)>([\s\S]*?)<\/h\1>/gi, (fullMatch, levelRaw, attrs, innerHtml) => {
    const level = Number(levelRaw) as 2 | 3;
    const plainText = innerHtml.replace(/<[^>]*>/g, "").trim();

    if (!plainText) {
      return fullMatch;
    }

    const existingIdMatch = attrs.match(/\sid=["']([^"']+)["']/i);
    let id = existingIdMatch?.[1] || slugifyHeading(plainText);

    if (!id) {
      return fullMatch;
    }

    const count = slugCount.get(id) || 0;
    if (!existingIdMatch && count > 0) {
      id = `${id}-${count + 1}`;
    }
    slugCount.set(id, count + 1);

    toc.push({ id, text: plainText, level });

    if (existingIdMatch) {
      return `<h${level}${attrs}>${innerHtml}</h${level}>`;
    }

    return `<h${level}${attrs} id="${id}">${innerHtml}</h${level}>`;
  });

  return { enhancedContent, toc };
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  await connectDB();
  const resolvedParams = await params;
  const post = await blogService.getBlogBySlug(resolvedParams.slug);

  if (!post) {
    return {
      title: "Blog Not Found | Pure Grain",
      description: "The requested blog post could not be found.",
    };
  }

  return {
    title: post.seoTitle || `${post.title} | Pure Grain Blogs`,
    description: post.seoDescription || post.excerpt,
    alternates: {
      canonical: `${SITE_URL}/blogs/${post.slug}`,
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  await connectDB();
  const resolvedParams = await params;
  const post = await blogService.getBlogBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const { enhancedContent, toc } = extractTocAndEnhanceContent(post.content);

  return (
    <div id="blog-top" className="min-h-screen bg-background">
      <Header />

      <article className="pt-32 pb-20">
        <div className="container-wide">
          <Button asChild variant="ghost" className="mb-4 -ml-3">
            <Link href="/blogs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blogs
            </Link>
          </Button>

          <section className="mb-10 border border-border bg-bone/35 dark:bg-muted/20">
            <div className="grid lg:grid-cols-[1fr_0.95fr] gap-6 lg:gap-8 p-5 md:p-7 lg:p-8 items-start">
              <div>
                <p className="text-label text-brass mb-2">Pure Grain Insight</p>
                <h1 className="heading-display text-foreground mb-4">{post.title}</h1>

                <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground mb-4">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(post.publishedAt || post.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4" />
                    {post.readingTimeMinutes} min read
                  </span>
                  <span>By {post.authorName}</span>
                </div>

                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {post.coverImage ? (
                <div className="overflow-hidden border border-border bg-muted">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-[220px] sm:h-[280px] md:h-[320px] object-cover"
                  />
                </div>
              ) : null}
            </div>
          </section>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8 xl:gap-10">
            <div>
              <div
                className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-serif prose-a:text-brass prose-h2:scroll-mt-28 prose-h3:scroll-mt-28"
                dangerouslySetInnerHTML={{ __html: enhancedContent }}
              />
            </div>

            {toc.length > 0 ? (
              <aside className="hidden lg:block">
                <div className="sticky top-28 border border-border bg-background p-5">
                  <p className="text-xl font-semibold text-foreground mb-4">Table of Contents</p>
                  <nav aria-label="Table of contents">
                    <ul className="space-y-2 text-sm">
                      {toc.map((item) => (
                        <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                          <a
                            href={`#${item.id}`}
                            className="text-muted-foreground hover:text-brass transition-colors line-clamp-2"
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </article>

      <BackToTopButton />

      <Footer />
    </div>
  );
}
