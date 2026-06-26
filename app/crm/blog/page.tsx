import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BlogAdminList } from "@/components/crm/blog/BlogAdminList";
import { isCrmAuthenticated } from "@/lib/crm-session";

export const metadata: Metadata = {
  title: { absolute: "Blog CRM" },
};

export default async function CrmBlogPage() {
  if (!(await isCrmAuthenticated())) {
    redirect("/crm/login");
  }
  return <BlogAdminList />;
}
