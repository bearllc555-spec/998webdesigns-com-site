import { redirect } from "next/navigation";
import { BlogEditor } from "@/components/crm/blog/BlogEditor";
import { isCrmAuthenticated } from "@/lib/crm-session";

export default async function CrmBlogNewPage() {
  if (!(await isCrmAuthenticated())) {
    redirect("/crm/login");
  }
  return <BlogEditor />;
}
