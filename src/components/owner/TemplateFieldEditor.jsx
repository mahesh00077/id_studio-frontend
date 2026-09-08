import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
    FaSave,
    FaTimes,
    FaUndo,
    FaPlus,
    FaTrash,
    FaArrowsAlt,
    FaExpand,
    FaImage,
    FaFont
} from 'react-icons/fa';
import './TemplateFieldEditor.css';

const FIELD_TYPES = [
    { key: 'studentName', label: 'Student Name', type: 'TEXT', defaultWidth: 0.55, defaultHeight: 0.055 },
    { key: 'fatherName', label: "Father's Name", type: 'TEXT', defaultWidth: 0.55, defaultHeight: 0.055 },
    { key: 'class', label: 'Class', type: 'TEXT', defaultWidth: 0.25, defaultHeight: 0.055 },
    { key: 'section', label: 'Section', type: 'TEXT', defaultWidth: 0.25, defaultHeight: 0.055 },
    { key: 'address', label: 'Address', type: 'TEXT', defaultWidth: 0.75, defaultHeight: 0.07 },
    { key: 'phone', label: 'Mobile No', type: 'TEXT', defaultWidth: 0.50, defaultHeight: 0.055 },
    { key: 'dob', label: 'Date of Birth', type: 'TEXT', defaultWidth: 0.40, defaultHeight: 0.055 },
    { key: 'admissionNo', label: 'Admission No', type: 'TEXT', defaultWidth: 0.45, defaultHeight: 0.055 },
    { key: 'photo', label: 'Student Photo', type: 'PHOTO', defaultWidth: 0.30, defaultHeight: 0.25 }
];

const DEFAULT_FONT = {
    font_family: 'Arial',
    font_size: 24,
    font_weight: 'normal',
    font_style: 'normal',
    text_align: 'left',
    color: '#000000',
    line_height: 1.2,
    max_lines: 1,
    fit_mode: 'cover',
    is_required: false,
    source: 'MANUAL'
};

