import type { Metadata } from "next";
import { BlogAdminList } from "@/components/crm/blog/BlogAdminList";

export const metadata: Metadata = {
  title: { absolute: "998 Blogs" },
};

export default function CrmBlogPage() {
  return <BlogAdminList />;
}
