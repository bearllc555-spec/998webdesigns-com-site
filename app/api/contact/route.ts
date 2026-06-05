import { NextRequest, NextResponse } from "next/server";
import { insertContactSubmission } from "@/lib/contact-db";
import { enforceApiRateLimit, rateLimitResponse } from "@/lib/api-rate-limit";
import { notifyCrmActivity } from "@/lib/crm-notify";
import { isValidEmail } from "@/lib/validate-email";
import { readJsonBody } from "@/lib/read-json-body";

export const runtime = "nodejs";

type ContactPayload = {
  name?: string;
  email?: string;
  businessName?: string;
  message?: string;
  website?: string; // honeypot
};

export async function POST(req: NextRequest) {
  const rate = await enforceApiRateLimit(req, "/api/contact");
  if (!rate.allowed) {
    const body = rateLimitResponse(rate.retryAfterSec);
    return NextResponse.json({ error: body.error }, { status: body.status, headers: body.headers });
  }

  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    const status = parsed.error === "Request body too large" ? 413 : 400;
    return NextResponse.json({ error: parsed.error }, { status });
  }
  const body = parsed.body as ContactPayload;

  // Honeypot — silently accept and discard
  if (body.website && typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const businessName =
    typeof body.businessName === "string" ? body.businessName.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const submittedAt = new Date().toISOString();
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;

  const dbResult = await insertContactSubmission({
    name,
    email,
    business_name: businessName || null,
    message,
    submitted_at: submittedAt,
    ip,
  });

  if (!dbResult.ok) {
    console.warn(
      `[contact] contact_submissions persist skipped (${dbResult.reason}):`,
      dbResult.detail
    );
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[contact] RESEND_API_KEY not configured");
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "website@998webdesigns.com",
      to: "hello@998webdesigns.com",
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Company:</strong> ${businessName ? escapeHtml(businessName) : "&nbsp;"}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background-color: #f5f5f5; padding: 12px; border-radius: 4px;">
            ${escapeHtml(message)}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    void notifyCrmActivity({
      kind: "contact",
      fullName: name,
      email,
      businessName: businessName || undefined,
      message,
    });

    return NextResponse.json({ ok: true, saved: dbResult.ok });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return NextResponse.json({ error: "Failed to process contact form" }, { status: 500 });
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
