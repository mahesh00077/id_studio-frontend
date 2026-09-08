import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// Material-UI Icons
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import PhotoIcon from '@mui/icons-material/Photo';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import UndoIcon from '@mui/icons-material/Undo';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import CircleIcon from '@mui/icons-material/Circle';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import AlignVerticalTopIcon from '@mui/icons-material/AlignVerticalTop';
import AlignVerticalCenterIcon from '@mui/icons-material/AlignVerticalCenter';
import AlignVerticalBottomIcon from '@mui/icons-material/AlignVerticalBottom';
import LayersIcon from '@mui/icons-material/Layers';
import CropIcon from '@mui/icons-material/Crop';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';

// ===== CUSTOM FIELDS =====
const CUSTOM_FIELDS = [
    { id: 'studentName', label: 'Student Name', type: 'text', required: true },
    { id: 'fatherName', label: "Father's Name", type: 'text', required: true },
    { id: 'class', label: 'Class', type: 'text', required: true },
    { id: 'section', label: 'Section', type: 'text', required: false },
    { id: 'rollNumber', label: 'Roll No', type: 'text', required: true },
    { id: 'phone', label: 'Phone', type: 'text', required: false },
    { id: 'address', label: 'Address', type: 'textarea', required: false },
    { id: 'dob', label: 'Date of Birth', type: 'date', required: false },
    { id: 'admissionNumber', label: 'Admission No.', type: 'text', required: true },
];

