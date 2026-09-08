import React, { useEffect } from 'react';
import { useBranding } from '../../context/BrandingContext';
import { DEFAULT_THEME, applyThemeColors } from './themePresets';

// Applies the Owner-configured theme colors as CSS custom properties on the
// <html> element. The navbar (and primary accent) styles read these variables,
// so changing the theme in App Settings updates the whole UI immediately.
// Falls back to the default indigo/dark palette when nothing is configured.
export default function ThemeApplier() {
  const { branding } = useBranding();
  const colors = branding.theme_colors || DEFAULT_THEME;

  useEffect(() => {
    applyThemeColors(colors);
  }, [colors]);

  return null;
}
