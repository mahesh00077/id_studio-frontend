import React from 'react';

// Compact promotional card used as a responsive side widget. Renders nothing
// when there's no active sidebar advertisement, so no empty container shows.
export default function SidebarAdCard({ ad, onDismiss }) {
  if (!ad) return null;
  const safeLink =
    ad.link_url && /^https?:\/\//i.test(ad.link_url) ? ad.link_url : null;

  return (
    <div className="card ad-sidebar-card mb-3 shadow-sm border-0">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <div className="d-flex align-items-center gap-2">
            <span role="img" aria-label="sparkle" className="text-primary">✨</span>
            <h6 className="mb-0 fw-semibold">{ad.title}</h6>
          </div>
          {onDismiss && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              title="Dismiss"
              onClick={() => onDismiss(ad.id)}
            >
              ✕
            </button>
          )}
        </div>
        {ad.image_url && (
          <img
            src={ad.image_url}
            alt=""
            className="img-fluid rounded mb-2"
          />
        )}
        {ad.description && (
          <p className="text-muted small mb-2">{ad.description}</p>
        )}
        {safeLink && (
          <a
            href={safeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary w-100"
          >
            Learn More
          </a>
        )}
      </div>
    </div>
  );
}