function IDCardEditor({ 
    selectedDesign, 
    designFields, 
    formData, 
    setFormData,
    processedPhoto,
    credits,
    onGenerate,
    onPreview
}) {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
    const [zoom, setZoom] = useState(1);
    const [selectedObject, setSelectedObject] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [objectPositions, setObjectPositions] = useState({});
    const [objectSizes, setObjectSizes] = useState({});
    const [objectFontSizes, setObjectFontSizes] = useState({});
    const [objectRotations, setObjectRotations] = useState({});
    const [fieldFontWeights, setFieldFontWeights] = useState({});
    const [fieldColors, setFieldColors] = useState({});
    const [isCirclePhoto, setIsCirclePhoto] = useState(true);
    const [photoPosition, setPhotoPosition] = useState({ x: 20, y: 15 });
    const [photoSize, setPhotoSize] = useState(120);
    const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
    const [photoRotation, setPhotoRotation] = useState(0);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [showLayers, setShowLayers] = useState(false);
    const [hiddenLayers, setHiddenLayers] = useState({});
    const [layerOrder, setLayerOrder] = useState([]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [selectedFieldColor, setSelectedFieldColor] = useState('#1a202c');
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Initialize positions when design fields change
    useEffect(() => {
        if (designFields && designFields.length > 0) {
            const positions = {};
            const sizes = {};
            const fontSizes = {};
            const rotations = {};
            const weights = {};
            const colors = {};
            
            designFields.forEach((field, index) => {
                const defaultPos = field.position || { x: 20, y: 30 + index * 12 };
                positions[field.id] = { x: defaultPos.x || 20, y: defaultPos.y || 30 + index * 12 };
                sizes[field.id] = { width: 180, height: 28 };
                fontSizes[field.id] = 14;
                rotations[field.id] = 0;
                weights[field.id] = 'normal';
                colors[field.id] = '#1a202c';
            });
            
            setObjectPositions(positions);
            setObjectSizes(sizes);
            setObjectFontSizes(fontSizes);
            setObjectRotations(rotations);
            setFieldFontWeights(weights);
            setFieldColors(colors);
            
            // Set layer order
            setLayerOrder([...designFields.map(f => f.id), 'photo']);
        }
    }, [designFields]);

    // Initialize photo position
    useEffect(() => {
        setPhotoPosition({ x: 20, y: 15 });
        setPhotoSize(120);
        setPhotoRotation(0);
    }, [selectedDesign]);

    // Save history on changes
    const saveHistory = useCallback(() => {
        const state = {
            positions: { ...objectPositions },
            sizes: { ...objectSizes },
            fontSizes: { ...objectFontSizes },
            rotations: { ...objectRotations },
            photoPosition: { ...photoPosition },
            photoSize: photoSize,
            photoRotation: photoRotation,
            isCirclePhoto: isCirclePhoto
        };
        
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(state);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [objectPositions, objectSizes, objectFontSizes, objectRotations, photoPosition, photoSize, photoRotation, isCirclePhoto, historyIndex]);

    // Undo
    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            const prevState = history[historyIndex - 1];
            if (prevState) {
                setObjectPositions(prevState.positions);
                setObjectSizes(prevState.sizes);
                setObjectFontSizes(prevState.fontSizes);
                setObjectRotations(prevState.rotations);
                setPhotoPosition(prevState.photoPosition);
                setPhotoSize(prevState.photoSize);
                setPhotoRotation(prevState.photoRotation);
                setIsCirclePhoto(prevState.isCirclePhoto);
                drawCanvas();
            }
        }
    };

    // Redo
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            const nextState = history[historyIndex + 1];
            if (nextState) {
                setObjectPositions(nextState.positions);
                setObjectSizes(nextState.sizes);
                setObjectFontSizes(nextState.fontSizes);
                setObjectRotations(nextState.rotations);
                setPhotoPosition(nextState.photoPosition);
                setPhotoSize(nextState.photoSize);
                setPhotoRotation(nextState.photoRotation);
                setIsCirclePhoto(nextState.isCirclePhoto);
                drawCanvas();
            }
        }
    };

    // Draw canvas
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const { width, height } = canvasSize;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw design background
        if (selectedDesign?.front_template) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height);
                drawObjects(ctx, width, height);
            };
            img.src = selectedDesign.front_template;
        } else {
            // Draw fallback background
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = '#e2e8f0';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, width - 20, height - 20);
            
            ctx.fillStyle = '#94a3b8';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ID Card Design', width / 2, height / 2);
            
            drawObjects(ctx, width, height);
        }
    }, [selectedDesign, canvasSize, objectPositions, objectSizes, objectFontSizes, objectRotations, fieldFontWeights, fieldColors, formData, processedPhoto, photoPosition, photoSize, isCirclePhoto, photoRotation]);

    // Draw all objects on canvas
    const drawObjects = (ctx, width, height) => {
        // Draw fields
        const sortedFields = [...designFields];
        sortedFields.sort((a, b) => {
            const orderA = layerOrder.indexOf(a.id);
            const orderB = layerOrder.indexOf(b.id);
            return orderA - orderB;
        });
        
        sortedFields.forEach(field => {
            if (hiddenLayers[field.id]) return;
            
            const pos = objectPositions[field.id] || { x: 20, y: 20 };
            const size = objectSizes[field.id] || { width: 180, height: 28 };
            const fontSize = objectFontSizes[field.id] || 14;
            const rotation = objectRotations[field.id] || 0;
            const fontWeight = fieldFontWeights[field.id] || 'normal';
            const color = fieldColors[field.id] || '#1a202c';
            const value = formData[field.id] || '';
            
            const x = (pos.x / 100) * width;
            const y = (pos.y / 100) * height;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation * Math.PI / 180);
            
            ctx.font = `${fontWeight} ${fontSize}px Arial`;
            ctx.fillStyle = color;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(value || '______', 0, 0);
            
            // Draw selection border if selected
            if (selectedObject === field.id) {
                ctx.strokeStyle = '#4f46e5';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                const metrics = ctx.measureText(value || '______');
                const textWidth = metrics.width || 80;
                ctx.strokeRect(-4, -4, textWidth + 8, fontSize + 8);
                ctx.setLineDash([]);
            }
            
            ctx.restore();
        });
        
        // Draw photo
        if (processedPhoto && !hiddenLayers['photo']) {
            const px = (photoPosition.x / 100) * width;
            const py = (photoPosition.y / 100) * height;
            const size = photoSize;
            
            ctx.save();
            ctx.translate(px + size / 2, py + size / 2);
            ctx.rotate(photoRotation * Math.PI / 180);
            
            const img = new Image();
            img.onload = () => {
                if (isCirclePhoto) {
                    ctx.beginPath();
                    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
                
                if (isCirclePhoto) {
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-size / 2, -size / 2, size, size);
                }
            };
            img.src = processedPhoto;
            
            // Draw selection border if photo selected
            if (selectedObject === 'photo') {
                ctx.strokeStyle = '#4f46e5';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(-size / 2 - 4, -size / 2 - 4, size + 8, size + 8);
                ctx.setLineDash([]);
            }
            
            ctx.restore();
        }
    };

    // Handle object selection
    const handleCanvasClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        
        // Check if clicked on any object
        let clicked = null;
        const width = canvasSize.width;
        const height = canvasSize.height;
        
        // Check photo first
        if (processedPhoto) {
            const px = (photoPosition.x / 100) * width;
            const py = (photoPosition.y / 100) * height;
            const size = photoSize;
            if (x >= px && x <= px + size && y >= py && y <= py + size) {
                clicked = 'photo';
            }
        }
        
        // Check fields
        if (!clicked) {
            for (const field of designFields) {
                const pos = objectPositions[field.id] || { x: 20, y: 20 };
                const size = objectSizes[field.id] || { width: 180, height: 28 };
                const fx = (pos.x / 100) * width;
                const fy = (pos.y / 100) * height;
                if (x >= fx && x <= fx + size.width && y >= fy && y <= fy + size.height) {
                    clicked = field.id;
                    break;
                }
            }
        }
        
        setSelectedObject(clicked);
    };

    // Handle keyboard events
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedObject) return;
            
            const step = e.shiftKey ? 10 : 2;
            const width = canvasSize.width;
            const height = canvasSize.height;
            
            if (selectedObject === 'photo') {
                let newX = photoPosition.x;
                let newY = photoPosition.y;
                switch(e.key) {
                    case 'ArrowUp': newY = Math.max(0, photoPosition.y - step); e.preventDefault(); break;
                    case 'ArrowDown': newY = Math.min(80, photoPosition.y + step); e.preventDefault(); break;
                    case 'ArrowLeft': newX = Math.max(0, photoPosition.x - step); e.preventDefault(); break;
                    case 'ArrowRight': newX = Math.min(80, photoPosition.x + step); e.preventDefault(); break;
                    default: return;
                }
                setPhotoPosition({ x: newX, y: newY });
                saveHistory();
                return;
            }
            
            const pos = objectPositions[selectedObject] || { x: 20, y: 20 };
            let newX = pos.x;
            let newY = pos.y;
            
            switch(e.key) {
                case 'ArrowUp': newY = Math.max(0, pos.y - step); e.preventDefault(); break;
                case 'ArrowDown': newY = Math.min(90, pos.y + step); e.preventDefault(); break;
                case 'ArrowLeft': newX = Math.max(0, pos.x - step); e.preventDefault(); break;
                case 'ArrowRight': newX = Math.min(90, pos.x + step); e.preventDefault(); break;
                default: return;
            }
            
            setObjectPositions(prev => ({
                ...prev,
                [selectedObject]: { x: newX, y: newY }
            }));
            saveHistory();
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedObject, objectPositions, photoPosition, canvasSize, saveHistory]);

    // Handle mouse drag on canvas
    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        
        if (selectedObject) {
            setIsDragging(true);
            setDragStart({ x, y });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !selectedObject) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        const dx = x - dragStart.x;
        const dy = y - dragStart.y;
        const width = canvasSize.width;
        const height = canvasSize.height;
        
        if (selectedObject === 'photo') {
            const newX = Math.max(0, Math.min(80, photoPosition.x + (dx / width) * 100));
            const newY = Math.max(0, Math.min(80, photoPosition.y + (dy / height) * 100));
            setPhotoPosition({ x: newX, y: newY });
        } else {
            const pos = objectPositions[selectedObject] || { x: 20, y: 20 };
            const newX = Math.max(0, Math.min(90, pos.x + (dx / width) * 100));
            const newY = Math.max(0, Math.min(90, pos.y + (dy / height) * 100));
            setObjectPositions(prev => ({
                ...prev,
                [selectedObject]: { x: newX, y: newY }
            }));
        }
        
        setDragStart({ x, y });
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            saveHistory();
        }
    };

    // Zoom controls
    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleFitScreen = () => {
        const container = containerRef.current;
        if (container) {
            const containerWidth = container.clientWidth - 40;
            const containerHeight = container.clientHeight - 40;
            const fitZoom = Math.min(containerWidth / canvasSize.width, containerHeight / canvasSize.height);
            setZoom(Math.min(fitZoom, 1));
        }
    };
    const handleResetZoom = () => setZoom(1);

    // Delete selected object
    const handleDeleteSelected = () => {
        if (selectedObject && selectedObject !== 'photo') {
            setHiddenLayers(prev => ({ ...prev, [selectedObject]: true }));
            setSelectedObject(null);
            saveHistory();
            toast.success('Field hidden');
        } else if (selectedObject === 'photo') {
            toast.info('Photo cannot be deleted, use remove button');
        }
    };

    // Toggle layer visibility
    const toggleLayer = (layerId) => {
        setHiddenLayers(prev => ({
            ...prev,
            [layerId]: !prev[layerId]
        }));
        saveHistory();
    };

    // Bring forward
    const bringForward = () => {
        if (!selectedObject || selectedObject === 'photo') return;
        const index = layerOrder.indexOf(selectedObject);
        if (index < layerOrder.length - 1) {
            const newOrder = [...layerOrder];
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
            setLayerOrder(newOrder);
            saveHistory();
        }
    };

    // Send backward
    const sendBackward = () => {
        if (!selectedObject || selectedObject === 'photo') return;
        const index = layerOrder.indexOf(selectedObject);
        if (index > 0) {
            const newOrder = [...layerOrder];
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
            setLayerOrder(newOrder);
            saveHistory();
        }
    };

    // Font controls
    const handleFontSizeChange = (fieldId, delta) => {
        setObjectFontSizes(prev => ({
            ...prev,
            [fieldId]: Math.max(8, Math.min(24, (prev[fieldId] || 14) + delta))
        }));
        saveHistory();
    };

    const handleFontWeightToggle = (fieldId) => {
        setFieldFontWeights(prev => ({
            ...prev,
            [fieldId]: prev[fieldId] === 'bold' ? 'normal' : 'bold'
        }));
        saveHistory();
    };

    const handleColorChange = (fieldId, color) => {
        setFieldColors(prev => ({
            ...prev,
            [fieldId]: color
        }));
        setSelectedFieldColor(color);
        setShowColorPicker(false);
        saveHistory();
    };

    // Photo controls
    const handlePhotoResize = (delta) => {
        setPhotoSize(prev => Math.max(60, Math.min(200, prev + delta)));
        saveHistory();
    };

    const handlePhotoRotate = (degrees) => {
        setPhotoRotation(prev => (prev + degrees) % 360);
        saveHistory();
    };

    const handlePhotoShapeToggle = () => {
        setIsCirclePhoto(prev => !prev);
        saveHistory();
    };

    // Redraw canvas when anything changes
    useEffect(() => {
        drawCanvas();
    }, [drawCanvas, objectPositions, objectSizes, objectFontSizes, objectRotations, fieldFontWeights, fieldColors, formData, processedPhoto, photoPosition, photoSize, isCirclePhoto, photoRotation, selectedObject, zoom]);

    return (
        <div className="id-card-editor">
            {/* Toolbar */}
            <div className="editor-toolbar">
                <div className="toolbar-group">
                    <button className="toolbar-btn" onClick={handleUndo} title="Undo" disabled={historyIndex <= 0}>
                        ↩️
                    </button>
                    <button className="toolbar-btn" onClick={handleRedo} title="Redo" disabled={historyIndex >= history.length - 1}>
                        ↪️
                    </button>
                </div>
                
                <div className="toolbar-group">
                    <button className="toolbar-btn" onClick={handleZoomIn} title="Zoom In">
                        <ZoomInIcon style={{ fontSize: '18px' }} />
                    </button>
                    <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                    <button className="toolbar-btn" onClick={handleZoomOut} title="Zoom Out">
                        <ZoomOutIcon style={{ fontSize: '18px' }} />
                    </button>
                    <button className="toolbar-btn" onClick={handleFitScreen} title="Fit Screen">
                        <FitScreenIcon style={{ fontSize: '18px' }} />
                    </button>
                    <button className="toolbar-btn" onClick={handleResetZoom} title="Reset Zoom">
                        <RefreshIcon style={{ fontSize: '18px' }} />
                    </button>
                </div>
                
                {selectedObject && selectedObject !== 'photo' && (
                    <div className="toolbar-group">
                        <button className="toolbar-btn" onClick={() => handleFontSizeChange(selectedObject, -2)} title="Decrease Font Size">
                            A-
                        </button>
                        <button className="toolbar-btn" onClick={() => handleFontSizeChange(selectedObject, 2)} title="Increase Font Size">
                            A+
                        </button>
                        <button className="toolbar-btn" onClick={() => handleFontWeightToggle(selectedObject)} title="Toggle Bold">
                            <strong>B</strong>
                        </button>
                        <button className="toolbar-btn" onClick={() => setShowColorPicker(!showColorPicker)} title="Color Picker">
                            🎨
                        </button>
                        {showColorPicker && (
                            <div className="color-picker-popup">
                                {['#1a202c', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4b5563', '#000000'].map(color => (
                                    <div
                                        key={color}
                                        onClick={() => handleColorChange(selectedObject, color)}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '4px',
                                            backgroundColor: color,
                                            cursor: 'pointer',
                                            border: '1px solid #e2e8f0'
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        <button className="toolbar-btn" onClick={bringForward} title="Bring Forward">
                            ⬆️
                        </button>
                        <button className="toolbar-btn" onClick={sendBackward} title="Send Backward">
                            ⬇️
                        </button>
                        <button className="toolbar-btn toolbar-btn-danger" onClick={handleDeleteSelected} title="Delete/Hide">
                            <DeleteIcon style={{ fontSize: '18px' }} />
                        </button>
                    </div>
                )}
                
                {selectedObject === 'photo' && (
                    <div className="toolbar-group">
                        <button className="toolbar-btn" onClick={() => handlePhotoResize(-10)} title="Decrease Size">
                            <RemoveIcon style={{ fontSize: '18px' }} />
                        </button>
                        <span className="photo-size">{photoSize}px</span>
                        <button className="toolbar-btn" onClick={() => handlePhotoResize(10)} title="Increase Size">
                            <AddIcon style={{ fontSize: '18px' }} />
                        </button>
                        <button className="toolbar-btn" onClick={() => handlePhotoRotate(-90)} title="Rotate Left">
                            <RotateLeftIcon style={{ fontSize: '18px' }} />
                        </button>
                        <button className="toolbar-btn" onClick={() => handlePhotoRotate(90)} title="Rotate Right">
                            <RotateRightIcon style={{ fontSize: '18px' }} />
                        </button>
                        <button className="toolbar-btn" onClick={handlePhotoShapeToggle} title="Toggle Shape">
                            {isCirclePhoto ? <CircleIcon style={{ fontSize: '18px' }} /> : <PanoramaFishEyeIcon style={{ fontSize: '18px' }} />}
                        </button>
                    </div>
                )}
                
                <div className="toolbar-group ml-auto">
                    <button className="toolbar-btn" onClick={() => setShowLayers(!showLayers)} title="Layers">
                        <LayersIcon style={{ fontSize: '18px' }} />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="editor-canvas-wrapper" ref={containerRef}>
                <div className="editor-canvas-container">
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center center',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            cursor: selectedObject ? 'move' : 'default'
                        }}
                        onClick={handleCanvasClick}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                </div>
            </div>

            {/* Layers Panel */}
            {showLayers && (
                <div className="layers-panel">
                    <div className="layers-header">
                        <h6>Layers</h6>
                        <button className="btn-close" onClick={() => setShowLayers(false)}></button>
                    </div>
                    <div className="layers-list">
                        <div className="layer-item layer-background">
                            <span>🔒 Background</span>
                        </div>
                        {designFields.map(field => (
                            <div
                                key={field.id}
                                className={`layer-item ${selectedObject === field.id ? 'active' : ''} ${hiddenLayers[field.id] ? 'hidden' : ''}`}
                                onClick={() => setSelectedObject(field.id)}
                            >
                                <span>{field.label}</span>
                                <button
                                    className="layer-visibility"
                                    onClick={(e) => { e.stopPropagation(); toggleLayer(field.id); }}
                                >
                                    {hiddenLayers[field.id] ? '👁️‍🗨️' : '👁️'}
                                </button>
                            </div>
                        ))}
                        {processedPhoto && (
                            <div
                                className={`layer-item ${selectedObject === 'photo' ? 'active' : ''} ${hiddenLayers['photo'] ? 'hidden' : ''}`}
                                onClick={() => setSelectedObject('photo')}
                            >
                                <span>📷 Photo</span>
                                <button
                                    className="layer-visibility"
                                    onClick={(e) => { e.stopPropagation(); toggleLayer('photo'); }}
                                >
                                    {hiddenLayers['photo'] ? '👁️‍🗨️' : '👁️'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Alignment Tools */}
            {selectedObject && selectedObject !== 'photo' && (
                <div className="alignment-tools">
                    <button className="align-btn" onClick={() => {
                        const pos = objectPositions[selectedObject] || { x: 20, y: 20 };
                        setObjectPositions(prev => ({
                            ...prev,
                            [selectedObject]: { x: 0, y: pos.y }
                        }));
                        saveHistory();
                    }} title="Align Left">
                        <AlignHorizontalLeftIcon style={{ fontSize: '16px' }} />
                    </button>
                    <button className="align-btn" onClick={() => {
                        const pos = objectPositions[selectedObject] || { x: 20, y: 20 };
                        setObjectPositions(prev => ({
                            ...prev,
                            [selectedObject]: { x: 45, y: pos.y }
                        }));
                        saveHistory();
                    }} title="Align Center">
                        <AlignHorizontalCenterIcon style={{ fontSize: '16px' }} />
                    </button>
                    <button className="align-btn" onClick={() => {
                        const pos = objectPositions[selectedObject] || { x: 20, y: 20 };
                        setObjectPositions(prev => ({
                            ...prev,
                            [selectedObject]: { x: 90, y: pos.y }
                        }));
                        saveHistory();
                    }} title="Align Right">
                        <AlignHorizontalRightIcon style={{ fontSize: '16px' }} />
                    </button>
                    <button className="align-btn" onClick={() => {
                        const pos = objectPositions[selectedObject] || { x: 20, y: 20 };
                        setObjectPositions(prev => ({
                            ...prev,
                            [selectedObject]: { x: pos.x, y: 0 }
                        }));
                        saveHistory();
                    }} title="Align Top">
                        <AlignVerticalTopIcon style={{ fontSize: '16px' }} />
                    </button>
                    <button className="align-btn" onClick={() => {
                        const pos = objectPositions[selectedObject] || { x: 20, y: 20 };
                        setObjectPositions(prev => ({
                            ...prev,
                            [selectedObject]: { x: pos.x, y: 45 }
                        }));
                        saveHistory();
                    }} title="Align Middle">
                        <AlignVerticalCenterIcon style={{ fontSize: '16px' }} />
                    </button>
                    <button className="align-btn" onClick={() => {
                        const pos = objectPositions[selectedObject] || { x: 20, y: 20 };
                        setObjectPositions(prev => ({
                            ...prev,
                            [selectedObject]: { x: pos.x, y: 90 }
                        }));
                        saveHistory();
                    }} title="Align Bottom">
                        <AlignVerticalBottomIcon style={{ fontSize: '16px' }} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default IDCardEditor;
