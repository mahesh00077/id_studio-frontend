import React, { useEffect, useState } from 'react';
import { Card, Table, Form, Button, Modal, Alert, Badge } from 'react-bootstrap';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const AUDIENCES = ['SCHOOL_ADMIN', 'SCHOOL_STAFF', 'BOTH'];
const POSITIONS = ['DASHBOARD', 'SIDEBAR', 'ID_CARD_GENERATOR'];

const EMPTY = {
  title: '',
  description: '',
  link_url: '',
  target_audience: 'BOTH',
  position: 'DASHBOARD',
  start_at: '',
  end_at: '',
  priority: 0,
  is_active: true,
};

function Advertisements() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [error, setError] = useState('');

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ads/manage');
      setAds(res.data?.advertisements || []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setBannerPreview(null);
    setShowModal(true);
  };

  const openEdit = (ad) => {
    setEditing(ad);
    setForm({
      title: ad.title || '',
      description: ad.description || '',
      link_url: ad.link_url || '',
      target_audience: ad.target_audience || 'BOTH',
      position: ad.position || 'DASHBOARD',
      start_at: ad.start_at ? toLocalInput(ad.start_at) : '',
      end_at: ad.end_at ? toLocalInput(ad.end_at) : '',
      priority: ad.priority ?? 0,
      is_active: !!ad.is_active,
    });
    setBannerPreview(ad.image_url || null);
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    const payload = {
      title: form.title,
      description: form.description,
      link_url: form.link_url,
      target_audience: form.target_audience,
      position: form.position,
      priority: Number(form.priority) || 0,
      is_active: form.is_active,
      start_at: form.start_at || null,
      end_at: form.end_at || null,
    };

    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== null && v !== undefined) fd.append(k, String(v));
    });
    const selectedBanner = document.getElementById('ad-banner-file')?.files?.[0];
    if (selectedBanner) fd.append('image', selectedBanner);

    try {
      if (editing) {
        await api.put(`/ads/manage/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Advertisement updated');
      } else {
        await api.post('/ads/manage', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Advertisement created');
      }
      setShowModal(false);
      fetchAds();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save advertisement');
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      await api.patch(`/ads/manage/${ad.id}/status`, { is_active: !ad.is_active });
      toast.success(ad.is_active ? 'Advertisement deactivated' : 'Advertisement activated');
      fetchAds();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (ad) => {
    if (!window.confirm(`Delete advertisement "${ad.title}"?`)) return;
    try {
      await api.delete(`/ads/manage/${ad.id}`);
      toast.success('Advertisement deleted');
      fetchAds();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to delete advertisement');
    }
  };
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-1">Advertisements</h4>
          <p className="text-muted mb-0">Manage promotional content shown to school users.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Create Advertisement</Button>
      </div>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      {loading ? (
        <div className="text-center py-5 text-muted">Loading advertisements...</div>
      ) : ads.length === 0 ? (
        <Card className="text-center py-5 shadow-sm border-0">
          <Card.Body className="text-muted">No advertisements yet. Click "Create Advertisement" to add one.</Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <Table hover responsive className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Title</th>
                <th>Target</th>
                <th>Position</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {ad.image_url && <img src={ad.image_url} alt="" style={{ height: 28, width: 40, objectFit: 'cover' }} className="rounded" />}
                      <span>{ad.title}</span>
                    </div>
                  </td>
                  <td><Badge bg="secondary">{ad.target_audience}</Badge></td>
                  <td>{ad.position.toLowerCase().replace(/_/g, ' ')}</td>
                  <td>{ad.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
                  <td className="small">{ad.start_at ? new Date(ad.start_at).toLocaleDateString() : '—'}</td>
                  <td className="small">{ad.end_at ? new Date(ad.end_at).toLocaleDateString() : '—'}</td>
                  <td className="text-end">
                    <Button size="sm" variant="outline-primary me-1" onClick={() => openEdit(ad)}>Edit</Button>
                    <Button size="sm" variant="outline-secondary me-1" onClick={() => handleToggleActive(ad)}>
                      {ad.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(ad)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <AdModal
        show={showModal}
        editing={editing}
        form={form}
        bannerPreview={bannerPreview}
        setForm={setForm}
        onBannerPreview={setBannerPreview}
        onSave={handleSave}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

function toLocalInput(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdModal({ show, editing, form, bannerPreview, setForm, onBannerPreview, onSave, onClose }) {
  const handleBannerFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onBannerPreview(URL.createObjectURL(file));
  };
  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{editing ? 'Edit Advertisement' : 'Create Advertisement'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Link URL</Form.Label>
            <Form.Control type="url" placeholder="https://" value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} />
          </Form.Group>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Target Audience</Form.Label>
                <Form.Select value={form.target_audience} onChange={(e) => setForm((f) => ({ ...f, target_audience: e.target.value }))}>
                  {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Position</Form.Label>
                <Form.Select value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p.toLowerCase().replace(/_/g, ' ')}</option>)}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control type="datetime-local" value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Priority</Form.Label>
                <Form.Control type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} />
              </Form.Group>
            </div>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Banner Image</Form.Label>
            <Form.Control id="ad-banner-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleBannerFile} />
            {bannerPreview && <img src={bannerPreview} alt="banner preview" className="mt-2 rounded" style={{ maxHeight: 90 }} />}
          </Form.Group>
          <Form.Check
            type="switch"
            label="Active"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onSave}>{editing ? 'Save Changes' : 'Create'}</Button>
      </Modal.Footer>
    </Modal>
  );
}
export default Advertisements;