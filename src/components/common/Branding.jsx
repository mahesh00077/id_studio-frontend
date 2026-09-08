import React from 'react';
import { useBranding } from '../../context/BrandingContext';

// Two common pill-compatible sizes: 'sm' (navbar/footer) and 'lg'.
const SIZE_STYLES = {
  sm: { height: 24, fontSize: 15 },
  lg: { height: 48, fontSize: 20 },
};

// Reusable company branding lockup (logo + company name). Reads the company
// branding from context so it is configured once by the Owner and used
// everywhere - never hardcoded in individual screens.
export default function Branding({
  size = 'sm',
  variant = 'default',   // 'default' | 'light' | 'dark'
  showName = true,
  link = false,
  className = '',
}) {
  const { branding } = useBranding();
  const style = SIZE_STYLES[size] || SIZE_STYLES.sm;
  const { logo_url, company_name, show_logo_with_name, logo_width, logo_height } = branding;
  const shouldShowName = showName && show_logo_with_name !== 0;

  // Use the Owner-configured logo dimensions when provided (each applied
  // independently); otherwise fall back to the compact default for this
  // context. Allow the aspect ratio to stay automatic when only one side is set.
  const logoStyle = {};
  if (logo_width) {
    logoStyle.width = Number(logo_width);
  }
  if (logo_height) {
    logoStyle.height = Number(logo_height);
  }
  if (!logoStyle.width && !logoStyle.height) {
    logoStyle.height = style.height;
    logoStyle.width = 'auto';
  }
  logoStyle.maxWidth = size === 'sm' && !(logo_width && logo_height) ? 120 : 180;

  // Header variant: modern SaaS lockup — first word (brand, e.g. "BSR")
  // prominent, the remainder ("School ID Studio") as a clean secondary label.
  const isHeader = variant === 'header';
  const [brandWord, ...restWords] = (company_name || '').split(' ');
  const restName = restWords.join(' ');

  const content = (
    <>
      {logo_url && (
        <img
          src={logo_url}
          alt=""
          style={logoStyle}
          className={isHeader ? 'branding-header-logo' : 'me-2'}
        />
      )}
      {shouldShowName && (isHeader ? (
        <span className="branding-header-text">
          {/* <strong className="branding-header-brand">{brandWord}</strong> */}
          {restName && <span className="branding-header-sub" style={{marginTop:'8px',letterSpacing:'0px',fontSize:'15px'}}>{brandWord} {restName}</span>}
        </span>
      ) : (
        <span style={{ fontSize: style.fontSize }}>{company_name}</span>
      ))}
    </>
  );

  const base = `branding-lockup d-inline-flex align-items-center ${className}`;

  if (link && branding.website_url) {
    return (
      <a
        href={branding.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} text-decoration-none`}
        style={variant === 'light' ? { color: '#fff' } : { color: 'inherit' }}
      >
        {content}
      </a>
    );
  }
  return <span className={base} style={variant === 'light' ? { color: '#fff' } : undefined}>{content}</span>;
}