import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { FaPlus, FaEdit, FaEye, FaSearch, FaUserCheck, FaUserTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  useEffect(() => {
    fetchStudents();
  }, [status]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/school-admin/students?status=${status}`);
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await api.get(`/school-admin/students?search=${search}&status=${status}`);
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to search students');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/school-admin/students/${id}/status`, { status: newStatus });
      toast.success(`Student ${newStatus.toLowerCase()}`);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to update student status');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.admission_number?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-5">Loading students...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Students</h2>
          <p className="text-muted">Manage all students in your school</p>
        </div>
        <Link to="/admin/students/new" className="btn btn-primary">
          <FaPlus className="me-2" />
          Add Student
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn btn-primary" onClick={handleSearch}>
                  Search
                </button>
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="">All</option>
              </select>
            </div>
            <div className="col-md-3 text-end">
              <button className="btn btn-outline-secondary" onClick={fetchStudents}>
                Refresh
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Admission No.</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={student.name}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {student.name?.[0]}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{student.name}</strong>
                    </td>
                    <td>{student.admission_number || '-'}</td>
                    <td>{student.class || '-'}</td>
                    <td>{student.section || '-'}</td>
                    <td>
                      <span className={`badge ${student.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <Link to={`/admin/students/${student.id}/edit`} className="btn btn-sm btn-outline-primary">
                          <FaEdit />
                        </Link>
                        <button
                          className={`btn btn-sm ${student.status === 'ACTIVE' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => handleStatusToggle(student.id, student.status)}
                        >
                          {student.status === 'ACTIVE' ? <FaUserTimes /> : <FaUserCheck />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No students found
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

export default Students;