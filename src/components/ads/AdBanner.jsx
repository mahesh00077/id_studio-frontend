import React from 'react';

// Clean, professional advertisement banner for the school dashboard.
// Renders description as plain text (never raw HTML) and only allows
// http(s) links opened in a new, safe tab.
export default function AdBanner({ ad, onDismiss }) {
  if (!ad) return null;
  const safeLink =
    ad.link_url && /^https?:\/\//i.test(ad.link_url) ? ad.link_url : null;

  return (
    <div className="ad-banner card mb-3 shadow-sm">
      <div className="card-body d-flex flex-column flex-md-row gap-3 align-items-md-center p-3">
        {ad.image_url && (
          <div className="ad-banner-img flex-shrink-0">
            <img
              src={ad.image_url}
              alt=""
              className="rounded"
              style={{ maxHeight: 84, maxWidth: 160, objectFit: 'contain' }}
            />
          </div>
        )}
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <h6 className="mb-1 fw-semibold">{ad.title}</h6>
            {onDismiss && (
              <button
                type="button"
                className="btn-close ad-dismiss"
                aria-label="Dismiss"
                onClick={() => onDismiss(ad.id)}
              />
            )}
          </div>
          {ad.description && (
            <p className="mb-2 text-muted small">{ad.description}</p>
          )}
          {safeLink && (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary"
            >
              Learn More
            </a>
          )}
        </div>
      </div>
    </div>
  );
}