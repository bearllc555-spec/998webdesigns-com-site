export function normDomain(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/\.+$/, "");
}

export function isEmail(s: unknown): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s ?? ""));
}

export function isDomain(s: unknown): boolean {
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(String(s ?? ""));
}