function getImageUrl(url) {
    if (!url) return '';
    if (
        url.startsWith('http') ||
        url.startsWith('data:') ||
        url.startsWith('blob:')
    ) return url;
    if (url.startsWith('/')) return url;
    return `/${url}`;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function TemplateFieldEditor({ design, onClose }) {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const dragRef = useRef(null);

    const [side, setSide] = useState('FRONT');
    const [fields, setFields] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    const templateUrl = useMemo(() => {
        return getImageUrl(
            side === 'FRONT' ? design?.front_template : design?.back_template
        );
    }, [design, side]);

    const selectedField = fields.find(field => field.id === selectedId) || null;

    useEffect(() => {
        loadFields();
        setSelectedId(null);
    }, [design?.id, side]);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
                return;
            }

            if (!selectedId) return;

            if (event.key === 'Delete') {
                event.preventDefault();
                removeSelectedField();
                return;
            }

            if (event.key.startsWith('Arrow')) {
                event.preventDefault();
                const step = event.shiftKey ? 0.01 : 0.002;
                let dx = 0;
                let dy = 0;

                if (event.key === 'ArrowLeft') dx = -step;
                if (event.key === 'ArrowRight') dx = step;
                if (event.key === 'ArrowUp') dy = -step;
                if (event.key === 'ArrowDown') dy = step;

                updateField(selectedId, {
                    x: clamp((selectedField?.x || 0) + dx, 0, 1 - (selectedField?.width || 0.1)),
                    y: clamp((selectedField?.y || 0) + dy, 0, 1 - (selectedField?.height || 0.1))
                });
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedId, selectedField]);

    async function loadFields() {
        if (!design?.id) return;

        setLoading(true);

        try {
            const response = await api.get(`/owner/designs/${design.id}/fields`, {
                params: { side }
            });

            setFields(response.data?.fields || []);
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.error || 'Failed to load template fields'
            );
            setFields([]);
        } finally {
            setLoading(false);
        }
    }

    function handleImageLoad(event) {
        const img = event.currentTarget;
        imageRef.current = img;

        setImageSize({
            width: img.naturalWidth,
            height: img.naturalHeight
        });
    }

    function addField(fieldDefinition) {
        const existing = fields.find(
            field => field.field_key === fieldDefinition.key
        );

        if (existing) {
            setSelectedId(existing.id);
            toast('Field already exists. Selected it.');
            return;
        }

        const newField = {
            id: `local-${Date.now()}-${fieldDefinition.key}`,
            design_id: design.id,
            side,
            field_key: fieldDefinition.key,
            field_type: fieldDefinition.type,
            x: 0.12,
            y: 0.50,
            width: fieldDefinition.defaultWidth,
            height: fieldDefinition.defaultHeight,
            ...DEFAULT_FONT,
            sort_order: fields.length
        };

        setFields(prev => [...prev, newField]);
        setSelectedId(newField.id);
    }

    function updateField(id, patch) {
        setFields(prev =>
            prev.map(field =>
                field.id === id ? { ...field, ...patch } : field
            )
        );
    }

    function removeSelectedField() {
        if (!selectedField) return;

        setFields(prev => prev.filter(field => field.id !== selectedId));
        setSelectedId(null);
    }

    function startDrag(event, field, mode = 'move') {
        event.preventDefault();
        event.stopPropagation();

        const canvas = canvasRef.current;
        if (!canvas) return;

        setSelectedId(field.id);

        const rect = canvas.getBoundingClientRect();

        dragRef.current = {
            mode,
            id: field.id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: field.x,
            startY: field.y,
            startWidth: field.width,
            startHeight: field.height,
            canvasWidth: rect.width,
            canvasHeight: rect.height
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', stopDrag);
    }

    function handlePointerMove(event) {
        const drag = dragRef.current;
        if (!drag) return;

        const dx = (event.clientX - drag.startClientX) / drag.canvasWidth;
        const dy = (event.clientY - drag.startClientY) / drag.canvasHeight;

        const current = fields.find(field => field.id === drag.id);
        if (!current) return;

        if (drag.mode === 'move') {
            updateField(drag.id, {
                x: clamp(drag.startX + dx, 0, 1 - drag.startWidth),
                y: clamp(drag.startY + dy, 0, 1 - drag.startHeight)
            });
        } else {
            const minWidth = 0.03;
            const minHeight = 0.025;

            updateField(drag.id, {
                width: clamp(
                    drag.startWidth + dx,
                    minWidth,
                    1 - drag.startX
                ),
                height: clamp(
                    drag.startHeight + dy,
                    minHeight,
                    1 - drag.startY
                )
            });
        }
    }

    function stopDrag() {
        dragRef.current = null;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', stopDrag);
    }

    function fieldLabel(field) {
        return FIELD_TYPES.find(item => item.key === field.field_key)?.label ||
            field.field_key;
    }

    async function saveFields() {
        if (!design?.id) return;

        setSaving(true);

        try {
            const payload = {
                side,
                fields: fields.map((field, index) => ({
                    ...(typeof field.id === 'string' && field.id.startsWith('local-') ? {} : { id: field.id }),
                    field_key: field.field_key,
                    field_type: field.field_type,
                    x: Number(field.x.toFixed(6)),
                    y: Number(field.y.toFixed(6)),
                    width: Number(field.width.toFixed(6)),
                    height: Number(field.height.toFixed(6)),
                    font_family: field.font_family,
                    font_size: Number(field.font_size),
                    font_weight: field.font_weight,
                    font_style: field.font_style,
                    text_align: field.text_align,
                    color: field.color,
                    line_height: Number(field.line_height),
                    max_lines: Number(field.max_lines),
                    fit_mode: field.fit_mode,
                    is_required: Boolean(field.is_required),
                    source: field.source || 'MANUAL',
                    sort_order: index
                }))
            };

            // Read the currently saved fields first. This lets us also
            // remove fields that the Owner deleted from the editor.
            const existingResponse = await api.get(
                `/owner/designs/${design.id}/fields`,
                { params: { side } }
            );

            const existingFields = existingResponse.data?.fields || [];

            if (fields.length > 0) {
                const response = await api.put(
                    `/owner/designs/${design.id}/fields`,
                    payload
                );

                // Remove saved fields that no longer exist in the editor.
                const currentKeys = new Set(
                    fields.map(field => field.field_key)
                );

                const removedFields = existingFields.filter(
                    field => !currentKeys.has(field.field_key)
                );

                for (const removedField of removedFields) {
                    await api.delete(
                        `/owner/designs/${design.id}/fields/${removedField.id}`
                    );
                }

                // Reload from server so local temporary IDs become real IDs.
                await loadFields();
            } else {
                // If the Owner removed every field, clear this side.
                await api.delete(
                    `/owner/designs/${design.id}/fields`,
                    { data: { side } }
                );
                setFields([]);
            }

            setSelectedId(null);
            toast.success(`${side} template fields saved`);
        } catch (error) {
            console.error(error);
            toast.error(
                error.response?.data?.error || 'Failed to save template fields'
            );
        } finally {
            setSaving(false);
        }
    }

    if (!design) return null;

    return (
        <div className="template-editor-overlay">
            <div className="template-editor-window">
                <div className="template-editor-header">
                    <div>
                        <h4 className="mb-0">Template Field Editor</h4>
                        <small className="text-muted">{design.name}</small>
                    </div>

                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={onClose}
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="template-editor-toolbar">
                    <div className="btn-group">
                        <button
                            className={`btn ${side === 'FRONT' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setSide('FRONT')}
                        >
                            Front
                        </button>

                        <button
                            className={`btn ${side === 'BACK' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setSide('BACK')}
                            disabled={!design.back_template}
                        >
                            Back
                        </button>
                    </div>

                    <div className="template-toolbar-info">
                        Original size:
                        <strong>
                            {imageSize.width || '-'} × {imageSize.height || '-'}
                        </strong>
                    </div>

                    <div className="ms-auto d-flex gap-2">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={loadFields}
                            disabled={loading || saving}
                        >
                            <FaUndo className="me-1" />
                            Reload
                        </button>

                        <button
                            className="btn btn-success"
                            onClick={saveFields}
                            disabled={saving || loading}
                        >
                            {saving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave className="me-1" />
                                    Save Fields
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="template-editor-body">
                    <aside className="template-field-sidebar">
                        <div className="sidebar-title">Add Field</div>
                        <div className="sidebar-help">
                            Click a field to add it. Then drag it to the exact
                            place on the design.
                        </div>

                        <div className="field-palette">
                            {FIELD_TYPES.map(field => {
                                const exists = fields.some(
                                    item => item.field_key === field.key
                                );

                                return (
                                    <button
                                        key={field.key}
                                        type="button"
                                        className={`field-palette-item ${exists ? 'exists' : ''}`}
                                        onClick={() => addField(field)}
                                    >
                                        {field.type === 'PHOTO'
                                            ? <FaImage />
                                            : <FaFont />
                                        }

                                        <span>{field.label}</span>

                                        {exists && (
                                            <span className="field-exists">
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <hr />

                        <div className="sidebar-title">Placed Fields</div>

                        <div className="placed-fields">
                            {fields.length === 0 && (
                                <div className="text-muted small">
                                    No fields placed yet.
                                </div>
                            )}

                            {fields.map(field => (
                                <button
                                    key={field.id}
                                    type="button"
                                    className={`placed-field-item ${selectedId === field.id ? 'active' : ''}`}
                                    onClick={() => setSelectedId(field.id)}
                                >
                                    <span>{fieldLabel(field)}</span>
                                    <small>{field.field_type}</small>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <main className="template-canvas-area">
                        {loading ? (
                            <div className="editor-loading">
                                <div className="spinner-border text-primary" />
                                <div className="mt-2">
                                    Loading saved fields...
                                </div>
                            </div>
                        ) : templateUrl ? (
                            <div className="template-canvas-wrap">
                                <div
                                    ref={canvasRef}
                                    className="template-canvas"
                                    onPointerDown={() => setSelectedId(null)}
                                >
                                    <img
                                        src={templateUrl}
                                        alt={`${design.name} ${side}`}
                                        className="template-background"
                                        onLoad={handleImageLoad}
                                        draggable={false}
                                    />

                                    {fields.map(field => (
                                        <div
                                            key={field.id}
                                            className={`template-field-object ${selectedId === field.id ? 'selected' : ''} ${field.field_type === 'PHOTO' ? 'photo-field' : ''}`}
                                            style={{
                                                left: `${field.x * 100}%`,
                                                top: `${field.y * 100}%`,
                                                width: `${field.width * 100}%`,
                                                height: `${field.height * 100}%`,
                                                color: field.color,
                                                fontFamily: field.font_family,
                                                fontSize: `${Math.max(8, field.font_size / 3)}px`,
                                                fontWeight: field.font_weight,
                                                fontStyle: field.font_style,
                                                textAlign: field.text_align
                                            }}
                                            onPointerDown={(event) =>
                                                startDrag(event, field, 'move')
                                            }
                                        >
                                            <div className="field-object-content">
                                                {field.field_type === 'PHOTO'
                                                    ? <FaImage className="photo-icon" />
                                                    : fieldLabel(field)
                                                }
                                            </div>

                                            {selectedId === field.id && (
                                                <>
                                                    <div className="field-object-label">
                                                        {fieldLabel(field)}
                                                    </div>

                                                    <div
                                                        className="resize-handle"
                                                        onPointerDown={(event) =>
                                                            startDrag(event, field, 'resize')
                                                        }
                                                    >
                                                        <FaExpand />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="editor-empty">
                                No {side.toLowerCase()} template image available.
                            </div>
                        )}
                    </main>

                    <aside className="template-properties-sidebar">
                        <div className="sidebar-title">Properties</div>

                        {!selectedField ? (
                            <div className="property-empty">
                                <FaArrowsAlt size={30} />
                                <p>Select a field on the template.</p>
                            </div>
                        ) : (
                            <>
                                <div className="selected-field-name">
                                    {fieldLabel(selectedField)}
                                </div>

                                <div className="property-section">
                                    <label>Field Key</label>
                                    <input
                                        className="form-control form-control-sm"
                                        value={selectedField.field_key}
                                        readOnly
                                    />
                                </div>

                                <div className="row g-2">
                                    <div className="col-6">
                                        <label>X</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0"
                                            max="1"
                                            className="form-control form-control-sm"
                                            value={selectedField.x}
                                            onChange={event =>
                                                updateField(selectedId, {
                                                    x: clamp(
                                                        Number(event.target.value),
                                                        0,
                                                        1 - selectedField.width
                                                    )
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="col-6">
                                        <label>Y</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0"
                                            max="1"
                                            className="form-control form-control-sm"
                                            value={selectedField.y}
                                            onChange={event =>
                                                updateField(selectedId, {
                                                    y: clamp(
                                                        Number(event.target.value),
                                                        0,
                                                        1 - selectedField.height
                                                    )
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="col-6">
                                        <label>Width</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0.03"
                                            max="1"
                                            className="form-control form-control-sm"
                                            value={selectedField.width}
                                            onChange={event =>
                                                updateField(selectedId, {
                                                    width: clamp(
                                                        Number(event.target.value),
                                                        0.03,
                                                        1 - selectedField.x
                                                    )
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="col-6">
                                        <label>Height</label>
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0.025"
                                            max="1"
                                            className="form-control form-control-sm"
                                            value={selectedField.height}
                                            onChange={event =>
                                                updateField(selectedId, {
                                                    height: clamp(
                                                        Number(event.target.value),
                                                        0.025,
                                                        1 - selectedField.y
                                                    )
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                {selectedField.field_type === 'TEXT' && (
                                    <>
                                        <div className="property-section">
                                            <label>Font Family</label>
                                            <select
                                                className="form-select form-select-sm"
                                                value={selectedField.font_family}
                                                onChange={event =>
                                                    updateField(selectedId, {
                                                        font_family: event.target.value
                                                    })
                                                }
                                            >
                                                <option>Arial</option>
                                                <option>Verdana</option>
                                                <option>Tahoma</option>
                                                <option>Georgia</option>
                                                <option>Times New Roman</option>
                                                <option>Courier New</option>
                                            </select>
                                        </div>

                                        <div className="row g-2">
                                            <div className="col-6">
                                                <label>Font Size</label>
                                                <input
                                                    type="number"
                                                    min="6"
                                                    max="200"
                                                    className="form-control form-control-sm"
                                                    value={selectedField.font_size}
                                                    onChange={event =>
                                                        updateField(selectedId, {
                                                            font_size: Number(event.target.value)
                                                        })
                                                    }
                                                />
                                            </div>

                                            <div className="col-6">
                                                <label>Color</label>
                                                <input
                                                    type="color"
                                                    className="form-control form-control-sm form-control-color w-100"
                                                    value={selectedField.color}
                                                    onChange={event =>
                                                        updateField(selectedId, {
                                                            color: event.target.value
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="property-section">
                                            <label>Alignment</label>
                                            <div className="btn-group w-100">
                                                {['left', 'center', 'right'].map(value => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        className={`btn btn-sm ${selectedField.text_align === value ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                        onClick={() =>
                                                            updateField(selectedId, {
                                                                text_align: value
                                                            })
                                                        }
                                                    >
                                                        {value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedField.font_weight === 'bold'}
                                                onChange={event =>
                                                    updateField(selectedId, {
                                                        font_weight: event.target.checked
                                                            ? 'bold'
                                                            : 'normal'
                                                    })
                                                }
                                                id="fieldBold"
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor="fieldBold"
                                            >
                                                Bold
                                            </label>
                                        </div>
                                    </>
                                )}

                                {selectedField.field_type === 'PHOTO' && (
                                    <div className="property-section">
                                        <label>Photo Fit</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={selectedField.fit_mode}
                                            onChange={event =>
                                                updateField(selectedId, {
                                                    fit_mode: event.target.value
                                                })
                                            }
                                        >
                                            <option value="cover">Cover</option>
                                            <option value="contain">Contain</option>
                                            <option value="fill">Fill</option>
                                        </select>
                                    </div>
                                )}

                                <div className="property-section">
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={Boolean(selectedField.is_required)}
                                            onChange={event =>
                                                updateField(selectedId, {
                                                    is_required: event.target.checked
                                                })
                                            }
                                            id="fieldRequired"
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor="fieldRequired"
                                        >
                                            Required field
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm w-100 mt-3"
                                    onClick={removeSelectedField}
                                >
                                    <FaTrash className="me-1" />
                                    Remove Field
                                </button>

                                <div className="keyboard-help">
                                    <strong>Keyboard</strong>
                                    <br />
                                    Arrow keys: move
                                    <br />
                                    Shift + Arrow: faster move
                                    <br />
                                    Delete: remove
                                </div>
                            </>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default TemplateFieldEditor;
