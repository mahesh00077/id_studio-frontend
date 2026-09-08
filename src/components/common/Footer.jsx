import React from 'react';
import { useBranding } from '../../context/BrandingContext';

// App footer driven entirely by the Owner's company branding config.
// Only the configured start year is shown (the range display was removed).
export default function Footer() {
  const { branding } = useBranding();
  const startYear = branding.footer_start_year || new Date().getFullYear();

  return (
    <footer className="app-footer border-top py-3 px-3 mt-auto">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 small text-muted">
        <span>
          &copy; {startYear} {branding.company_name}.{' '}
          <span>All rights reserved.</span>
        </span>
        {branding.footer_text && <span>{branding.footer_text}</span>}
        {branding.website_url && (
          <a
            href={branding.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted text-decoration-none"
          >
            {branding.website_url.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>
    </footer>
  );
}