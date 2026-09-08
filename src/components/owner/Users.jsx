import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FaUserPlus, FaSync, FaTrash, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';

function Users() {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'SCHOOL_ADMIN',
    schoolId: ''
  });

  const resetForm = () => {
    setFormData({ email: '', password: '', role: 'SCHOOL_ADMIN', schoolId: '' });
    setEditingUser(null);
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', role: 'SCHOOL_ADMIN', schoolId: selectedSchool || '' });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      password: '', // optional on edit
      role: user.role || 'SCHOOL_ADMIN',
      schoolId: user.school_id || selectedSchool || ''
    });
    setShowModal(true);
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchUsers();
    }
  }, [selectedSchool]);

  const fetchSchools = async () => {
    try {
      const response = await api.get('/owner/schools');
      setSchools(response.data);
    } catch (error) {
      toast.error('Failed to fetch schools');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Owner needs to see ALL users (Active + Inactive) to manage them
      const response = await api.get(`/owner/users`, {
        params: { schoolId: selectedSchool }
      });
      
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        // Update existing user (password optional).
        const payload = {
          email: formData.email,
          role: formData.role,
          schoolId: formData.schoolId
        };
        if (formData.password) payload.password = formData.password;

        await api.put(`/owner/users/${editingUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        const endpoint = formData.role === 'SCHOOL_ADMIN'
          ? '/owner/users/admin'
          : '/owner/users/staff';

        await api.post(endpoint, {
          email: formData.email,
          password: formData.password,
          schoolId: formData.schoolId
        });

        toast.success(`${formData.role} created successfully`);
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      // This PATCH call updates the MySQL status perfectly
      await api.patch(`/owner/users/${userId}/status`, { status: newStatus });
      toast.success(`User ${newStatus.toLowerCase()}`);
      fetchUsers(); // Fetching again to show the updated status in the list
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/owner/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'OWNER': return <span className="badge bg-dark">Owner</span>;
      case 'SCHOOL_ADMIN': return <span className="badge bg-primary">Admin</span>;
      case 'SCHOOL_STAFF': return <span className="badge bg-info text-dark">Staff</span>;
      default: return <span className="badge bg-secondary">{role}</span>;
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">User Management</h2>
          <p className="text-muted">Manage users for each school</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOpenCreate}
        >
          <FaUserPlus className="me-2" />
          Add User
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-6">
              <label className="form-label">Select School</label>
              <select
                className="form-select"
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
              >
                <option value="">Choose a school...</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-6 d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={fetchUsers}
                disabled={!selectedSchool || loading}
              >
                <FaSync className={`me-2 ${loading ? 'fa-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedSchool && (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Permissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ opacity: user.status === 'INACTIVE' ? '0.7' : '1' }}>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        {/* TOGGLE SWITCH UI - Shows ALL users regardless of status */}
                        <div className="form-check form-switch d-flex align-items-center gap-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`userStatus_${user.id}`}
                            checked={user.status === 'ACTIVE'}
                            onChange={() => handleStatusToggle(user.id, user.status)}
                            style={{
                                cursor: 'pointer',
                                width: '45px',
                                height: '24px',
                                backgroundColor: user.status === 'ACTIVE' ? '#198754' : '#dc3545',
                                borderColor: user.status === 'ACTIVE' ? '#198754' : '#dc3545'
                            }}
                          />
                          <label 
                            className={`form-check-label fw-bold ${user.status === 'ACTIVE' ? 'text-success' : 'text-danger'}`} 
                            htmlFor={`userStatus_${user.id}`}
                          >
                            {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </label>
                        </div>
                      </td>
                      <td>
                        {user.permissions && Object.keys(user.permissions).length > 0 
                          ? Object.keys(user.permissions).join(', ')
                          : 'None'
                        }
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenEdit(user)}
                            title="Edit User"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete User"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No users found for this school
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmitUser}>
                <div className="modal-header">
                  <h5 className="modal-title">{editingUser ? 'Edit User' : 'Add New User'}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => { setShowModal(false); resetForm(); }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Password {editingUser ? '(leave blank to keep current)' : ''}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required={!editingUser}
                      minLength="8"
                      placeholder={editingUser ? 'Enter new password (optional)' : 'Enter password'}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="SCHOOL_ADMIN">School Admin</option>
                      <option value="SCHOOL_STAFF">School Staff</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">School</label>
                    <select
                      className="form-select"
                      value={formData.schoolId}
                      onChange={(e) => setFormData({...formData, schoolId: e.target.value})}
                      required
                    >
                      <option value="">Select a school...</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setShowModal(false); resetForm(); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (editingUser ? 'Saving...' : 'Creating...') : (editingUser ? 'Save Changes' : 'Create User')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;