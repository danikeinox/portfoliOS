"use client";

import { Globe } from "lucide-react";
import type { App } from "@/lib/apps";

export const INSTALLED_APPS_STORAGE_KEY = "installedApps.v1";
export const INSTALLED_APPS_HISTORY_STORAGE_KEY = "installedApps.history.v1";
export const INSTALLED_APPS_UPDATED_EVENT = "installed-apps-updated";
export const PENDING_INSTALLED_APP_UPDATE_STORAGE_KEY =
  "installedApps.pendingUpdate.v1";

export type InstalledAppRecord = {
  id: string;
  name: string;
  iconUrl: string;
  externalUrl: string;
  version?: string;
  installedAt: string;
};

export type PendingInstalledAppUpdate = Omit<InstalledAppRecord, "installedAt">;

export function toInstalledSlug(appId: string): string {
  return `installed-${appId}`;
}

export function fromInstalledSlug(slug: string): string | null {
  if (!slug.startsWith("installed-")) {
    return null;
  }

  return slug.slice("installed-".length) || null;
}

function parseStoredApps(raw: string | null): InstalledAppRecord[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => {
      return (
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.iconUrl === "string" &&
        typeof item.externalUrl === "string" &&
        (item.version === undefined || typeof item.version === "string")
      );
    });
  } catch {
    return [];
  }
}

function parseHistory(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function getInstalledAppRecords(): InstalledAppRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseStoredApps(localStorage.getItem(INSTALLED_APPS_STORAGE_KEY));
}

export function getInstalledAppById(appId: string): InstalledAppRecord | null {
  const installed = getInstalledAppRecords();
  return installed.find((item) => item.id === appId) ?? null;
}

export function getInstalledAppBySlug(slug: string): InstalledAppRecord | null {
  const appId = fromInstalledSlug(slug);
  if (!appId) {
    return null;
  }

  return getInstalledAppById(appId);
}

export function hasInstalledAppHistory(appId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const history = parseHistory(
    localStorage.getItem(INSTALLED_APPS_HISTORY_STORAGE_KEY),
  );
  return history.includes(appId);
}

export function saveInstalledApp(
  record: Omit<InstalledAppRecord, "installedAt">,
) {
  if (typeof window === "undefined") {
    return;
  }

  const installed = getInstalledAppRecords();
  const next = [
    ...installed.filter((item) => item.id !== record.id),
    {
      ...record,
      installedAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(INSTALLED_APPS_STORAGE_KEY, JSON.stringify(next));

  const history = parseHistory(
    localStorage.getItem(INSTALLED_APPS_HISTORY_STORAGE_KEY),
  );
  if (!history.includes(record.id)) {
    localStorage.setItem(
      INSTALLED_APPS_HISTORY_STORAGE_KEY,
      JSON.stringify([...history, record.id]),
    );
  }

  window.dispatchEvent(new CustomEvent(INSTALLED_APPS_UPDATED_EVENT));
}

export function removeInstalledApp(appId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const installed = getInstalledAppRecords();
  const next = installed.filter((item) => item.id !== appId);
  localStorage.setItem(INSTALLED_APPS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(INSTALLED_APPS_UPDATED_EVENT));
}

export function toInstalledAppEntry(record: InstalledAppRecord): App {
  return {
    id: toInstalledSlug(record.id),
    title: record.name,
    icon: Globe,
    bgColor: "#0A84FF",
    color: "white",
    href: `/app/${toInstalledSlug(record.id)}`,
    category: "Utilities",
  };
}

export function getInstalledAppsAsEntries(): App[] {
  return getInstalledAppRecords().map(toInstalledAppEntry);
}

export function queueInstalledAppUpdate(update: PendingInstalledAppUpdate) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    PENDING_INSTALLED_APP_UPDATE_STORAGE_KEY,
    JSON.stringify(update),
  );
}

export function consumeQueuedInstalledAppUpdate(): PendingInstalledAppUpdate | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(PENDING_INSTALLED_APP_UPDATE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  localStorage.removeItem(PENDING_INSTALLED_APP_UPDATE_STORAGE_KEY);

  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.iconUrl === "string" &&
      typeof parsed.externalUrl === "string" &&
      (parsed.version === undefined || typeof parsed.version === "string")
    ) {
      return parsed as PendingInstalledAppUpdate;
    }

    return null;
  } catch {
    return null;
  }
}
