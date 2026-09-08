import React from 'react';

// Small, non-intrusive banner shown only ABOVE the ID-card editor workspace.
// Never placed over the canvas, inside the toolbox/fields, or as a popup.
// Renders nothing when no advertisement is configured for this location.
export default function EditorNoticeBanner({ ad, onDismiss }) {
  if (!ad) return null;
  const safeLink =
    ad.link_url && /^https?:\/\//i.test(ad.link_url) ? ad.link_url : null;

  return (
    <div className="alert alert-info d-flex align-items-center align-items-md-center gap-3 py-2 mb-2 ad-editor-notice">
      {ad.image_url && (
        <img
          src={ad.image_url}
          alt=""
          style={{ height: 32, width: 'auto', maxWidth: 48, objectFit: 'contain' }}
          className="flex-shrink-0"
        />
      )}
      <div className="flex-grow-1 small">
        <strong>{ad.title}</strong>
        {ad.description && <span className="text-muted ms-1">{ad.description}</span>}
        {safeLink && (
          <a
            href={safeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-link p-0 ms-2 align-baseline"
          >
            Learn More
          </a>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="btn-close"
          aria-label="Dismiss"
          onClick={() => onDismiss(ad.id)}
        />
      )}
    </div>
  );
}