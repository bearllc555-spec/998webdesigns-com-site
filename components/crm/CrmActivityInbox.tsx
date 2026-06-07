"use client";

import { useCallback, useState } from "react";
import { SubmissionFieldStack } from "@/components/form-field-stack";
import { CrmDiscoveryClosePanel } from "@/components/crm/CrmDiscoveryClosePanel";
import { CrmMilestoneInvoicePanel } from "@/components/crm/CrmMilestoneInvoicePanel";
import { CrmSmsThread } from "@/components/crm/CrmSmsThread";
import { CrmInboxFlagButton } from "@/components/crm/CrmInboxFlagButton";
import { nextCrmInboxFlag } from "@/lib/crm-inbox-flag";
import { isCrmFeedItemUnread, type CrmFeedItem } from "@/lib/crm-feed";
import type { DiscoveryCloseDraft } from "@/lib/discovery-types";

type PendingDelete = {
  source: "lead" | "client" | "contact" | "discovery" | "sms" | "voice_demo";
  id: string;
  label: string;
  step: 1 | 2;
};

function sourceLabel(source: CrmFeedItem["source"]): string {
  if (source === "lead") return "Lead";
  if (source === "client") return "Client";
  if (source === "discovery") return "Discovery";
  if (source === "sms") return "Text";
  if (source === "voice_demo") return "Voice demo";
  return "Contact";
}

function isWdLeadFeedItem(item: CrmFeedItem): boolean {
  return item.source === "lead" || item.source === "client";
}

