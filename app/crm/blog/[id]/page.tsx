import { BlogEditor } from "@/components/crm/blog/BlogEditor";

type PageProps = { params: Promise<{ id: string }> };

export default async function CrmBlogEditPage({ params }: PageProps) {
  const { id } = await params;
  return <BlogEditor postId={id} />;
}
