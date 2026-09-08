// Theme color combination presets for the Owner "App Settings" page.
// Each preset maps to CSS custom properties consumed by the navbar styling.
const THEME_PRESETS = [
  {
    id: 'indigo',
    name: 'Midnight Indigo',
    isDefault: true,
    colors: {
      primary: '#4f46e5',
      navbar_bg: '#0f172a',
      navbar_text: '#94a3b8',
      navbar_hover_bg: '#1e293b',
      navbar_hover_text: '#ffffff',
      navbar_active_bg: '#1e293b',
      navbar_active_text: '#ffffff',
    },
  },
  {
    id: 'sapphire',
    name: 'Sapphire Blue',
    colors: {
      primary: '#2563eb',
      navbar_bg: '#1e3a8a',
      navbar_text: '#dbeafe',
      navbar_hover_bg: '#1e40af',
      navbar_hover_text: '#ffffff',
      navbar_active_bg: '#1e40af',
      navbar_active_text: '#ffffff',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    colors: {
      primary: '#059669',
      navbar_bg: '#064e3b',
      navbar_text: '#d1fae5',
      navbar_hover_bg: '#065f46',
      navbar_hover_text: '#ffffff',
      navbar_active_bg: '#065f46',
      navbar_active_text: '#ffffff',
    },
  },
  {
    id: 'amber',
    name: 'Amber Sunset',
    colors: {
      primary: '#d97706',
      navbar_bg: '#78350f',
      navbar_text: '#fef3c7',
      navbar_hover_bg: '#92400e',
      navbar_hover_text: '#ffffff',
      navbar_active_bg: '#92400e',
      navbar_active_text: '#ffffff',
    },
  },
  {
    id: 'rose',
    name: 'Rose Berry',
    colors: {
      primary: '#e11d48',
      navbar_bg: '#4c0519',
      navbar_text: '#ffe4e6',
      navbar_hover_bg: '#881337',
      navbar_hover_text: '#ffffff',
      navbar_active_bg: '#881337',
      navbar_active_text: '#ffffff',
    },
  },
  {
    id: 'pearl',
    name: 'Pearl White',
    colors: {
      primary: '#4f46e5',
      navbar_bg: '#ffffff',
      navbar_text: '#334155',
      navbar_hover_bg: '#f1f5f9',
      navbar_hover_text: '#111827',
      navbar_active_bg: '#eef2ff',
      navbar_active_text: '#4f46e5',
    },
  },
];

// Fallback custom-property values used until a theme is configured.
const DEFAULT_THEME = THEME_PRESETS.find((p) => p.isDefault).colors;

// Applies a theme palette as CSS custom properties on the <html> element.
// Shared by ThemeApplier (persisted theme) and BrandingSettings (live preview).
function applyThemeColors(colors) {
  if (!colors) return;
  const root = document.documentElement;
  const map = [
    ['--primary', colors.primary],
    ['--navbar-bg', colors.navbar_bg],
    ['--navbar-text', colors.navbar_text],
    ['--navbar-hover-bg', colors.navbar_hover_bg],
    ['--navbar-hover-text', colors.navbar_hover_text],
    ['--navbar-active-bg', colors.navbar_active_bg],
    ['--navbar-active-text', colors.navbar_active_text],
  ];
  for (const [prop, value] of map) {
    if (value) root.style.setProperty(prop, value);
  }
}

export { THEME_PRESETS, DEFAULT_THEME, applyThemeColors };
