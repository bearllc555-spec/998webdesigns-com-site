import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { getAllPosts } from "@/lib/blog";
import { withSiteSeo } from "@/lib/site-origin";

export const metadata: Metadata = withSiteSeo("/blog", {
  title: "Field notes - 998 web designs",
  description:
    "Practical advice for local service businesses - websites, Google Business Profile, local SEO, and getting the phone to ring.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Field notes - 998 web designs",
    description:
      "Practical advice for local service businesses - websites, Google Business Profile, local SEO, and getting the phone to ring.",
  },
});

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-5 pt-6 pb-12 md:px-8 md:pb-16">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                Field notes
              </p>
              <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight text-ink md:text-5xl">
                Practical advice for local businesses that want the phone to ring.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-ink-soft">
                No fluff - websites, Google Business Profile, local search, and what
                actually moves the needle when you run a service business.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
          {posts.length === 0 ? (
            <p className="text-ink-soft">New articles coming soon.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
