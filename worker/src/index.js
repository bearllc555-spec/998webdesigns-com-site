/**
 * 998WebDesigns - AgentMail Auto-Responder
 * Cloudflare Worker
 *
 * Triggered instantly by AgentMail webhooks on message.received.
 * AgentMail delivers via Svix - verify svix-* headers, not x-webhook-secret.
 */

import { Webhook } from "svix";

const INBOX_ID = "998webdesigns@agentmail.to";
const REPLY_FROM_DISPLAY = "hello@998webdesigns.com";

const SKIP_SENDERS = [
  "noreply",
  "no-reply",
  "mailer-daemon",
  "forwarding-noreply",
  "donotreply",
  "do-not-reply",
  "notifications@",
  "bounce",
  "support@",
  "alerts@",
  "postmaster@",
];

const SKIP_SUBJECTS = [
  "forwarding confirmation",
  "delivery status notification",
  "out of office",
  "automatic reply",
  "auto-reply",
  "auto reply",
  "unsubscribe",
  "mail delivery failed",
  "returned mail",
];

function senderText(message) {
  const from = message?.from;
  if (typeof from === "string") return from.toLowerCase();
  if (from && typeof from === "object") {
    const email = from.email || from.address || "";
    const name = from.name || "";
    return `${name} ${email}`.trim().toLowerCase();
  }
  return "";
}

function isHumanInquiry(message) {
  const sender = senderText(message);
  const subject = (message.subject || "").toLowerCase();

  if (sender.includes("998webdesigns@agentmail.to")) return false;
  if (sender.includes("998webdesigns.com") && sender.includes("noreply")) return false;
  if (SKIP_SENDERS.some((s) => sender.includes(s))) return false;
  if (SKIP_SUBJECTS.some((s) => subject.includes(s))) return false;

  return true;
}

function buildReplyText(originalMessage) {
  const senderName = extractFirstName(senderText(originalMessage));
  const greeting = senderName ? `Hi ${senderName},` : "Hi there,";

  return `${greeting}

Thank you for reaching out to 998WebDesigns!

I'm Anthony's AI agent - I'm writing to let you know that your message has been received loud and clear. Anthony will personally review it and get back to you shortly.

In the meantime, feel free to visit our website or reply to this email if you have anything to add.

Talk soon,

998WebDesigns AI Agent
On behalf of Anthony DeMeo | 998WebDesigns
https://998webdesigns.com`;
}

function buildReplyHtml(originalMessage) {
  const senderName = extractFirstName(senderText(originalMessage));
  const greeting = senderName ? `Hi ${senderName},` : "Hi there,";

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; font-size: 15px; color: #222; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>Thank you for reaching out to <strong>998WebDesigns</strong>!</p>
  <p>
    I'm Anthony's AI agent - I'm writing to let you know that your message has been received
    loud and clear. Anthony will personally review it and get back to you shortly.
  </p>
  <p>
    In the meantime, feel free to visit our website or reply to this email if you have anything to add.
  </p>
  <p>Talk soon,</p>
  <br>
  <p style="color: #555; font-size: 13px;">
    <strong>998WebDesigns AI Agent</strong><br>
    On behalf of Anthony DeMeo | 998WebDesigns<br>
    <a href="https://998webdesigns.com" style="color: #0066cc;">998webdesigns.com</a>
  </p>
</body>
</html>`;
}

function extractFirstName(fromField) {
  const match = fromField.match(/^([^<@]+)/);
  if (!match) return null;
  const name = match[1].trim().split(" ")[0];
  if (!name || name.length < 2 || name.includes("@") || /\d/.test(name)) return null;
  return name;
}

function replyTarget(message) {
  if (Array.isArray(message.reply_to) && message.reply_to.length) {
    const first = message.reply_to[0];
    return typeof first === "string" ? first : first?.email || first?.address;
  }
  const from = message.from;
  if (typeof from === "string") {
    const emailMatch = from.match(/<([^>]+)>/);
    return emailMatch ? emailMatch[1] : from.includes("@") ? from : null;
  }
  if (from && typeof from === "object") return from.email || from.address || null;
  return null;
}

async function sendAutoReply(message, apiKey) {
  const replyTo = replyTarget(message);
  if (!replyTo) {
    throw new Error("Could not determine reply recipient from message.from / reply_to");
  }

  const subject = message.subject?.startsWith("Re:")
    ? message.subject
    : `Re: ${message.subject || "(no subject)"}`;

  const payload = {
    to: [replyTo],
    subject,
    reply_to: [REPLY_FROM_DISPLAY],
    text: buildReplyText(message),
    html: buildReplyHtml(message),
  };

  const response = await fetch(`https://api.agentmail.to/v0/inboxes/${INBOX_ID}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AgentMail send failed: ${response.status} - ${err}`);
  }

  return await response.json();
}

function verifyWebhook(request, rawBody, env) {
  const signingSecret = env.AGENTMAIL_WEBHOOK_SIGNING_SECRET?.trim();
  if (signingSecret) {
    const wh = new Webhook(signingSecret);
    wh.verify(rawBody, {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    });
    return;
  }

  // Legacy fallback - AgentMail does not send this header by default.
  const legacySecret = env.WEBHOOK_SECRET?.trim();
  if (!legacySecret) return;

  const incomingSecret = request.headers.get("x-webhook-secret") || "";
  if (incomingSecret !== legacySecret) {
    throw new Error("invalid legacy webhook secret");
  }
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const rawBody = await request.text();

    try {
      verifyWebhook(request, rawBody, env);
    } catch (err) {
      console.warn("Rejected webhook:", err instanceof Error ? err.message : err);
      return new Response("Unauthorized", { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (payload.event_type !== "message.received") {
      return new Response("Ignored: not a message.received event", { status: 200 });
    }

    const message = payload.message;
    if (!message) {
      return new Response("No message in payload", { status: 400 });
    }

    if (!isHumanInquiry(message)) {
      console.log(`Skipped auto-reply for: ${senderText(message)} | ${message.subject}`);
      return new Response("Skipped: automated sender", { status: 200 });
    }

    try {
      const result = await sendAutoReply(message, env.AGENTMAIL_API_KEY);
      console.log(`Auto-reply sent to ${replyTarget(message)} | message_id: ${result.message_id}`);
      return new Response(JSON.stringify({ ok: true, message_id: result.message_id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Auto-reply failed:", err.message);
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  },
};
