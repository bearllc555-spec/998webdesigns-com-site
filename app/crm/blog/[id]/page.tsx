import { redirect } from "next/navigation";
import { BlogEditor } from "@/components/crm/blog/BlogEditor";
import { isCrmAuthenticated } from "@/lib/crm-session";

type PageProps = { params: Promise<{ id: string }> };

export default async function CrmBlogEditPage({ params }: PageProps) {
  if (!(await isCrmAuthenticated())) {
    redirect("/crm/login");
  }
  const { id } = await params;
  return <BlogEditor postId={id} />;
}
