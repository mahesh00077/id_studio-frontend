import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../api/axios';

// Defaults used until /api/branding loads (and as fallback if it 404s).
const DEFAULT_BRANDING = {
  company_name: 'School ID Studio',
  logo_url: null,
  favicon_url: null,
  website_url: null,
  support_email: null,
  support_phone: null,
  footer_start_year: 2023,
  footer_text: null,
  show_logo_with_name: 1,
  logo_width: null,
  logo_height: null,
  theme_colors: null,
};

const BrandingContext = createContext();

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [loaded, setLoaded] = useState(false);

  const refreshBranding = useCallback(async () => {
    try {
      const res = await api.get('/branding');
      const b = res.data?.branding;
      if (b) {
        setBranding({ ...DEFAULT_BRANDING, ...b });
      }
    } catch (e) {
      // Keep defaults if the endpoint is unreachable (e.g. backend down).
      // Never throw - branding is non-critical.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  return (
    <BrandingContext.Provider value={{ branding, loaded, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}