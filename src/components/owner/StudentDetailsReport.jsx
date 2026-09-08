import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  FaSchool,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
  FaUserGraduate,
  FaSearch
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const NODE_API_ORIGIN = (
  import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

function imgUrl(url) {
  if (!url) return '';
  const value = String(url).trim();
  if (!value) return '';
  if (value.startsWith('data:') || value.startsWith('blob:')) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/api/')) return `${window.location.origin}${value}`;
  if (value.startsWith('/uploads/')) return `${NODE_API_ORIGIN}${value}`;
  if (value.startsWith('uploads/')) return `${NODE_API_ORIGIN}/${value}`;
  if (!value.startsWith('/')) return `${NODE_API_ORIGIN}/${value}`;
  return `${NODE_API_ORIGIN}${value}`;
}

function StudentDetailsReport() {
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/owner/schools');
        setSchools(res.data || []);
      } catch (err) {
        toast.error('Failed to load schools');
      } finally {
        setLoadingSchools(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSchoolId) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    setStudents([]);
    api
      .get(`/owner/schools/${selectedSchoolId}/students`, {
        params: search ? { search } : {},
      })
      .then((res) => setStudents(res.data || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoadingStudents(false));
  }, [selectedSchoolId]);

  const selectedSchool = schools.find((s) => String(s.id) === String(selectedSchoolId));

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      String(s.name || '').toLowerCase().includes(q) ||
      String(s.admission_number || '').toLowerCase().includes(q) ||
      String(s.father_name || '').toLowerCase().includes(q) ||
      String(s.phone || '').toLowerCase().includes(q) ||
      String(s.class || '').toLowerCase().includes(q) ||
      String(s.section || '').toLowerCase().includes(q)
    );
  });
const exportExcel = () => {
    if (!filtered.length) return toast.error('No students to export');
    const rows = [
      [
        'Student Name',
        "Father's Name",
        'Class',
        'Section',
        'Admission No',
        'Phone',
        'Address',
        'Status',
      ],
      ...filtered.map((s) => [
        s.name || '',
        s.father_name || '',
        s.class || '',
        s.section || '',
        s.admission_number || '',
        s.phone || '',
        s.address || '',
        s.status || 'ACTIVE',
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    // BOM so Excel opens UTF-8 correctly.
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-details-${selectedSchool?.name || 'school'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    if (!filtered.length) return toast.error('No students to export');
    const schoolName = selectedSchool?.name || 'School';
    const title = `${schoolName} — Student Details Report`;
    const safe = (v) => String(v || '—').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const printRows = filtered
      .map(
        (s) => `<tr>
          <td>${safe(s.name)}</td>
          <td>${safe(s.father_name)}</td>
          <td>${safe(s.class)}</td>
          <td>${safe(s.section)}</td>
          <td>${safe(s.admission_number)}</td>
          <td>${safe(s.phone)}</td>
          <td>${safe(s.address)}</td>
        </tr>`
      )
      .join('');
    const generated = new Date().toLocaleString();

    const w = window.open('', '_blank');
    if (!w) return toast.error('Popup blocked. Allow popups to export the PDF.');
    w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 16px; font-weight: 600; color: #334155; margin: 0 0 2px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
  th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; }
  tr:nth-child(even) td { background: #f8fafc; }
  @media print { body { padding: 10mm; } }
</style></head><body>
  <h1>${schoolName}</h1>
  <h2>Student Details Report</h2>
  <div class="meta">Generated: ${generated} &nbsp;|&nbsp; Total Students: ${filtered.length}</div>
  <table>
    <thead><tr>
      <th>Student Name</th><th>Father's Name</th><th>Class</th><th>Section</th>
      <th>Admission No</th><th>Phone</th><th>Address</th>
    </tr></thead>
    <tbody>${printRows}</tbody>
  </table>
</body></html>`);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 400);
  };
return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h4 className="mb-1">Student Details</h4>
          <p className="text-muted mb-0">
            Select a school to view its whole student list and export as PDF or Excel.
          </p>
        </div>
      </div>

      <div className="card mb-3 shadow-sm border-0">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Select School</label>
              <select
                className="form-select"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                disabled={loadingSchools}
              >
                <option value="">{loadingSchools ? 'Loading schools...' : '— Choose a school —'}</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedSchoolId && (
              <div className="col-md-6 d-flex flex-wrap gap-2">
                <button className="btn btn-success" onClick={exportExcel} disabled={!filtered.length}>
                  <FaFileExcel className="me-2" /> Export Excel
                </button>
                <button className="btn btn-danger" onClick={exportPdf} disabled={!filtered.length}>
                  <FaFilePdf className="me-2" /> Export PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSchoolId ? (
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <strong>
                  <FaUserGraduate className="me-2" />
                  {selectedSchool?.name} — {filtered.length} student{filtered.length === 1 ? '' : 's'}
                </strong>
              </div>
              <div className="input-group" style={{ maxWidth: 320 }}>
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loadingStudents ? (
              <div className="text-center py-5">Loading students...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Student Name</th>
                      <th>Father's Name</th>
                      <th>Class</th>
                      <th>Section</th>
                      <th>Admission No</th>
                      <th>Phone</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id}>
                        <td>
                          {s.photo_url ? (
                            <img
                              src={imgUrl(s.photo_url)}
                              alt=""
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 6,
                                background: '#e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8',
                              }}
                            >
                              <FaUserGraduate />
                            </div>
                          )}
                        </td>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.father_name || '-'}</td>
                        <td>{s.class || '-'}</td>
                        <td>{s.section || '-'}</td>
                        <td>{s.admission_number || '-'}</td>
                        <td>{s.phone || '-'}</td>
                        <td>{s.address || '-'}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No students found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center text-muted py-5">
            <FaSchool size={40} className="mb-2" />
            <div>Select a school above to view its students.</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDetailsReport;