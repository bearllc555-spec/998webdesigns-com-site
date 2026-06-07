import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
};

export function BlogPostBody({ content }: Props) {
  return (
    <div className="blog-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (!href) return <span>{children}</span>;
            const isInternal = href.startsWith("/");
            if (isInternal) {
              return (
                <Link href={href} className="blog-prose-link">
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                className="blog-prose-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
