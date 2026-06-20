import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Schedule your call - 998 web designs",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

/** Legacy intake URLs redirect to scheduling (brief step removed). */
export default async function DiscoveryIntakePage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (token?.trim()) {
    redirect(`/book/schedule?token=${encodeURIComponent(token.trim())}`);
  }
  redirect("/book/schedule");
}
