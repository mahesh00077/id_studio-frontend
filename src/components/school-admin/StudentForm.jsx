import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FaSave, FaTimes } from 'react-icons/fa';

function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    phone: '',
    address: '',
    class: '',
    section: '',
    admissionNumber: '',
    photoUrl: ''
  });

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/school-admin/students/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error('Failed to fetch student');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await api.put(`/school-admin/students/${id}`, formData);
        toast.success('Student updated successfully');
      } else {
        await api.post('/school-admin/students', formData);
        toast.success('Student created successfully');
      }
      navigate('/admin/students');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">{id ? 'Edit Student' : 'Add New Student'}</h2>
          <p className="text-muted">{id ? 'Update student information' : 'Add a new student to the school'}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Student Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Father's/Parent's Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="fatherName"
                  value={formData.fatherName || ''}
                  onChange={handleChange}
                  placeholder="Enter father's name"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Admission Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="admissionNumber"
                  value={formData.admissionNumber || ''}
                  onChange={handleChange}
                  placeholder="Enter admission number"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Class</label>
                <input
                  type="text"
                  className="form-control"
                  name="class"
                  value={formData.class || ''}
                  onChange={handleChange}
                  placeholder="Enter class"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Section</label>
                <input
                  type="text"
                  className="form-control"
                  name="section"
                  value={formData.section || ''}
                  onChange={handleChange}
                  placeholder="Enter section"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea
                className="form-control"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                rows="2"
                placeholder="Enter address"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Photo URL</label>
              <input
                type="text"
                className="form-control"
                name="photoUrl"
                value={formData.photoUrl || ''}
                onChange={handleChange}
                placeholder="Enter photo URL"
              />
              <small className="text-muted">Upload photo URL or use upload endpoint</small>
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <FaSave className="me-2" />
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/admin/students')}
              >
                <FaTimes className="me-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentForm;