"use client";

import { useEffect, useState } from "react";

type SmsMessage = {
  id: string;
  created_at: string;
  body: string;
  from_phone: string;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

type Props = {
  enabled: boolean;
  prospectId?: string;
  leadId?: string;
};

export function CrmSmsThread({ enabled, prospectId, leadId }: Props) {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || (!prospectId && !leadId)) return;
    setLoading(true);
    void (async () => {
      try {
        const url = leadId
          ? `/api/crm/leads/${leadId}/sms`
          : `/api/crm/discovery/${prospectId}/sms`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: SmsMessage[] };
        setMessages(data.messages ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [enabled, prospectId, leadId]);

  if (!enabled) return null;
  if (loading) return <p className="mt-4 text-xs text-ink-soft">Loading texts…</p>;
  if (!messages.length) return null;

  return (
    <div className="mt-4 border-t border-rule pt-4">
      <p className="text-sm font-medium text-ink">Inbound texts</p>
      <ul className="mt-2 space-y-2">
        {messages.map((msg) => (
          <li key={msg.id} className="rounded-md border border-rule bg-rule-soft/20 px-3 py-2 text-sm">
            <p className="text-xs text-ink-soft">{formatWhen(msg.created_at)}</p>
            <p className="mt-1 whitespace-pre-wrap text-ink">{msg.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
