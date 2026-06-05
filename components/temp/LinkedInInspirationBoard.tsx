"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  clearLinkedInInspirationProfiles,
  defaultLinkedInInspirationProfiles,
  loadLinkedInInspirationProfiles,
  parseStoredProfiles,
  profileIdFromHref,
  saveLinkedInInspirationProfiles,
  validateProfileForm,
  type LinkedInInspirationProfile,
  type ProfileFormValues,
} from "@/lib/linkedin-inspiration-profiles";
import { LINKEDIN_INSPIRATION_INTRO } from "@/data/linkedin-inspiration";
const emptyForm: ProfileFormValues = { name: "", href: "", summary: "" };

function initialProfiles(): LinkedInInspirationProfile[] {
  if (typeof window === "undefined") return defaultLinkedInInspirationProfiles();
  return loadLinkedInInspirationProfiles();
}

export function LinkedInInspirationBoard() {
  const [profiles, setProfiles] = useState<LinkedInInspirationProfile[]>(() =>
    initialProfiles()
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const persist = useCallback((next: LinkedInInspirationProfile[]) => {
    setProfiles(next);
    saveLinkedInInspirationProfiles(next);
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setFormError(null);
    setShowAdd(false);
    setEditingId(null);
  };

  const submitForm = () => {
    const validated = validateProfileForm(form);
    if (!validated.ok) {
      setFormError(validated.error);
      return;
    }
    const { name, href, summary } = validated.data;

    if (editingId) {
      persist(
        profiles.map((p) =>
          p.id === editingId ? { ...p, name, href, summary } : p
        )
      );
    } else {
      const id = profileIdFromHref(href);
      const exists = profiles.some((p) => p.id === id);
      persist([
        {
          id: exists ? `${id}-${Date.now()}` : id,
          name,
          href,
          summary,
        },
        ...profiles,
      ]);
    }
    resetForm();
  };

  const startEdit = (profile: LinkedInInspirationProfile) => {
    setEditingId(profile.id ?? profileIdFromHref(profile.href));
    setShowAdd(false);
    setForm({
      name: profile.name,
      href: profile.href,
      summary: profile.summary,
    });
    setFormError(null);
  };

  const deleteProfile = (id: string) => {
    if (!window.confirm("Remove this profile from your list?")) return;
    persist(profiles.filter((p) => p.id !== id));
    if (editingId === id) resetForm();
  };

  const resetToDefaults = () => {
    if (
      !window.confirm(
        "Reset to the built-in list? Your custom profiles in this browser will be replaced."
      )
    ) {
      return;
    }
    clearLinkedInInspirationProfiles();
    const defaults = defaultLinkedInInspirationProfiles();
    setProfiles(defaults);
    resetForm();
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "linkedin-inspiration-profiles.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        const next = parseStoredProfiles(parsed);
        if (!next?.length) {
          window.alert("No valid profiles found in that file.");
          return;
        }
        persist(next);
        resetForm();
      } catch {
        window.alert("Could not read that file. Use a JSON export from this page.");
      }
    };
    input.click();
  };

  const formVisible = showAdd || editingId !== null;

  return (
    <div className="temp-linkedin-inner">
      <header className="temp-linkedin-header">
        <h1>LinkedIn profile inspiration</h1>
        <p>{LINKEDIN_INSPIRATION_INTRO}</p>
        <p className="temp-linkedin-hint">
          Add, edit, or remove profiles below. Saved in this browser — use Export
          to back up or move to another device.
        </p>
      </header>

      <div className="temp-linkedin-toolbar">
        <button
          type="button"
          className="temp-linkedin-btn temp-linkedin-btn--primary"
          onClick={() => {
            resetForm();
            setShowAdd(true);
          }}
        >
          + Add profile
        </button>
        <button type="button" className="temp-linkedin-btn" onClick={exportJson}>
          Export JSON
        </button>
        <button type="button" className="temp-linkedin-btn" onClick={importJson}>
          Import JSON
        </button>
        <button
          type="button"
          className="temp-linkedin-btn temp-linkedin-btn--muted"
          onClick={resetToDefaults}
        >
          Reset to defaults
        </button>
      </div>

      {formVisible && (
        <section className="temp-linkedin-form" aria-label="Profile editor">
          <h2 className="temp-linkedin-form-title">
            {editingId ? "Edit profile" : "New profile"}
          </h2>
          <label className="temp-linkedin-field">
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </label>
          <label className="temp-linkedin-field">
            <span>LinkedIn URL</span>
            <input
              type="url"
              value={form.href}
              onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
              placeholder="https://www.linkedin.com/in/username"
              autoComplete="url"
            />
          </label>
          <label className="temp-linkedin-field">
            <span>Summary</span>
            <textarea
              rows={4}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="What makes this profile worth studying?"
            />
          </label>
          {formError && (
            <p className="temp-linkedin-form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="temp-linkedin-form-actions">
            <button
              type="button"
              className="temp-linkedin-btn temp-linkedin-btn--primary"
              onClick={submitForm}
            >
              {editingId ? "Save changes" : "Add profile"}
            </button>
            <button type="button" className="temp-linkedin-btn" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </section>
      )}

      <ul className="temp-linkedin-list">
        {profiles.map((profile) => (
          <li key={profile.id} className="temp-linkedin-card">
            <div className="temp-linkedin-card-top">
              <a href={profile.href} target="_blank" rel="noopener noreferrer">
                {profile.name}
              </a>
              <div className="temp-linkedin-card-actions">
                <button
                  type="button"
                  className="temp-linkedin-card-btn"
                  onClick={() => startEdit(profile)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="temp-linkedin-card-btn temp-linkedin-card-btn--danger"
                  onClick={() => deleteProfile(profile.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            <p>{profile.summary}</p>
          </li>
        ))}
      </ul>

      <Link href="/temp" className="temp-linkedin-back">
        ← Back to banner designs
      </Link>
    </div>
  );
}
