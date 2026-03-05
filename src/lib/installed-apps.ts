'use client';

import { Globe } from 'lucide-react';
import type { App } from '@/lib/apps';

export const INSTALLED_APPS_STORAGE_KEY = 'installedApps.v1';
export const INSTALLED_APPS_UPDATED_EVENT = 'installed-apps-updated';

export type InstalledAppRecord = {
  id: string;
  name: string;
  iconUrl: string;
  externalUrl: string;
  installedAt: string;
};

export function toInstalledSlug(appId: string): string {
  return `installed-${appId}`;
}

export function fromInstalledSlug(slug: string): string | null {
  if (!slug.startsWith('installed-')) {
    return null;
  }

  return slug.slice('installed-'.length) || null;
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
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.iconUrl === 'string' &&
        typeof item.externalUrl === 'string'
      );
    });
  } catch {
    return [];
  }
}

export function getInstalledAppRecords(): InstalledAppRecord[] {
  if (typeof window === 'undefined') {
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

export function saveInstalledApp(record: Omit<InstalledAppRecord, 'installedAt'>) {
  if (typeof window === 'undefined') {
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
  window.dispatchEvent(new CustomEvent(INSTALLED_APPS_UPDATED_EVENT));
}

export function removeInstalledApp(appId: string) {
  if (typeof window === 'undefined') {
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
    bgColor: '#0A84FF',
    color: 'white',
    href: `/app/${toInstalledSlug(record.id)}`,
    category: 'Utilities',
  };
}

export function getInstalledAppsAsEntries(): App[] {
  return getInstalledAppRecords().map(toInstalledAppEntry);
}
