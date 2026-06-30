import type { Metadata } from "next";
import { BlogAdminList } from "@/components/crm/blog/BlogAdminList";

export const metadata: Metadata = {
  title: { absolute: "Blog CRM" },
};

export default function CrmBlogPage() {
  return <BlogAdminList />;
}
