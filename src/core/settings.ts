import { THEMES, WINDOWS, type Theme, type WindowId } from './content';
import { at, recordOf } from './util';

export interface Settings {
  scanlines: boolean;
  themes: Record<WindowId, Theme>;
}

export function defaultSettings(): Settings {
  return { scanlines: true, themes: recordOf(WINDOWS, (win) => win.defaultTheme) };
}

export function nextTheme(theme: Theme): Theme {
  return at(THEMES, (THEMES.indexOf(theme) + 1) % THEMES.length);
}
