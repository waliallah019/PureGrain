import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getPublishedBlogPage } from "@/lib/blog-cache";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock3, ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface BlogsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export const metadata: Metadata = pageMetadata({
  title: "Leather Sourcing Guides & Insights",
  description:
    "Sourcing guidance, grading explainers and leather industry updates from Pure Grain Exports — written for manufacturers and wholesale buyers.",
  path: "/blogs",
});

function formatDate(value?: string | Date) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const resolvedParams = await searchParams;
  const page = Math.max(1, Number(resolvedParams.page || 1));
  const limit = 9;

  // Cached and projected: the listing renders titles, excerpts and covers, so
  // it no longer pulls each post's full article HTML on every request.
  const { blogs, total } = await getPublishedBlogPage(page, limit);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;
  const featuredPost = blogs[0];
  const remainingPosts = blogs.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-32 pb-14 bg-bone dark:bg-background">
        <div className="container-wide">
          <p className="text-eyebrow mb-3">Knowledge Center</p>
          <h1 className="heading-display text-foreground mb-4">Leather Sourcing Guides &amp; Industry Insights</h1>
          <p className="text-body text-muted-foreground max-w-3xl">
            Practical guidance on grading, tanning and leather sourcing — written for manufacturers and wholesale buyers who need to specify with confidence.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide">
          {blogs.length === 0 ? (
            <div className="border border-border p-10 text-center bg-background">
              <p className="text-lg font-medium text-foreground">No published blog posts yet.</p>
              <p className="text-muted-foreground mt-2">Please check back soon for updates.</p>
            </div>
          ) : (
            <>
              <article className="group border border-border bg-background overflow-hidden mb-8 lg:mb-10 transition-all duration-300 hover:shadow-xl">
                <div className="grid lg:grid-cols-[1.05fr_1fr]">
                  {/* Covers in this library are all 1:1. `aspect-[16/10]` cut
                      38% out of them, and `lg:aspect-auto` + `h-full` stretched
                      the image to whatever height the text column happened to
                      be — an arbitrary, content-dependent crop. A 4:3 frame on
                      large screens keeps the featured card banner-shaped while
                      losing far less of the subject. */}
                  <Link href={`/blogs/${featuredPost.slug}`} className="block overflow-hidden bg-muted">
                    {featuredPost.coverImage ? (
                      <Image
                        src={featuredPost.coverImage}
                        alt={featuredPost.title}
                        width={1024}
                        height={1024}
                        priority
                        sizes="(min-width: 1024px) 52vw, 100vw"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:aspect-[3/2] lg:aspect-[4/3]"
                      />
                    ) : (
                      <div className="aspect-[4/3] w-full bg-gradient-to-br from-leather/10 to-brass/20 sm:aspect-[3/2] lg:aspect-[4/3]" />
                    )}
                  </Link>

                  <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                    <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight mb-4 md:mb-5">
                      <Link href={`/blogs/${featuredPost.slug}`} className="hover:text-brass-ink transition-colors">
                        {featuredPost.title}
                      </Link>
                    </h2>

                    <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-5 line-clamp-3">{featuredPost.excerpt}</p>

                    <p className="text-sm font-semibold text-brass-ink mb-2">By {featuredPost.authorName}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(featuredPost.publishedAt || featuredPost.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {featuredPost.readingTimeMinutes} min read
                      </span>
                    </div>

                    <Button asChild variant="outline" className="w-fit">
                      <Link href={`/blogs/${featuredPost.slug}`}>
                        Read Article
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>

              {remainingPosts.length > 0 && (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8">
                  {remainingPosts.map((post) => (
                    <article
                      key={String(post._id)}
                      className="group border border-border bg-background overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      {/* Was `aspect-[16/9]`, which threw away 44% of a square
                          cover — the process-diagram cover lost its whole top
                          and bottom row, and product shots were cut mid-object.
                          4:3 keeps the card compact while showing far more of
                          the subject. */}
                      {post.coverImage ? (
                        <div className="aspect-[4/3] overflow-hidden bg-muted">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            width={1024}
                            height={1024}
                            loading="lazy"
                            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-gradient-to-br from-leather/10 to-brass/20" />
                      )}

                      <div className="p-5">
                        <h3 className="text-2xl font-semibold text-foreground mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-sm font-semibold text-brass-ink mb-2">By {post.authorName}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(post.publishedAt || post.createdAt)}
                          </span>
                        </div>

                        {post.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/blogs/${post.slug}`}>
                            Read Article
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="mt-10 flex items-center justify-center gap-2">
                {hasPreviousPage && (
                  <Button asChild variant="outline">
                    <Link href={`/blogs?page=${page - 1}`}>Previous</Link>
                  </Button>
                )}

                <span className="text-sm text-muted-foreground px-3">
                  Page {page} of {totalPages}
                </span>

                {hasNextPage && (
                  <Button asChild variant="outline">
                    <Link href={`/blogs?page=${page + 1}`}>Next</Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
