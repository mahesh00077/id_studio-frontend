import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
    FaPlus, 
    FaTrash, 
    FaImage, 
    FaSchool,
    FaCheck,
    FaTimes,
    FaUpload,
    FaSync,
    FaExclamationTriangle,
    FaEye,
    FaFont
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import TemplateFieldEditor from './TemplateFieldEditor';

// Placeholder image
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <rect width="200" height="200" fill="#f1f5f9"/>
  <rect x="10" y="10" width="180" height="180" fill="none" stroke="#cbd5e1" stroke-width="2" rx="4"/>
  <text x="100" y="90" font-size="32" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">No Image</text>
  <text x="100" y="130" font-size="14" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">Upload Front Image</text>
</svg>
`);

function Designs() {
    const navigate = useNavigate();
    const [designs, setDesigns] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [selectedSchools, setSelectedSchools] = useState([]);
    const [deleteWarning, setDeleteWarning] = useState(null);
    const [previewDesign, setPreviewDesign] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        isGlobal: false,
        frontImage: null,
        backImage: null,
        frontImageUrl: '',
        backImageUrl: ''
    });
    const [previewImages, setPreviewImages] = useState({
        front: null,
        back: null
    });
    const [uploading, setUploading] = useState(false);
    const [imageError, setImageError] = useState({});
    const [showFieldEditor, setShowFieldEditor] = useState(false);
    const [fieldEditorDesign, setFieldEditorDesign] = useState(null);

    useEffect(() => {
        fetchDesigns();
        fetchSchools();
    }, []);

    const fetchDesigns = async () => {
        setLoading(true);
        try {
            console.log('📥 Fetching designs...');
            const response = await api.get('/owner/designs');
            console.log('📥 Designs response:', response.data);
            setDesigns(response.data || []);
        } catch (error) {
            console.error('❌ Fetch designs error:', error);
            toast.error('Failed to fetch designs');
            setDesigns([]);
        } finally {
            setLoading(false);
        }
    };

    const openFieldEditor = (design) => {
       setFieldEditorDesign(design);
       setShowFieldEditor(true);
   };

    const fetchSchools = async () => {
        try {
            const response = await api.get('/owner/schools');
            setSchools(response.data || []);
        } catch (error) {
            console.error('Fetch schools error:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.error('Please upload JPEG, PNG, or WebP image');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setFormData({
                ...formData,
                [type]: file
            });

            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewImages({
                    ...previewImages,
                    [type === 'frontImage' ? 'front' : 'back']: e.target.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name) {
            toast.error('Design name is required');
            return;
        }

        if (!formData.frontImage && !formData.frontImageUrl) {
            toast.error('Front image is required');
            return;
        }

        setUploading(true);

        try {
            let frontImageUrl = formData.frontImageUrl;
            let backImageUrl = formData.backImageUrl;

            if (formData.frontImage) {
                const uploadData = new FormData();
                uploadData.append('frontImage', formData.frontImage);
                if (formData.backImage) {
                    uploadData.append('backImage', formData.backImage);
                }

                const uploadResponse = await api.post('/owner/designs/upload', uploadData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (uploadResponse.data.success) {
                    frontImageUrl = uploadResponse.data.files.frontImageUrl;
                    backImageUrl = uploadResponse.data.files.backImageUrl || backImageUrl;
                }
            }

            const designData = {
                name: formData.name,
                frontImageUrl: frontImageUrl,
                backImageUrl: backImageUrl || null,
                isGlobal: formData.isGlobal
            };

            console.log('📤 Creating design:', designData);
            const response = await api.post('/owner/designs', designData);
            console.log('✅ Design created:', response.data);
            
            toast.success('Design created successfully');
            setShowModal(false);
            resetForm();
            fetchDesigns();
        } catch (error) {
            console.error('❌ Create design error:', error);
            toast.error(error.response?.data?.error || 'Failed to create design');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (design) => {
        try {
            const response = await api.get(`/owner/designs/${design.id}`);
            const used = response.data.assigned_schools?.length > 0;
            
            if (used) {
                setDeleteWarning({
                    design: design,
                    schools: response.data.assigned_schools
                });
                setShowDeleteModal(true);
                return;
            }
            
            if (window.confirm(`Are you sure you want to delete design "${design.name}"?`)) {
                await api.delete(`/owner/designs/${design.id}`);
                toast.success('Design deleted successfully');
                fetchDesigns();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to delete design');
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await api.patch(`/owner/designs/${id}/status`, { status: newStatus });
            toast.success(`Design ${newStatus.toLowerCase()}`);
            fetchDesigns();
        } catch (error) {
            toast.error('Failed to update design status');
        }
    };

    const openAssignModal = (design) => {
        setSelectedDesign(design);
        setSelectedSchools([]);
        setShowAssignModal(true);
    };

    const openPreviewModal = (design) => {
        setPreviewDesign(design);
        setShowPreviewModal(true);
    };

    const handleSchoolToggle = (schoolId) => {
        setSelectedSchools(prev => {
            if (prev.includes(schoolId)) {
                return prev.filter(id => id !== schoolId);
            } else {
                return [...prev, schoolId];
            }
        });
    };

    const handleAssignMultiple = async () => {
        if (!selectedDesign || selectedSchools.length === 0) {
            toast.error('Please select at least one school');
            return;
        }

        try {
            await api.post(`/owner/designs/${selectedDesign.id}/assign-multiple`, {
                schoolIds: selectedSchools
            });
            toast.success(`Design assigned to ${selectedSchools.length} school(s) successfully`);
            setShowAssignModal(false);
            setSelectedDesign(null);
            setSelectedSchools([]);
            fetchDesigns();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to assign design');
        }
    };

    const handleUnassign = async (designId, schoolId) => {
        if (!window.confirm('Remove this design from the school?')) return;
        
        try {
            await api.delete(`/owner/designs/${designId}/unassign/${schoolId}`);
            toast.success('Design removed from school');
            fetchDesigns();
        } catch (error) {
            toast.error('Failed to remove design');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            isGlobal: false,
            frontImage: null,
            backImage: null,
            frontImageUrl: '',
            backImageUrl: ''
        });
        setPreviewImages({
            front: null,
            back: null
        });
    };

    const getStatusBadge = (status) => {
        const colors = {
            'ACTIVE': 'bg-success',
            'INACTIVE': 'bg-secondary'
        };
        return <span className={`badge ${colors[status] || 'bg-secondary'}`}>{status}</span>;
    };

    const getImageUrl = (url) => {
        if (!url) return PLACEHOLDER_IMAGE;
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
            return url;
        }
        if (url.startsWith('/uploads')) {
            return url;
        }
        if (url.startsWith('uploads/')) {
            return `/${url}`;
        }
        return url;
    };

    const handleImageError = (e, designId, side) => {
        e.target.onerror = null;
        e.target.src = PLACEHOLDER_IMAGE;
        setImageError(prev => ({
            ...prev,
            [`${designId}-${side}`]: true
        }));
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">ID Card Designs</h2>
                    <p className="text-muted">Create and manage ID card design templates</p>
                </div>
                <div>
                    <button className="btn btn-outline-secondary me-2" onClick={fetchDesigns}>
                        <FaSync className="me-1" />
                        Refresh
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        <FaPlus className="me-2" />
                        New Design
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading designs...</p>
                </div>
            ) : designs.length > 0 ? (
                <div className="row g-4">
                    {designs.map((design) => {
                        const frontImageUrl = getImageUrl(design.front_template);
                        const backImageUrl = design.back_template ? getImageUrl(design.back_template) : null;
                        const frontError = imageError[`${design.id}-front`];
                        const backError = imageError[`${design.id}-back`];
                        
                        return (
                            <div key={design.id} className="col-md-6 col-lg-4">
                                <div className="card h-100">
                                    <div className="card-header d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">{design.name}</h6>
                                        {getStatusBadge(design.status)}
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-6">
                                                <div className="text-center">
                                                    <small className="text-muted">Front</small>
                                                    <img 
                                                        src={frontError ? PLACEHOLDER_IMAGE : frontImageUrl}
                                                        alt="Front" 
                                                        className="img-fluid border rounded"
                                                        style={{ height: '100px', objectFit: 'cover', width: '100%' }}
                                                        onError={(e) => handleImageError(e, design.id, 'front')}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="text-center">
                                                    <small className="text-muted">Back</small>
                                                    {backImageUrl ? (
                                                        <img 
                                                            src={backError ? PLACEHOLDER_IMAGE : backImageUrl}
                                                            alt="Back" 
                                                            className="img-fluid border rounded"
                                                            style={{ height: '100px', objectFit: 'cover', width: '100%' }}
                                                            onError={(e) => handleImageError(e, design.id, 'back')}
                                                        />
                                                    ) : (
                                                        <div className="border rounded d-flex align-items-center justify-content-center" style={{ height: '100px' }}>
                                                            <FaImage className="text-muted" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="badge bg-info">
                                                    {design.is_global ? 'Global' : 'Custom'}
                                                </span>
                                                <small className="text-muted">
                                                    {design.assigned_count || 0} schools
                                                </small>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="d-flex gap-1 flex-wrap">
                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => openPreviewModal(design)}
                                                    title="Preview Design"
                                                >
                                                    <FaEye className="me-1" />
                                                    Preview
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() => openAssignModal(design)}
                                                    title="Assign to Schools"
                                                >
                                                    <FaSchool className="me-1" />
                                                    Assign
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={() => openFieldEditor(design)}
                                                    title="Configure template fields"
                                                >
                                                    <FaFont className="me-1" />
                                                    Configure Fields
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-success"
                                                    onClick={() => navigate(`/designs/demo?design=${design.id}`)}
                                                    title="Demo generate with this design — creates a card without consuming credits"
                                                >
                                                    Demo Generate
                                                </button>
                                                <button
                                                    className={`btn btn-sm ${design.status === 'ACTIVE' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                    onClick={() => handleStatusToggle(design.id, design.status)}
                                                    title={design.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                                >
                                                    {design.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(design)}
                                                    title="Delete Design"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        {design.assigned_schools?.length > 0 && (
                                            <div className="mt-2">
                                                <small className="text-muted">Assigned to:</small>
                                                <div className="d-flex flex-wrap gap-1 mt-1">
                                                    {design.assigned_schools.map((school) => (
                                                        <span key={school.id} className="badge bg-light text-dark">
                                                            {school.name}
                                                            <button
                                                                className="btn btn-sm btn-link p-0 ms-1 text-danger"
                                                                onClick={() => handleUnassign(design.id, school.id)}
                                                                style={{ fontSize: '10px' }}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-5">
                    <FaImage size={48} className="text-muted mb-3" />
                    <h5 className="text-muted">No designs created yet</h5>
                    <p className="text-muted">Create your first ID card design template</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        <FaPlus className="me-2" />
                        Create Design
                    </button>
                </div>
            )}

            {/* Create Design Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Create New Design</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                    ></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Design Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Enter design name"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                name="isGlobal"
                                                checked={formData.isGlobal}
                                                onChange={handleInputChange}
                                                id="isGlobal"
                                            />
                                            <label className="form-check-label" htmlFor="isGlobal">
                                                Make this design available to all schools (Global)
                                            </label>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Front Image *</label>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(e, 'frontImage')}
                                                    required={!formData.frontImageUrl}
                                                />
                                                {previewImages.front && (
                                                    <div className="mt-2">
                                                        <img 
                                                            src={previewImages.front} 
                                                            alt="Front preview" 
                                                            className="img-fluid border rounded"
                                                            style={{ maxHeight: '150px' }}
                                                        />
                                                    </div>
                                                )}
                                                <small className="text-muted">JPEG, PNG, WebP (Max 5MB)</small>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Back Image</label>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(e, 'backImage')}
                                                />
                                                {previewImages.back && (
                                                    <div className="mt-2">
                                                        <img 
                                                            src={previewImages.back} 
                                                            alt="Back preview" 
                                                            className="img-fluid border rounded"
                                                            style={{ maxHeight: '150px' }}
                                                        />
                                                    </div>
                                                )}
                                                <small className="text-muted">JPEG, PNG, WebP (Max 5MB)</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <FaUpload className="me-2" />
                                                Create Design
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && selectedDesign && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Assign "{selectedDesign.name}" to Schools
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedDesign(null);
                                        setSelectedSchools([]);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-3">
                                    Select one or more schools to assign this design to.
                                    <br />
                                    <small>Selected: {selectedSchools.length} school(s)</small>
                                </p>
                                
                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="selectAll"
                                            checked={selectedSchools.length === schools.length && schools.length > 0}
                                            onChange={() => {
                                                if (selectedSchools.length === schools.length) {
                                                    setSelectedSchools([]);
                                                } else {
                                                    setSelectedSchools(schools.map(s => s.id));
                                                }
                                            }}
                                        />
                                        <label className="form-check-label" htmlFor="selectAll">
                                            <strong>Select All Schools</strong>
                                        </label>
                                    </div>
                                    <hr />
                                    <div className="school-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {schools.map((school) => {
                                            const isAssigned = selectedDesign.assigned_schools?.some(s => s.id === school.id);
                                            const isSelected = selectedSchools.includes(school.id);
                                            
                                            return (
                                                <div key={school.id} className="form-check mb-2">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id={`school-${school.id}`}
                                                        checked={isSelected}
                                                        onChange={() => handleSchoolToggle(school.id)}
                                                        disabled={isAssigned}
                                                    />
                                                    <label className="form-check-label" htmlFor={`school-${school.id}`}>
                                                        {school.name}
                                                        {isAssigned && (
                                                            <span className="badge bg-success ms-2">Already Assigned</span>
                                                        )}
                                                        <br />
                                                        <small className="text-muted">
                                                            Credits: {school.credit_balance || 0}
                                                        </small>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedDesign(null);
                                        setSelectedSchools([]);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAssignMultiple}
                                    disabled={selectedSchools.length === 0}
                                >
                                    <FaCheck className="me-2" />
                                    Assign to {selectedSchools.length} School(s)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Warning Modal */}
            {showDeleteModal && deleteWarning && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    <FaExclamationTriangle className="me-2" />
                                    Cannot Delete Design
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteWarning(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-3">
                                    <strong>"{deleteWarning.design.name}"</strong> is assigned to:
                                </p>
                                <ul className="list-group mb-3">
                                    {deleteWarning.schools.map((school) => (
                                        <li key={school.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            {school.name}
                                            <span className="badge bg-primary">Assigned</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="alert alert-warning">
                                    <FaExclamationTriangle className="me-2" />
                                    Please unassign from all schools before deleting.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteWarning(null);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

{/* Preview Modal */}
            {showPreviewModal && previewDesign && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <FaEye className="me-2" />
                                    Preview Design
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowPreviewModal(false);
                                        setPreviewDesign(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-3">
                                    <h6>{previewDesign.name}</h6>
                                    {getStatusBadge(previewDesign.status)}
                                </div>
                                <div className="row">
                                    <div className="col-md-6 text-center">
                                        <h6 className="mb-3">Front Side</h6>
                                        <img
                                            src={getImageUrl(previewDesign.front_template)}
                                            alt="Front"
                                            className="img-fluid border rounded shadow-sm"
                                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                                            onError={(e) => handleImageError(e, previewDesign.id, 'front')}
                                        />
                                    </div>
                                    <div className="col-md-6 text-center">
                                        <h6 className="mb-3">Back Side</h6>
                                        {previewDesign.back_template ? (
                                            <img
                                                src={getImageUrl(previewDesign.back_template)}
                                                alt="Back"
                                                className="img-fluid border rounded shadow-sm"
                                                style={{ maxHeight: '400px', objectFit: 'contain' }}
                                                onError={(e) => handleImageError(e, previewDesign.id, 'back')}
                                            />
                                        ) : (
                                            <div className="border rounded d-flex align-items-center justify-content-center text-muted" style={{ minHeight: '200px' }}>
                                                <FaImage className="me-2" />
                                                No back template
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowPreviewModal(false);
                                        setPreviewDesign(null);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showFieldEditor && fieldEditorDesign && (
               <TemplateFieldEditor
                   design={fieldEditorDesign}
                   onClose={() => {
                       setShowFieldEditor(false);
                       setFieldEditorDesign(null);
                       fetchDesigns();
                   }}
               />
           )}

            </div>
    );
}

export default Designs;