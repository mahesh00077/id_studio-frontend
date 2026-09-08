import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { FaPlus, FaEdit, FaEye, FaTrash, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';

function Schools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await api.get('/owner/schools');
      setSchools(response.data);
    } catch (error) {
      toast.error('Failed to fetch schools');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/owner/schools/${id}/status`, { status: newStatus });
      toast.success(`School ${newStatus.toLowerCase()}`);
      fetchSchools();
    } catch (error) {
      toast.error('Failed to update school status');
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(search.toLowerCase()) ||
    school.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-5">Loading schools...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Schools</h2>
          <p className="text-muted">Manage all schools in the system</p>
        </div>
        <Link to="/schools/new" className="btn btn-primary">
          <FaPlus className="me-2" />
          Add School
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text">
                <FaSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search schools..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Credits</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id}>
                    <td>
                      <strong>{school.name}</strong>
                    </td>
                    <td>{school.email || '-'}</td>
                    <td>{school.phone || '-'}</td>
                    <td>
                      <span className="badge bg-info">
                        {school.credit_balance || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${school.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                        {school.status}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <Link to={`/schools/${school.id}/edit`} className="btn btn-sm btn-outline-primary">
                          <FaEdit />
                        </Link>
                        <button
                          className={`btn btn-sm ${school.status === 'ACTIVE' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => handleStatusToggle(school.id, school.status)}
                        >
                          {school.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSchools.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No schools found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Schools;