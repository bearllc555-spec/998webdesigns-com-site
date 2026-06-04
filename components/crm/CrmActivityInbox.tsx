"use client";

import { useCallback, useMemo, useState } from "react";
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
    const sameDay =
      d.toDateString() === now.toDateString();
    if (sameDay) {
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

function InboxRow({
  item,
  active,
  onSelect,
}: {
  item: CrmFeedItem;
  active: boolean;
  onSelect: () => void;
}) {
  const unread = isCrmFeedItemUnread(item);
  const company = item.businessName.trim();

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full gap-3 px-4 py-3.5 text-left transition ${
          active
            ? "bg-accent/[0.08] ring-1 ring-inset ring-accent/25"
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
            <span className="shrink-0 text-xs text-slate">{formatListWhen(item.at)}</span>
          </span>
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
        </span>
      </button>
    </li>
  );
}

function InboxSection({
  title,
  items,
  selectedKey,
  onSelect,
  emptyLabel,
}: {
  title: string;
  items: CrmFeedItem[];
  selectedKey: string | null;
  onSelect: (item: CrmFeedItem) => void;
  emptyLabel: string;
}) {
  const unread = items.filter(isCrmFeedItemUnread).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-rule bg-bg shadow-sm">
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
        <ul className="max-h-[min(32vh,16rem)] divide-y divide-rule overflow-y-auto">
          {items.map((item) => (
            <InboxRow
              key={itemKey(item)}
              item={item}
              active={selectedKey === itemKey(item)}
              onSelect={() => onSelect(item)}
            />
          ))}
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

  const allItems = useMemo(
    () => [...contactItems, ...leadItems],
    [contactItems, leadItems]
  );

  const selected = useMemo(
    () => allItems.find((i) => itemKey(i) === selectedKey) ?? null,
    [allItems, selectedKey]
  );

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
        throw new Error("Read state update failed");
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

  function selectItem(item: CrmFeedItem) {
    setSelectedKey(itemKey(item));
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

  function startDelete(item: CrmFeedItem) {
    setEditingNotes(false);
    setPendingDelete({
      source: item.source,
      id: item.id,
      label: item.businessName || item.title || item.email,
      step: 1,
    });
  }

  async function confirmDelete() {
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
  }

  return (
    <div className="md:flex md:min-h-[32rem] md:gap-0">
      <div className="space-y-4 md:w-[min(22rem,38%)] md:shrink-0 md:pr-4">
        <InboxSection
          title="Contacts"
          items={contactItems}
          selectedKey={selectedKey}
          onSelect={selectItem}
          emptyLabel="No contacts yet."
        />
        <InboxSection
          title="Leads"
          items={leadItems}
          selectedKey={selectedKey}
          onSelect={selectItem}
          emptyLabel="No leads yet."
        />
      </div>

      <div className="mt-4 min-h-[16rem] flex-1 overflow-hidden rounded-2xl border border-rule bg-bg p-5 shadow-sm md:mt-0 md:min-h-[32rem] md:overflow-y-auto">
        {!selected && (
          <p className="py-12 text-center text-sm text-ink-soft">
            Select a message to read the full details.
          </p>
        )}

        {selected && (
          <div className={isCrmFeedItemUnread(selected) ? "" : "opacity-90"}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rule pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate">
                  {selected.source === "lead" ? "Lead" : "Contact"} · {formatWhen(selected.at)}
                </p>
                <p
                  className={`mt-1 font-display text-xl ${
                    isCrmFeedItemUnread(selected) ? "font-semibold text-ink" : "font-medium text-ink-soft"
                  }`}
                >
                  {selected.title}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selected.status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(selected.status)}`}
                  >
                    {selected.status.replace(/_/g, " ")}
                  </span>
                )}
                <button
                  type="button"
                  disabled={readBusy}
                  onClick={() =>
                    setReadState(selected, isCrmFeedItemUnread(selected))
                  }
                  className="rounded-full border border-rule px-3 py-1 text-xs font-medium hover:border-accent/50 disabled:opacity-60"
                >
                  {isCrmFeedItemUnread(selected) ? "Mark read" : "Mark unread"}
                </button>
                {!pendingDelete && (
                  <button
                    type="button"
                    onClick={() => startDelete(selected)}
                    className="rounded-full border border-warn/40 px-3 py-1 text-xs font-medium text-warn hover:bg-warn-soft/40"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {pendingDelete &&
              pendingDelete.source === selected.source &&
              pendingDelete.id === selected.id && (
                <div className="mt-4 rounded-xl border border-warn/40 bg-warn-soft/30 p-4">
                  <p className="text-sm font-medium text-ink">
                    {pendingDelete.step === 1
                      ? `Delete this ${selected.source === "lead" ? "lead" : "contact"}?`
                      : "Final confirmation — this cannot be undone"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={confirmDelete}
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
                      onClick={() => setPendingDelete(null)}
                      className="rounded-full border border-rule px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            <SubmissionFieldStack
              name={selected.title}
              company={selected.businessName}
              email={selected.email}
              message={selected.message ?? undefined}
              messagePlaceholder={
                selected.source === "lead"
                  ? "Project brief — see notes and payload below."
                  : undefined
              }
            />

            {selected.source === "lead" && !pendingDelete && (
              <div className="mt-4 border-t border-rule pt-4">
                {editingNotes ? (
                  <div className="grid gap-2">
                    <textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-rule bg-bg px-3 py-2 text-sm"
                      placeholder="Internal notes…"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveNotes(selected.id)}
                        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNotes(false)}
                        className="rounded-full border border-rule px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDelete(null);
                      setEditingNotes(true);
                      setNotesDraft(selected.notes ?? "");
                    }}
                    className="text-sm text-accent hover:underline"
                  >
                    {selected.notes ? "Edit notes" : "Add notes"}
                  </button>
                )}
                {selected.notes && !editingNotes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">
                    {selected.notes}
                  </p>
                )}
              </div>
            )}

            {selected.stripeSessionId && (
              <p className="mt-4 break-all text-xs text-ink-soft">
                Stripe session: {selected.stripeSessionId}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
