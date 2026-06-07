export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  tags?: string[];
  featured?: boolean;
};

export type BlogPost = BlogPostMeta & {
  content: string;
  readingMinutes: number;
};
