import React, { useEffect, useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useBranding } from '../../context/BrandingContext';
import { THEME_PRESETS, DEFAULT_THEME, applyThemeColors } from '../common/themePresets';

function BrandingSettings() {
  const { branding, refreshBranding } = useBranding();
  const [form, setForm] = useState({});
  const [logoUrl, setLogoUrl] = useState(null);
  const [faviconUrl, setFaviconUrl] = useState(null);
  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      companyName: branding.company_name || '',
      website_url: branding.website_url || '',
      support_email: branding.support_email || '',
      support_phone: branding.support_phone || '',
      footer_start_year: branding.footer_start_year || 2023,
      footer_text: branding.footer_text || '',
      logo_width: branding.logo_width ?? '',
      logo_height: branding.logo_height ?? '',
    });
    setLogoUrl(branding.logo_url || null);
    setFaviconUrl(branding.favicon_url || null);

    // Select a matching preset if the saved theme matches one of them.
    const saved = branding.theme_colors;
    const matched = THEME_PRESETS.find((p) => {
      const c = p.colors;
      return (
        saved &&
        c.navbar_bg === saved.navbar_bg &&
        c.navbar_text === saved.navbar_text &&
        c.navbar_hover_bg === saved.navbar_hover_bg &&
        c.navbar_hover_text === saved.navbar_hover_text
      );
    });
    setSelectedThemeId(matched ? matched.id : null);
  }, [branding]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Live preview: apply the theme to the UI the moment it is clicked, without
  // waiting for "Save Changes". Persisted only when the form is saved.
  const previewTheme = (id) => {
    setSelectedThemeId(id);
    const preset = THEME_PRESETS.find((p) => p.id === id);
    applyThemeColors(preset ? preset.colors : DEFAULT_THEME);
  };

  // Revert to the saved theme if the user previews a selection and leaves
  // without saving (ThemeApplier won't re-run since branding didn't change).
  const savedThemeRef = React.useRef(branding.theme_colors);
  useEffect(() => {
    savedThemeRef.current = branding.theme_colors;
  }, [branding]);
  useEffect(() => () => {
    applyThemeColors(savedThemeRef.current || DEFAULT_THEME);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (selectedThemeId) {
        const preset = THEME_PRESETS.find((p) => p.id === selectedThemeId);
        if (preset) payload.theme_colors = preset.colors;
      } else {
        payload.theme_colors = null;
      }
      await api.put('/branding', payload);
      await refreshBranding();
      toast.success('Branding saved');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    try {
      const res = await api.post('/branding/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLogoUrl(res.data?.branding?.logo_url || null);
      await refreshBranding();
      toast.success('Logo updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload logo');
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await api.delete('/branding/logo');
      setLogoUrl(null);
      setFaviconUrl(null);
      await refreshBranding();
      toast.success('Logo removed');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove logo');
    }
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('favicon', file);
    try {
      const res = await api.post('/branding/favicon', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFaviconUrl(res.data?.branding?.favicon_url || null);
      await refreshBranding();
      toast.success('Favicon updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload favicon');
    }
  };

  const handleRemoveFavicon = async () => {
    try {
      await api.delete('/branding/favicon');
      setFaviconUrl(null);
      await refreshBranding();
      toast.success('Favicon removed');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove favicon');
    }
  };

  return (
    <div className="container py-4">
      <h4 className="mb-1">Company Branding</h4>
      <p className="text-muted">Manage the application-wide company branding shown across all portals.</p>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Form onSubmit={handleSave}>
        {/* Company Information */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <h6 className="mb-3 fw-semibold">Company Information</h6>
            <Form.Group className="mb-3">
              <Form.Label>Company Name</Form.Label>
              <Form.Control value={form.companyName} onChange={update('companyName')} required maxLength={150} />
            </Form.Group>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Company Website</Form.Label>
                  <Form.Control type="url" placeholder="https://example.com" value={form.website_url} onChange={update('website_url')} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Support Email</Form.Label>
                  <Form.Control type="email" value={form.support_email} onChange={update('support_email')} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Support Phone</Form.Label>
                  <Form.Control value={form.support_phone} onChange={update('support_phone')} />
                </Form.Group>
              </div>
            </div>
          </Card.Body>
        </Card>
{/* Company Logo */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <h6 className="mb-3 fw-semibold">Company Logo</h6>
            <p className="text-muted small mb-2">
              The uploaded logo file is saved using the company name (e.g. <code>bsr-school-id-studio.png</code>)
              and a 64×64 version is automatically used as the browser favicon.
            </p>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" style={{ height: 60, width: 'auto' }} className="border rounded p-1" />
              ) : (
                <div className="text-muted small">No logo uploaded</div>
              )}
              <div>
                <Form.Group>
                  <Form.Label className="me-2 m-0">Upload / Replace</Form.Label>
                  <Form.Control type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} />
                </Form.Group>
                {logoUrl && (
                  <Button variant="outline-danger" size="sm" className="mt-2" onClick={handleRemoveLogo}>
                    Remove Logo
                  </Button>
                )}
              </div>
            </div>

            <div className="row g-3 mt-2">
              <div className="col-6">
                <Form.Group>
                  <Form.Label>Logo Width (px)</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={600}
                    placeholder="Auto"
                    value={form.logo_width}
                    onChange={update('logo_width')}
                  />
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group>
                  <Form.Label>Logo Height (px)</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={300}
                    placeholder="Auto"
                    value={form.logo_height}
                    onChange={update('logo_height')}
                  />
                </Form.Group>
              </div>
              <div className="col-12 small text-muted">
                Leave blank to use the default responsive size. Setting both width and
                height controls how large the logo appears in the navbar and login page.
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Favicon */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <h6 className="mb-3 fw-semibold">Favicon</h6>
            <p className="text-muted small mb-2">
              The small icon shown in the browser tab. If you upload a logo, a 64×64 favicon
              is generated from it automatically — uploading one here overrides it.
            </p>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              {faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt="favicon"
                  style={{ width: 48, height: 48, objectFit: 'contain' }}
                  className="border rounded p-1"
                />
              ) : (
                <div className="text-muted small">No favicon set (browser default is shown)</div>
              )}
              <div>
                <Form.Group>
                  <Form.Label className="me-2 m-0">Upload / Replace</Form.Label>
                  <Form.Control type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFaviconUpload} />
                </Form.Group>
                {faviconUrl && (
                  <Button variant="outline-danger" size="sm" className="mt-2" onClick={handleRemoveFavicon}>
                    Remove Favicon
                  </Button>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Theme */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <h6 className="mb-1 fw-semibold">Theme</h6>
            <p className="text-muted small mb-3">
              Choose a color combination for the app's top navigation bar.
              Select one and click "Save Changes" to apply it. Presets are also
              re-selected automatically when the saved theme matches.
            </p>

            <div className="row g-3">
              {THEME_PRESETS.map((preset) => {
                const active = selectedThemeId === preset.id;
                return (
                  <div className="col-6 col-md-4" key={preset.id}>
                    <div
                      onClick={() => previewTheme(preset.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') previewTheme(preset.id); }}
                      className={`theme-option p-3 rounded-3 border ${active ? 'border-2 theme-option-active' : ''}`}
                      style={
                        active
                          ? {
                              cursor: 'pointer',
                              background: '#fff',
                              borderColor: preset.colors.primary,
                              boxShadow: `0 0 0 2px ${preset.colors.primary}26`,
                            }
                          : { cursor: 'pointer', background: '#fff' }
                      }
                    >
                      {/* Navbar preview strip */}
                      <div
                        className="rounded mb-2 d-flex align-items-center px-2"
                        style={{ height: 34, background: preset.colors.navbar_bg }}
                      >
                        <span
                          className="d-block rounded"
                          style={{ width: 14, height: 14, background: preset.colors.primary, marginRight: 6 }}
                        />
                        <span style={{ color: preset.colors.navbar_text, fontSize: 12, fontWeight: 600 }}>
                          {preset.name}
                        </span>
                      </div>
                      <div className="d-flex gap-1">
                        {Object.entries(preset.colors).map(([k, v]) => (
                          <span
                            key={k}
                            title={k}
                            style={{ width: 16, height: 16, background: v, borderRadius: 3, border: '1px solid #e2e8f0', display: 'inline-block' }}
                          />
                        ))}
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <span className="small fw-semibold">{preset.name}</span>
                        {preset.isDefault && <span className="badge bg-secondary">Default</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  const def = THEME_PRESETS.find((p) => p.isDefault);
                  previewTheme(def ? def.id : THEME_PRESETS[0].id);
                }}
              >
                Set Default Combination
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => previewTheme(null)}
              >
                No Theme (use browser default)
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* Footer */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <h6 className="mb-3 fw-semibold">Footer</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Copyright Start Year</Form.Label>
                  <Form.Control type="number" min={2000} max={2100} value={form.footer_start_year} onChange={update('footer_start_year')} />
                </Form.Group>
              </div>
              <div className="col-md-8">
                <Form.Group>
                  <Form.Label>Footer Text (optional)</Form.Label>
                  <Form.Control value={form.footer_text} onChange={update('footer_text')} maxLength={200} placeholder="Additional footer line" />
                </Form.Group>
              </div>
            </div>
            <div className="mt-3 small text-muted">
              Preview:{' '}
              &copy; {Number(form.footer_start_year) || new Date().getFullYear()} {form.companyName || 'Company'}. All rights reserved.
            </div>
          </Card.Body>
        </Card>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default BrandingSettings;