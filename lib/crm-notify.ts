import { stripeKeyMode } from "@/lib/stripe-env";
import { sendTelegramHtml, telegramLine } from "@/lib/telegram";

export type CrmNotifyKind =
  | "lead_submitted"
  | "lead_checkout"
  | "lead_paid"
  | "lead_ach_pending"
  | "lead_ach_failed"
  | "lead_hosting_payment_failed"
  | "lead_hosting_canceled"
  | "contact";

const KIND_LABEL: Record<CrmNotifyKind, string> = {
  lead_submitted: "New lead — form submitted",
  lead_checkout: "Lead — checkout link sent",
  lead_paid: "Lead — paid in full",
  lead_ach_pending: "Lead — ACH pending settlement",
  lead_ach_failed: "Lead — ACH failed",
  lead_hosting_payment_failed: "Hosting — renewal failed",
  lead_hosting_canceled: "Hosting — subscription ended",
  contact: "Contact form",
};

export type CrmNotifyInput = {
  kind: CrmNotifyKind;
  businessName?: string;
  fullName?: string;
  email?: string;
  status?: string;
  hostingChoice?: string;
  paymentChannel?: string;
  amount?: string;
  stripeSessionId?: string;
  stripeSubscriptionId?: string;
  message?: string;
  checkoutUrl?: string;
};

function stripeDashBase(): string {
  return stripeKeyMode() === "live"
    ? "https://dashboard.stripe.com"
    : "https://dashboard.stripe.com/test";
}

function crmUrl(): string {
  return "https://998webdesigns.com/crm";
}

/** Push activity to Telegram (and log). Does not block checkout on failure. */
export async function notifyCrmActivity(input: CrmNotifyInput): Promise<void> {
  const lines: string[] = [
    `<b>${KIND_LABEL[input.kind]}</b>`,
    telegramLine("Site", "998webdesigns.com"),
  ];

  if (input.businessName) lines.push(telegramLine("Business", input.businessName));
  if (input.fullName) lines.push(telegramLine("Name", input.fullName));
  if (input.email) lines.push(telegramLine("Email", input.email));
  if (input.status) lines.push(telegramLine("Status", input.status));
  if (input.hostingChoice) lines.push(telegramLine("Hosting", input.hostingChoice));
  if (input.paymentChannel) lines.push(telegramLine("Pay", input.paymentChannel));
  if (input.amount) lines.push(telegramLine("Amount", input.amount));
  if (input.message) {
    const short =
      input.message.length > 400 ? `${input.message.slice(0, 397)}...` : input.message;
    lines.push(telegramLine("Message", short));
  }
  if (input.checkoutUrl) {
    lines.push(`<a href="${input.checkoutUrl}">Open Checkout</a>`);
  }
  if (input.stripeSessionId) {
    const dash = stripeDashBase();
    lines.push(
      `<a href="${dash}/checkout/sessions/${input.stripeSessionId}">Stripe session</a>`
    );
  }
  if (input.stripeSubscriptionId) {
    const dash = stripeDashBase();
    lines.push(
      `<a href="${dash}/subscriptions/${input.stripeSubscriptionId}">Stripe subscription</a>`
    );
  }

  lines.push(`<a href="${crmUrl()}">Open CRM</a>`);

  const html = lines.join("\n");
  console.info(`[crm-notify] ${input.kind}`, input.email ?? input.businessName ?? "");
  await sendTelegramHtml(html);
}
