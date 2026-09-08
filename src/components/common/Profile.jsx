import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FaUserCircle, FaSchool, FaEnvelope, FaCrown, FaKey, FaLock,
  FaShieldAlt, FaCheckCircle, FaSignOutAlt, FaIdCard
} from 'react-icons/fa';
import { Form, Button, Alert } from 'react-bootstrap';

// Friendly role metadata (label + badge class) shared by the header and the
// details grid. SCHOOL_ADMIN shows as "Admin", SCHOOL_STAFF as "Staff".
const ROLE_META = {
  OWNER: { label: 'Owner', badge: 'badge-owner', icon: FaCrown },
  SCHOOL_ADMIN: { label: 'Admin', badge: 'badge-admin', icon: FaShieldAlt },
  SCHOOL_STAFF: { label: 'Staff', badge: 'badge-staff', icon: FaIdCard }
};

// Rough client-side strength meter for the new password.
function passwordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 5);
}

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
const STRENGTH_COLORS = ['#dc2626', '#dc2626', '#f59e0b', '#f59e0b', '#16a34a', '#16a34a'];

function Profile() {
  const { user, school, logout, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const meta = ROLE_META[user?.role] || null;
  const displayName = user?.email?.split('@')[0] || 'User';
  const passwordScore = passwordStrength(newPassword);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match');
      return;
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    if (!result.success && result.error) {
      setErrorMsg(result.error);
    }
    if (result.success) {
      setSuccessMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">My Profile</h2>
          <p className="text-muted mb-0">Manage your account details and security</p>
        </div>
        <button className="btn btn-outline-danger" onClick={logout}>
          <FaSignOutAlt className="me-1" /> Logout
        </button>
      </div>

      <div className="row g-4">
        {/* Identity card */}
        <div className="col-md-6 col-lg-4">
          <div className="card profile-identity-card h-100 shadow-sm border-0 overflow-hidden">
            <div
              className="profile-identity-banner"
              style={{ height: '90px', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
            />
            <div className="card-body text-center pt-0">
              <div className="mx-auto" style={{ marginTop: '-48px', width: '96px' }}>
                <FaUserCircle size={96} className="text-primary bg-white rounded-circle" />
              </div>
              <h4 className="mb-1 mt-2">{displayName}</h4>
              {meta && (
                <span className={`badge ${meta.badge} mb-3`}>
                  <meta.icon size={12} className="me-1" />
                  {meta.label}
                </span>
              )}
              <hr />
              <div className="text-start small">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FaEnvelope className="text-muted flex-shrink-0" />
                  <span className="text-truncate">{user?.email || '-'}</span>
                </div>
                {user?.role !== 'OWNER' && school && (
                  <div className="d-flex align-items-center gap-2">
                    <FaSchool className="text-muted flex-shrink-0" />
                    <span className="text-truncate">{school.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-md-6 col-lg-8">
          <div className="row g-4 h-100">

            {/* Account details */}
            <div className="col-lg-6">
              <div className="card h-100 shadow-sm">
                <div className="card-header bg-white border-bottom-0 pt-3">
                  <strong><FaUserCircle className="me-2 text-primary" />Account Details</strong>
                </div>
                <div className="card-body pt-2">
                  <ul className="list-unstyled mb-0 profile-details-list">
                    <li className="d-flex align-items-start gap-3 mb-3">
                      <span className="profile-detail-icon"><FaEnvelope /></span>
                      <span>
                        <span className="d-block text-muted small">Email</span>
                        <strong className="text-break">{user?.email || '-'}</strong>
                      </span>
                    </li>
                    <li className="d-flex align-items-start gap-3 mb-3">
                      <span className="profile-detail-icon">{meta ? <meta.icon /> : <FaCrown />}</span>
                      <span>
                        <span className="d-block text-muted small">Role</span>
                        <strong>{meta ? meta.label : user?.role || '-'}</strong>
                      </span>
                    </li>
                    {user?.role !== 'OWNER' && (
                      <li className="d-flex align-items-start gap-3">
                        <span className="profile-detail-icon"><FaSchool /></span>
                        <span>
                          <span className="d-block text-muted small">School</span>
                          <strong>{school?.name || '-'}</strong>
                          {school?.credit_balance !== undefined && (
                            <span className="d-block text-muted small mt-1">
                              Credits available: <strong>{school.credit_balance}</strong>
                            </span>
                          )}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Change password */}
            <div className="col-lg-6">
              <div className="card h-100 shadow-sm">
                <div className="card-header bg-white border-bottom-0 pt-3">
                  <strong><FaKey className="me-2 text-primary" />Change Password</strong>
                </div>
                <div className="card-body pt-2">
                  {successMsg && (
                    <Alert variant="success" className="py-2 small">
                      <FaCheckCircle className="me-1" />{successMsg}
                    </Alert>
                  )}
                  {errorMsg && <Alert variant="danger" className="py-2 small">{errorMsg}</Alert>}

                  <Form onSubmit={handleChangePassword}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold">Current Password</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaLock size={12} /></span>
                        <Form.Control
                          type={showPasswords ? 'text' : 'password'}
                          placeholder="Enter current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          disabled={loading}
                          autoComplete="current-password"
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-semibold">New Password</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaKey size={12} /></span>
                        <Form.Control
                          type={showPasswords ? 'text' : 'password'}
                          placeholder="Min 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength="8"
                          disabled={loading}
                          autoComplete="new-password"
                        />
                      </div>
                      {newPassword && (
                        <div className="mt-2">
                          <div className="progress" style={{ height: '5px' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${(passwordScore / 5) * 100}%`,
                                background: STRENGTH_COLORS[passwordScore]
                              }}
                            />
                          </div>
                          <small style={{ color: STRENGTH_COLORS[passwordScore] }}>
                            {STRENGTH_LABELS[passwordScore]}
                          </small>
                        </div>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold">Confirm New Password</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text"><FaKey size={12} /></span>
                        <Form.Control
                          type={showPasswords ? 'text' : 'password'}
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength="8"
                          disabled={loading}
                          autoComplete="new-password"
                          isInvalid={
                            confirmPassword.length > 0 &&
                            confirmPassword !== newPassword
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          Passwords do not match
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>

                    <Form.Check
                      type="checkbox"
                      id="profile-show-passwords"
                      label="Show passwords"
                      className="small text-muted mb-3"
                      checked={showPasswords}
                      onChange={() => setShowPasswords(!showPasswords)}
                    />

                    <Button type="submit" variant="primary" disabled={loading} className="w-100">
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;