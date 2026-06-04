"use client";

import { useCallback, useState } from "react";
import { SubmissionFieldStack } from "@/components/form-field-stack";
import { isCrmFeedItemUnread, type CrmFeedItem } from "@/lib/crm-feed";

type PendingDelete = {
  source: "lead" | "contact";
  id: string;
  label: string;
  step: 1 | 2;
};

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
  editingNotes: boolean;
  notesDraft: string;
  onNotesDraftChange: (v: string) => void;
  onSetReadState: (item: CrmFeedItem, read: boolean) => void;
  onStartDelete: (item: CrmFeedItem) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onStartEditNotes: (item: CrmFeedItem) => void;
  onSaveNotes: (leadId: string) => void;
  onCancelEditNotes: () => void;
};

function InboxRow({
  item,
  expanded,
  onToggle,
  pendingDelete,
  deleting,
  readBusy,
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
}: InboxRowProps) {
  const unread = isCrmFeedItemUnread(item);
  const company = item.businessName.trim();
  const isDeleting =
    pendingDelete?.source === item.source && pendingDelete.id === item.id;

  return (
    <li className={expanded ? "bg-accent/[0.04]" : undefined}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`flex w-full gap-3 px-4 py-3.5 text-left transition ${
          expanded
            ? "bg-accent/[0.08]"
            : unread
              ? "bg-bg hover:bg-rule-soft/80"
              : "bg-rule-soft/30 text-ink-soft hover:bg-rule-soft/60"
        }`}
      >
        <span
          className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
            unread ? "bg-accent" : "bg-transparent"
          }`}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span
              className={`truncate text-sm ${
                unread ? "font-semibold text-ink" : "font-medium text-ink-soft"
              }`}
            >
              {item.title || item.email}
            </span>
            <span className="flex shrink-0 items-center gap-2 text-xs text-slate">
              <span>{formatListWhen(item.at)}</span>
              <span
                className={`inline-block transition-transform ${expanded ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▾
              </span>
            </span>
          </span>
          {!expanded && (
            <>
              <span
                className={`mt-0.5 block truncate text-xs ${
                  unread ? "text-ink-soft" : "text-slate"
                }`}
              >
                {company ? `${company} · ` : ""}
                {previewLine(item)}
              </span>
              <span className="mt-1.5 inline-block">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    unread ? "bg-accent/15 text-accent" : "bg-rule text-slate"
                  }`}
                >
                  {unread ? "Unread" : "Read"}
                </span>
              </span>
            </>
          )}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-rule bg-bg px-4 py-5 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate">
                {item.source === "lead" ? "Lead" : "Contact"} · {formatWhen(item.at)}
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-ink">
                {item.title}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                  ? `Delete this ${item.source === "lead" ? "lead" : "contact"}?`
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
            email={item.email}
            message={item.message ?? undefined}
            messagePlaceholder={
              item.source === "lead"
                ? "Project brief — see notes and payload below."
                : undefined
            }
          />

          {item.source === "lead" && !isDeleting && (
            <div className="mt-4 border-t border-rule pt-4">
              {editingNotes ? (
                <div className="grid gap-2">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => onNotesDraftChange(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-rule bg-bg px-3 py-2 text-sm"
                    placeholder="Internal notes…"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onSaveNotes(item.id)}
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
            </div>
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
  onItemsChange,
  onReload,
}: CrmActivityInboxProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [readBusy, setReadBusy] = useState(false);

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

  async function saveNotes(leadId: string) {
    const res = await fetch(`/api/crm/leads/${leadId}/notes`, {
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
        emptyLabel="No leads yet."
      />
    </div>
  );
}