function itemKey(item: CrmFeedItem): string {
  return `${item.source}-${item.id}`;
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatListWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function statusClass(status: string | null): string {
  if (!status) return "bg-rule-soft text-ink-soft";
  if (status === "paid_in_full") return "bg-success/15 text-success";
  if (status === "deposit_paid") return "bg-success/15 text-success";
  if (status === "milestone2_paid") return "bg-success/15 text-success";
  if (status.includes("failed") || status === "bank_payment_failed") {
    return "bg-warn-soft text-warn";
  }
  if (status.includes("awaiting")) return "bg-accent/10 text-accent";
  return "bg-rule-soft text-ink-soft";
}

function previewLine(item: CrmFeedItem): string {
  if (item.message?.trim()) {
    const t = item.message.trim().replace(/\s+/g, " ");
    return t.length > 72 ? `${t.slice(0, 69)}…` : t;
  }
  if (item.status) return item.status.replace(/_/g, " ");
  return item.email;
}

type CrmActivityInboxProps = {
  contactItems: CrmFeedItem[];
  leadItems: CrmFeedItem[];
  clientItems: CrmFeedItem[];
  discoveryItems: CrmFeedItem[];
  smsItems: CrmFeedItem[];
  onItemsChange: (updater: (prev: CrmFeedItem[]) => CrmFeedItem[]) => void;
  onReload: () => Promise<void>;
};

type InboxRowProps = {
  item: CrmFeedItem;
  expanded: boolean;
  onToggle: () => void;
  pendingDelete: PendingDelete | null;
  deleting: boolean;
  readBusy: boolean;
  flagBusy: boolean;
  onCycleFlag: (item: CrmFeedItem) => void;
  editingNotes: boolean;
  notesDraft: string;
  onNotesDraftChange: (v: string) => void;
  onSetReadState: (item: CrmFeedItem, read: boolean) => void;
  onStartDelete: (item: CrmFeedItem) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onStartEditNotes: (item: CrmFeedItem) => void;
  onSaveNotes: (item: CrmFeedItem) => void;
  onCancelEditNotes: () => void;
  onReload: () => Promise<void>;
};

function InboxRow({
  item,
  expanded,
  onToggle,
  pendingDelete,
  deleting,
  readBusy,
  flagBusy,
  onCycleFlag,
  editingNotes,
  notesDraft,
  onNotesDraftChange,
  onSetReadState,
  onStartDelete,
  onConfirmDelete,
  onCancelDelete,
  onStartEditNotes,
  onSaveNotes,
  onCancelEditNotes,
  onReload,
}: InboxRowProps) {
  const unread = isCrmFeedItemUnread(item);
  const company = item.businessName.trim();
  const isDeleting =
    pendingDelete?.source === item.source && pendingDelete.id === item.id;

  return (
    <li className={expanded ? "bg-accent/[0.04]" : undefined}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`crm-inbox-row-interactive flex w-full items-stretch ${
          expanded
            ? "bg-accent/[0.08]"
            : unread
              ? "crm-inbox-row-unread dark:bg-zinc-700/50"
              : "crm-inbox-row-read dark:bg-zinc-900/35"
        }`}
      >
      <div className="crm-inbox-row-body flex min-w-0 flex-1 items-center gap-2.5 bg-transparent px-4 py-2 text-left">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            unread ? "bg-accent" : "bg-transparent"
          }`}
          aria-hidden
        />
        <span className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
            <span
              className={`max-w-[38%] shrink-0 truncate text-sm ${
                unread
                  ? "crm-inbox-row-unread-text"
                  : "crm-inbox-row-read-text dark:text-zinc-500"
              }`}
            >
              {item.title || item.email}
            </span>
            {!expanded && (company || previewLine(item)) && (
              <>
                <span
                  className={`shrink-0 text-xs ${
                    unread
                      ? "crm-inbox-row-unread-text opacity-50"
                      : "crm-inbox-row-read-text opacity-50 dark:text-zinc-600"
                  }`}
                  aria-hidden
                >
                  ·
                </span>
                <span
                  className={`min-w-0 truncate text-xs ${
                    unread
                      ? "crm-inbox-row-unread-text"
                      : "crm-inbox-row-read-text dark:text-zinc-600"
                  }`}
                >
                  {company ? `${company} · ` : ""}
                  {previewLine(item)}
                </span>
              </>
            )}
          </span>
          <span
            className={`flex shrink-0 items-center gap-2 text-xs ${
              unread
                ? "crm-inbox-row-unread-text"
                : "crm-inbox-row-read-text dark:text-zinc-600"
            }`}
          >
            <span>{formatListWhen(item.at)}</span>
            <span
              className={`inline-block transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden
            >
              ▾
            </span>
          </span>
        </span>
      </div>
      <div
        className="flex shrink-0 items-center gap-1 self-stretch py-2 pr-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {!expanded && unread && (
          <span className="crm-inbox-row-unread-text rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider dark:bg-accent/15">
            Unread
          </span>
        )}
        {!expanded && !unread && (
          <span className="crm-inbox-row-read-badge crm-inbox-row-read-text rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
            Read
          </span>
        )}
        <CrmInboxFlagButton
          flag={item.inboxFlag}
          disabled={flagBusy}
          onCycle={() => onCycleFlag(item)}
        />
      </div>
      </div>

      {expanded && (
        <div className="border-t border-rule bg-bg px-4 py-5 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate">
                {sourceLabel(item.source)} · {formatWhen(item.at)}
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">
                {item.title}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CrmInboxFlagButton
                flag={item.inboxFlag}
                disabled={flagBusy}
                onCycle={() => onCycleFlag(item)}
              />
              {item.status && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(item.status)}`}
                >
                  {item.status.replace(/_/g, " ")}
                </span>
              )}
              <button
                type="button"
                disabled={readBusy}
                onClick={() => onSetReadState(item, isCrmFeedItemUnread(item))}
                className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:border-accent/50 disabled:opacity-60"
              >
                {isCrmFeedItemUnread(item) ? "Mark read" : "Mark unread"}
              </button>
              {!isDeleting && (
                <button
                  type="button"
                  onClick={() => onStartDelete(item)}
                  className="rounded-full border border-warn/40 px-3 py-1 text-xs font-medium text-warn hover:bg-warn-soft/40"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onToggle}
                className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:border-accent/50"
              >
                Close
              </button>
            </div>
          </div>

          {isDeleting && pendingDelete && (
            <div className="mt-4 rounded-xl border border-warn/40 bg-warn-soft/30 p-4">
              <p className="text-sm font-medium text-ink">
                {pendingDelete.step === 1
                  ? `Delete this ${sourceLabel(item.source).toLowerCase()}?`
                  : "Final confirmation — this cannot be undone"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={onConfirmDelete}
                  className="rounded-full bg-warn px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {deleting
                    ? "Deleting…"
                    : pendingDelete.step === 1
                      ? "Continue"
                      : "Delete permanently"}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={onCancelDelete}
                  className="rounded-full border border-rule px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <SubmissionFieldStack
            name={item.title}
            company={item.businessName}
            email={item.email || ""}
            message={item.message ?? undefined}
            messagePlaceholder={
              isWdLeadFeedItem(item)
                ? item.source === "client"
                  ? "Active client — notes, milestones, and payload below."
                  : "Project brief — see notes and payload below."
                : item.source === "sms"
                  ? "Inbound SMS"
                  : undefined
            }
          />

          {item.source === "discovery" && !isDeleting && (
            <>
              <CrmSmsThread
                leadId={
                  typeof item.payload?.wdLeadId === "string"
                    ? item.payload.wdLeadId
                    : undefined
                }
                prospectId={
                  typeof item.payload?.wdLeadId === "string" ? undefined : item.id
                }
                enabled={Boolean(item.payload?.hasSmsThread) || expanded}
              />
              <div className="mt-4 border-t border-rule pt-4">
                {editingNotes ? (
                  <div className="grid gap-2">
                    <textarea
                      value={notesDraft}
                      onChange={(e) => onNotesDraftChange(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-rule bg-bg px-3 py-2 text-sm"
                      placeholder="Call notes — scope discussed, objections, follow-ups…"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onSaveNotes(item)}
                        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white"
                      >
                        Save notes
                      </button>
                      <button
                        type="button"
                        onClick={onCancelEditNotes}
                        className="rounded-full border border-rule px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStartEditNotes(item)}
                    className="text-sm text-accent hover:underline"
                  >
                    {item.notes ? "Edit call notes" : "Add call notes"}
                  </button>
                )}
                {item.notes && !editingNotes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{item.notes}</p>
                )}
              </div>
              <CrmDiscoveryClosePanel
                prospectId={item.id}
                phone={item.phone}
                email={item.email}
                phoneVerified={
                  item.status === "phone_verified" ||
                  item.status === "email_verified" ||
                  item.status === "intake_complete" ||
                  item.status === "close_sent" ||
                  item.status === "deposit_paid" ||
                  item.status === "paid"
                }
                intakeComplete={
                  item.status === "intake_complete" ||
                  item.status === "close_sent" ||
                  item.status === "deposit_paid" ||
                  item.status === "paid"
                }
                businessName={item.businessName}
                closeDraft={(item.payload?.closeDraft as DiscoveryCloseDraft | null) ?? null}
              />
            </>
          )}

          {isWdLeadFeedItem(item) && !isDeleting && (
            <>
              <CrmSmsThread
                leadId={item.id}
                enabled={Boolean(item.payload?.hasSmsThread) || expanded}
              />
              <div className="mt-4 border-t border-rule pt-4">
              {editingNotes ? (
                <div className="grid gap-2">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => onNotesDraftChange(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-rule bg-bg px-3 py-2 text-sm"
                    placeholder={
                      item.source === "client" ? "Client notes…" : "Internal notes…"
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onSaveNotes(item)}
                      className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={onCancelEditNotes}
                      className="rounded-full border border-rule px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartEditNotes(item)}
                  className="text-sm text-accent hover:underline"
                >
                  {item.notes ? "Edit notes" : "Add notes"}
                </button>
              )}
              {item.notes && !editingNotes && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">
                  {item.notes}
                </p>
              )}
              <CrmMilestoneInvoicePanel
                leadId={item.id}
                status={item.status}
                payload={item.payload}
                phone={
                  typeof item.payload?.phone === "string" ? item.payload.phone : item.phone
                }
                email={item.email}
                onSent={() => void onReload()}
              />
              </div>
            </>
          )}

          {item.stripeSessionId && (
            <p className="mt-4 break-all text-xs text-ink-soft">
              Stripe session: {item.stripeSessionId}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function InboxSection({
  title,
  items,
  selectedKey,
  rowProps,
  emptyLabel,
}: {
  title: string;
  items: CrmFeedItem[];
  selectedKey: string | null;
  rowProps: Omit<InboxRowProps, "item" | "expanded" | "onToggle"> & {
    onToggleFor: (item: CrmFeedItem) => () => void;
  };
  emptyLabel: string;
}) {
  const unread = items.filter(isCrmFeedItemUnread).length;

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-rule bg-bg shadow-sm">
      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
        <h2 className="font-display text-base font-medium text-ink">{title}</h2>
        <span className="text-xs text-ink-soft">
          {unread > 0 ? `${unread} unread · ` : ""}
          {items.length} total
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-soft">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-rule">
          {items.map((item) => {
            const key = itemKey(item);
            return (
              <InboxRow
                key={key}
                item={item}
                expanded={selectedKey === key}
                onToggle={rowProps.onToggleFor(item)}
                {...rowProps}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function CrmActivityInbox({
  contactItems,
  leadItems,
  clientItems,
  discoveryItems,
  smsItems,
  onItemsChange,
  onReload,
}: CrmActivityInboxProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [readBusy, setReadBusy] = useState(false);
  const [flagBusy, setFlagBusy] = useState(false);

  const patchItemRead = useCallback(
    (item: CrmFeedItem, read: boolean) => {
      const readAt = read ? new Date().toISOString() : null;
      onItemsChange((prev) =>
        prev.map((i) =>
          i.source === item.source && i.id === item.id ? { ...i, readAt } : i
        )
      );
    },
    [onItemsChange]
  );

  const patchItemFlag = useCallback(
    (item: CrmFeedItem, inboxFlag: CrmFeedItem["inboxFlag"]) => {
      onItemsChange((prev) =>
        prev.map((i) =>
          i.source === item.source && i.id === item.id ? { ...i, inboxFlag } : i
        )
      );
    },
    [onItemsChange]
  );

  async function cycleFlag(item: CrmFeedItem) {
    const next = nextCrmInboxFlag(item.inboxFlag);
    setFlagBusy(true);
    const prev = item.inboxFlag;
    patchItemFlag(item, next);
    try {
      const res = await fetch(`/api/crm/items/${item.source}/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag: next }),
      });
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) {
        patchItemFlag(item, prev);
        return;
      }
      const data = (await res.json()) as { flag: string | null };
      const flag =
        data.flag === "star" || data.flag === "check" || data.flag === "alert"
          ? data.flag
          : null;
      patchItemFlag(item, flag);
    } catch {
      patchItemFlag(item, prev);
    } finally {
      setFlagBusy(false);
    }
  }

  async function setReadState(item: CrmFeedItem, read: boolean) {
    setReadBusy(true);
    const prevReadAt = item.readAt;
    patchItemRead(item, read);
    try {
      const res = await fetch(`/api/crm/items/${item.source}/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) {
        patchItemRead(item, prevReadAt == null ? false : true);
        return;
      }
      const data = (await res.json()) as { readAt: string | null };
      onItemsChange((prev) =>
        prev.map((i) =>
          i.source === item.source && i.id === item.id
            ? { ...i, readAt: data.readAt }
            : i
        )
      );
    } catch {
      patchItemRead(item, prevReadAt == null ? false : true);
    } finally {
      setReadBusy(false);
    }
  }

  function toggleItem(item: CrmFeedItem) {
    const key = itemKey(item);
    if (selectedKey === key) {
      setSelectedKey(null);
      setPendingDelete(null);
      setEditingNotes(false);
      return;
    }
    setSelectedKey(key);
    setPendingDelete(null);
    setEditingNotes(false);
    if (isCrmFeedItemUnread(item)) {
      void setReadState(item, true);
    }
  }

  async function saveNotes(item: CrmFeedItem) {
    const url =
      item.source === "discovery"
        ? `/api/crm/discovery/${item.id}/notes`
        : `/api/crm/leads/${item.id}/notes`;
    const res = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesDraft }),
    });
    if (!res.ok) return;
    setEditingNotes(false);
    await onReload();
  }

  const sharedRowProps = {
    pendingDelete,
    deleting,
    readBusy,
    flagBusy,
    onCycleFlag: cycleFlag,
    editingNotes,
    notesDraft,
    onNotesDraftChange: setNotesDraft,
    onSetReadState: setReadState,
    onStartDelete: (item: CrmFeedItem) => {
      setEditingNotes(false);
      setPendingDelete({
        source: item.source,
        id: item.id,
        label: item.businessName || item.title || item.email,
        step: 1,
      });
    },
    onConfirmDelete: async () => {
      if (!pendingDelete) return;
      if (pendingDelete.step === 1) {
        setPendingDelete({ ...pendingDelete, step: 2 });
        return;
      }
      setDeleting(true);
      try {
        const res = await fetch(
          `/api/crm/items/${pendingDelete.source}/${pendingDelete.id}`,
          { method: "DELETE", credentials: "include" }
        );
        if (res.status === 401) {
          window.location.href = "/crm/login";
          return;
        }
        if (!res.ok) throw new Error("Delete failed");
        if (selectedKey === `${pendingDelete.source}-${pendingDelete.id}`) {
          setSelectedKey(null);
        }
        setPendingDelete(null);
        await onReload();
      } finally {
        setDeleting(false);
      }
    },
    onCancelDelete: () => setPendingDelete(null),
    onStartEditNotes: (item: CrmFeedItem) => {
      setPendingDelete(null);
      setEditingNotes(true);
      setNotesDraft(item.notes ?? "");
    },
    onSaveNotes: saveNotes,
    onCancelEditNotes: () => setEditingNotes(false),
    onReload,
    onToggleFor: (item: CrmFeedItem) => () => toggleItem(item),
  };

  return (
    <div className="w-full space-y-6">
      <InboxSection
        title="Contacts"
        items={contactItems}
        selectedKey={selectedKey}
        rowProps={sharedRowProps}
        emptyLabel="No contacts yet."
      />
      <InboxSection
        title="Leads"
        items={leadItems}
        selectedKey={selectedKey}
        rowProps={sharedRowProps}
        emptyLabel="No open leads — checkout pending or not started."
      />
      <InboxSection
        title="Clients"
        items={clientItems}
        selectedKey={selectedKey}
        rowProps={sharedRowProps}
        emptyLabel="No clients yet — appears here after the 50% deposit (or pay-in-full) clears."
      />
      <InboxSection
        title="Texts"
        items={smsItems}
        selectedKey={selectedKey}
        rowProps={sharedRowProps}
        emptyLabel="No unmatched inbound texts."
      />
      <InboxSection
        title="Discovery"
        items={discoveryItems}
        selectedKey={selectedKey}
        rowProps={sharedRowProps}
        emptyLabel="No discovery prospects yet."
      />
    </div>
  );
}
