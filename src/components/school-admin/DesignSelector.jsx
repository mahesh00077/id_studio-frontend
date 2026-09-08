import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';

function DesignSelector({
    designs = [],
    selectedDesign = null,
    onSelect,
    loading = false
}) {
    if (loading) {
        return (
            <div className="card shadow-sm border-0">
                <div className="card-header bg-primary text-white">
                    <SchoolIcon className="me-2" />
                    Select ID Card Design
                </div>

                <div className="card-body">
                    <div className="row g-3">
                        {[1, 2, 3].map((item) => (
                            <div className="col-md-4" key={item}>
                                <div
                                    className="border rounded p-2"
                                    style={{ height: '230px' }}
                                >
                                    <div
                                        className="placeholder-glow rounded"
                                        style={{
                                            height: '180px',
                                            background: '#f1f5f9'
                                        }}
                                    >
                                        <span className="placeholder col-12 h-100 rounded"></span>
                                    </div>

                                    <div className="placeholder-glow mt-2">
                                        <span className="placeholder col-8"></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!designs.length) {
        return (
            <div className="card shadow-sm border-0">
                <div className="card-header bg-primary text-white">
                    <SchoolIcon className="me-2" />
                    Select ID Card Design
                </div>

                <div className="card-body text-center py-5">
                    <SchoolIcon
                        style={{
                            fontSize: '60px',
                            color: '#94a3b8'
                        }}
                    />

                    <h5 className="mt-3">No designs available</h5>

                    <p className="text-muted mb-0">
                        Please ask the owner to add an ID card design.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <div>
                    <SchoolIcon className="me-2" />
                    Select ID Card Design
                </div>

                <span className="badge bg-light text-primary">
                    {designs.length} Design{designs.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="card-body">
                <div className="row g-3">
                    {designs.map((design) => {
                        const isSelected =
                            selectedDesign?.id === design.id;

                        const imageUrl =
                            design.front_template ||
                            design.image_url ||
                            design.image ||
                            design.thumbnail ||
                            '';

                        return (
                            <div
                                className="col-xl-3 col-lg-4 col-md-6"
                                key={design.id}
                            >
                                <div
                                    className={`id-design-card ${
                                        isSelected
                                            ? 'id-design-card-selected'
                                            : ''
                                    }`}
                                    onClick={() => onSelect(design)}
                                >
                                    <div className="id-design-image-wrapper">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={design.name || 'ID Card Design'}
                                                className="id-design-image"
                                            />
                                        ) : (
                                            <div className="id-design-no-image">
                                                <SchoolIcon
                                                    style={{
                                                        fontSize: '45px'
                                                    }}
                                                />

                                                <span>
                                                    No Preview
                                                </span>
                                            </div>
                                        )}

                                        {isSelected && (
                                            <div className="id-design-selected-badge">
                                                <CheckCircleIcon />
                                            </div>
                                        )}

                                        <div className="id-design-overlay">
                                            <VisibilityIcon />
                                            <span>Click to select</span>
                                        </div>
                                    </div>

                                    <div className="id-design-info">
                                        <div className="d-flex justify-content-between align-items-center gap-2">
                                            <div
                                                className="fw-semibold text-truncate"
                                                title={design.name}
                                            >
                                                {design.name ||
                                                    `Design #${design.id}`}
                                            </div>

                                            {isSelected && (
                                                <span className="badge bg-primary">
                                                    Selected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedDesign && (
                    <div className="mt-4 p-3 rounded bg-light border">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <small className="text-muted d-block">
                                    Selected Design
                                </small>

                                <strong>
                                    {selectedDesign.name ||
                                        `Design #${selectedDesign.id}`}
                                </strong>
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => onSelect(selectedDesign, true)}
                            >
                                Continue
                                <span className="ms-2">→</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DesignSelector;