import Link from "next/link";
import { Metadata } from "next";
import connectDB from "@/lib/config/db";
import blogService from "@/lib/services/blogService";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock3, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface BlogsPageProps {
  searchParams: Promise<{ page?: string }>;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.puregrainexports.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Blogs | Pure Grain",
  description: "Insights, sourcing tips, and leather industry updates from Pure Grain.",
  alternates: {
    canonical: `${SITE_URL}/blogs`,
  },
};

function formatDate(value?: Date) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  await connectDB();

  const resolvedParams = await searchParams;
  const page = Math.max(1, Number(resolvedParams.page || 1));
  const limit = 9;

  const { blogs, total } = await blogService.getBlogs(
    {
      status: "published",
      includeDraft: false,
    },
    page,
    limit,
    "publishedAt",
    "desc"
  );

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
          <p className="text-label text-brass mb-3">Knowledge Center</p>
          <h1 className="heading-display text-foreground mb-4">Pure Grain Blogs</h1>
          <p className="text-body text-muted-foreground max-w-3xl">
            Stay updated with leather sourcing insights, manufacturing guidance, and practical trends for wholesale buyers.
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
                  <Link href={`/blogs/${featuredPost.slug}`} className="block overflow-hidden bg-muted">
                    {featuredPost.coverImage ? (
                      <img
                        src={featuredPost.coverImage}
                        alt={featuredPost.title}
                        className="h-full w-full object-cover aspect-[16/10] lg:aspect-auto lg:min-h-[360px] transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full min-h-[260px] bg-gradient-to-br from-leather/10 to-brass/20" />
                    )}
                  </Link>

                  <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                    <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight mb-4 md:mb-5">
                      <Link href={`/blogs/${featuredPost.slug}`} className="hover:text-brass transition-colors">
                        {featuredPost.title}
                      </Link>
                    </h2>

                    <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-5 line-clamp-3">{featuredPost.excerpt}</p>

                    <p className="text-sm font-semibold text-brass mb-2">By {featuredPost.authorName}</p>
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
                      {post.coverImage ? (
                        <div className="aspect-[16/9] overflow-hidden bg-muted">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-gradient-to-br from-leather/10 to-brass/20" />
                      )}

                      <div className="p-5">
                        <h3 className="text-2xl font-semibold text-foreground mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-sm font-semibold text-brass mb-2">By {post.authorName}</p>
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
