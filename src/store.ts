// Settings store with localStorage persistence
// Uses signals-like pattern with preact/signals via hooks

import { signal, effect } from '@preact/signals';

const SETTINGS_KEY = 'fretboard-settings-v1';

export type Theme = 'light' | 'dark' | 'auto';

export type Settings = {
  useSharps: boolean;
  useFlats: boolean;
  showFretNumbers: boolean;
  audioEnabled: boolean;
  theme: Theme;
};

const DEFAULT_SETTINGS: Settings = {
  useSharps: true,
  useFlats: false,
  showFretNumbers: false,
  audioEnabled: true,
  theme: 'auto',
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

// Global signals
export const settings = signal<Settings>(loadSettings());

// Apply theme to document
effect(() => {
  const theme = settings.value.theme;
  document.documentElement.setAttribute('data-theme', theme);
});

// Persist on change
effect(() => {
  saveSettings(settings.value);
});

export function updateSettings(updates: Partial<Settings>): void {
  settings.value = { ...settings.value, ...updates };
}

export function resetSettings(): void {
  settings.value = { ...DEFAULT_SETTINGS };
}
