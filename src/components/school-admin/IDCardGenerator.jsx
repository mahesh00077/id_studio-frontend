import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import toast from 'react-hot-toast';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import PhotoIcon from '@mui/icons-material/Photo';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import './IDCardGenerator.css';

const META = {
  studentName:{label:'Student Name',required:true,type:'TEXT'},
  fatherName:{label:"Father's Name",type:'TEXT'},
  class:{label:'Class',type:'TEXT'},
  section:{label:'Section',type:'TEXT'},
  rollNumber:{label:'Roll No',type:'TEXT'},
  phone:{label:'Mobile No',type:'TEXT'},
  address:{label:'Address',type:'TEXT'},
  admissionNumber:{label:'Admission No',type:'TEXT'},
  dob:{label:'Date of Birth',type:'TEXT'},
  photo:{label:'Student Photo',required:true,type:'PHOTO'}
};

const STEPS = ['Design','Student Data','Photo','Preview'];

// Friendly display labels for known field keys. Used when the Owner config
// does not carry a `label` column (id_design_fields has none), so School
// Admin/Staff never see raw or numbered keys (e.g. trailing "0"/"O").
const LABEL_ALIASES = {
  studentName: 'Student Name',
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  className: 'Class',
  'class': 'Class',
  section: 'Section',
  rollNumber: 'Roll No',
  admissionNumber: 'Admission No',
  admissionNo: 'Admission No',
  dateOfBirth: 'Date of Birth',
  dob: 'Date of Birth',
  phone: 'Mobile No',
  mobile: 'Mobile No',
  address: 'Address'
};

function cleanLabel(key) {
  const k = String(key || '').replace(/[\d/]+$/, '').trim();
  if (!k) return String(key || '');
  if (LABEL_ALIASES[k]) return LABEL_ALIASES[k];
  return k.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Normalize any field row (Owner config) into a complete ID-card object.
// This object is the SINGLE SOURCE OF TRUTH for every renderer.
function norm(f) {
  const key = f.field_key || f.field || f.id;
  return {
    ...f,
    id: f.id || `local-${key}`,
    field_key: key,
    field_type: f.field_type || META[key]?.type || 'TEXT',
    label: cleanLabel(f.label || META[key]?.label || key),
    is_required: f.is_required ?? f.required ?? META[key]?.required ?? false,
    x: Number(f.x ?? 0.1),
    y: Number(f.y ?? 0.5),
    width: Number(f.width ?? 0.5),
    height: Number(f.height ?? 0.055),
    font_size: Number(f.font_size ?? 24),
    font_family: f.font_family || 'Arial',
    font_weight: f.font_weight || 'normal',
    font_style: f.font_style || 'normal',
    text_align: f.text_align || 'left',
    color: f.color || '#000000',
    line_height: Number(f.line_height ?? 1.2),
    max_lines: Number(f.max_lines ?? 1),
    fit_mode: f.fit_mode || 'cover'
  };
}

const clamp = (v, a, b) => Math.min(Math.max(Number(v) || 0, a), b);
const imageUrl = (u) => !u ? '' : (u.startsWith('http') || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('/') ? u : `/${u}`);

function IDCardGenerator({ demo = false, initialDesignId = null }) {
  // School Staff use the `/school-staff/*` API scope (same backend
  // controllers), School Admin and Owner use `/school-admin/*`.
  // DEMO mode (Owner /designs page) always uses the `/owner/*` scope and
  // stops at the preview step — no credits, students or cards are touched.
  const { userRole } = useAuth();
  const { branding } = useBranding();
  // Watermark brand: Owner-configured company name, else the platform default.
  const brandName = (branding?.company_name || '').trim() || 'BSR Printing Solutions';
  const scope = demo ? 'owner' : (userRole === 'SCHOOL_STAFF' ? 'school-staff' : 'school-admin');

  const [step, setStep] = useState(1);
  const [designs, setDesigns] = useState([]);
  const [design, setDesign] = useState(null);
  const [fields, setFields] = useState([]);        // ordered Owner-config FRONT fields
  const [backFields, setBackFields] = useState([]);   // Owner-config BACK fields (if any)
  const [objects, setObjects] = useState({});      // SINGLE SOURCE OF TRUTH: id -> object state
  const [data, setData] = useState({});
  const [photo, setPhoto] = useState(null);
  const [processed, setProcessed] = useState(null);
  const [photoChoice, setPhotoChoice] = useState('original');
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(false);
  const [pointerMode, setPointerMode] = useState('move'); // 'move' | 'drag'
  const [rotation, setRotation] = useState(0);
  // Session-only photo framing: focal point (0..1) + zoom scale used to crop /
  // pan the uploaded photo inside its fixed box. Not persisted (same as rotate).
  const [photoCrop, setPhotoCrop] = useState({ x: 0.5, y: 0.5, scale: 1 });
  const [preview, setPreview] = useState(null);    // output of the ONE common renderer (front)
  const [backPreview, setBackPreview] = useState(null);  // back-side renderer output
  const [previewSide, setPreviewSide] = useState('front');  // 'front' | 'back'
  const [full, setFull] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [templateSize, setTemplateSize] = useState(null);

  const inputRef = useRef(null);
  const drag = useRef(null);
  const renderTimer = useRef(null);
  const saveTimer = useRef(null);
  const objectsDirty = useRef(false);   // true once a field attr/position changes
  const imgCache = useRef({});

  useEffect(() => { loadDesigns(); if (!demo) loadCredits(); }, []);

  async function loadDesigns() {
    try {
      const r = await api.get(`/${scope}/designs`);
      const list = Array.isArray(r.data) ? r.data : r.data?.designs || [];
      setDesigns(list);
      // Demo preselect: jump straight into the requested design's flow.
      if (initialDesignId) {
        const pre = list.find(x => String(x.id) === String(initialDesignId));
        if (pre) {
          setDesign(pre);
          if (await loadFields(pre)) setStep(2);
        }
      }
    } catch (e) { toast.error('Failed to fetch designs'); }
  }

  async function loadCredits() {
    try {
      const r = await api.get(`/${scope}/credits/balance`);
      setCredits(Number(r.data?.balance || 0));
    } catch (e) { /* ignore */ }
  }

  function choose(e) {
    const d = designs.find(x => String(x.id) === String(e.target.value)) || null;
    setDesign(d);
    setFields([]);
    setBackFields([]);
    setObjects({});
    setData({});
    setProcessed(null);
    setPhoto(null);
    setPhotoChoice('original');
    setPhotoCrop({ x: 0.5, y: 0.5, scale: 1 });
    setPreview(null);
    setSelected(null);
    setStep(1);
  }

  async function loadFields(target = design) {
    if (!target) return false;
    setLoading(true);
    try {
      const [fr, br] = await Promise.all([
        api.get(`/${scope}/designs/${target.id}/fields`, { params: { side: 'FRONT' } }),
        api.get(`/${scope}/designs/${target.id}/fields`, { params: { side: 'BACK' } }),
      ]);
      let fs = (fr.data?.fields || fr.data || []).map(norm);
      if (!fs.some(f => f.field_key === 'studentName')) {
        fs = [norm({ id: 'default-studentName', field_key: 'studentName', label: 'Student Name', field_type: 'TEXT', required: true, x: .1, y: .5, width: .55, height: .055, source: 'DEFAULT' }), ...fs];
      }
      setFields(fs);
      const bs = (br.data?.fields || br.data || []).map(norm);
      setBackFields(bs);
      const obj = {};
      const d = {};
      fs.forEach(f => { obj[f.id] = f; d[f.field_key] = ''; });
      bs.forEach(f => { obj[f.id] = f; d[f.field_key] = ''; });
      setObjects(obj);
      setData(d);
      const total = fs.length + bs.length;
      toast.success(`${total} template field${total === 1 ? '' : 's'} loaded`);
      return true;
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Template fields API not connected');
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function continueDesign() {
    if (!design) return toast.error('Select a design');
    if (await loadFields()) setStep(2);
  }

  function valid() {
    const missing = fields.filter(f => f.field_type !== 'PHOTO' && f.is_required && !String(data[f.field_key] || '').trim());
    if (missing.length) {
      toast.error(`Fill: ${missing.map(f => f.label).join(', ')}`);
      return false;
    }
    return true;
  }

  function change(e) { setData(p => ({ ...p, [e.target.name]: e.target.value })); }

  // ---- drag / resize / arrows all edit the SAME `objects` map ----
  function dragStart(e, f) {
    e.preventDefault();
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    const o = objects[f.id] || f;
    const isPhoto = o.field_type === 'PHOTO' || o.field_key === 'photo';
    drag.current = {
      id: f.id, sx: e.clientX, sy: e.clientY,
      cw: rect.width, ch: rect.height, x: o.x, y: o.y,
      photo: isPhoto,
      cropX: photoCrop?.x ?? 0.5, cropY: photoCrop?.y ?? 0.5
    };
    setSelected(f.id);
    window.addEventListener('pointermove', dragMove);
    window.addEventListener('pointerup', dragStop);
  }

  function dragMove(e) {
    const d = drag.current;
    if (!d) return;
    // In drag mode, dragging a PHOTO pans the visible crop region instead of
    // moving the field box (the box position/size stay fixed at the configured
    // width/height).
    if (pointerMode === 'drag' && d.photo) {
      const dx = (e.clientX - d.sx) / d.cw;
      const dy = (e.clientY - d.sy) / d.ch;
      setPhotoCrop(p => ({
        ...p,
        x: clamp((d.cropX ?? 0.5) - dx, 0, 1),
        y: clamp((d.cropY ?? 0.5) - dy, 0, 1)
      }));
      return;
    }
    const o = objects[d.id] || fields.find(x => x.id === d.id) || {};
    upd(d.id, {
      x: clamp(d.x + (e.clientX - d.sx) / d.cw, 0, 1 - (o.width || 0.5)),
      y: clamp(d.y + (e.clientY - d.sy) / d.ch, 0, 1 - (o.height || 0.05))
    });
  }

  function dragStop() {
    drag.current = null;
    window.removeEventListener('pointermove', dragMove);
    window.removeEventListener('pointerup', dragStop);
  }

  // Canvas-level hit-test: the authoritative selection path. Clicking any spot
  // on the card selects the top-most field whose box contains it (or clears the
  // selection on empty space). This makes fields reliably selectable.
  function handleCanvasSelect(e) {
    const list = previewSide === 'back' ? backFields : fields;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    for (let i = list.length - 1; i >= 0; i--) {
      const f = list[i];
      const o = objects[f.id] || f;
      if (x >= o.x && x <= o.x + o.width && y >= o.y && y <= o.y + o.height) {
        setSelected(f.id);
        return;
      }
    }
    setSelected(null);
  }

  function resize(dw, dh = dw) {
    if (!selected) return;
    objectsDirty.current = true;
    setObjects(p => {
      const o = p[selected] || {};
      return { ...p, [selected]: { ...o, width: clamp((o.width || 0.5) + dw, 0.03, 1 - (o.x || 0)), height: clamp((o.height || 0.05) + dh, 0.025, 1 - (o.y || 0)) } };
    });
  }

  function move(dx, dy) {
    if (!selected) return;
    objectsDirty.current = true;
    setObjects(p => {
      const o = p[selected] || {};
      return { ...p, [selected]: { ...o, x: clamp((o.x || 0) + dx, 0, 1 - (o.width || 0.5)), y: clamp((o.y || 0) + dy, 0, 1 - (o.height || 0.05)) } };
    });
  }

  useEffect(() => {
    const h = e => {
      if (step !== 4 || !selected) return;
      const n = e.shiftKey ? 0.01 : 0.002;
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-n, 0); }
      if (e.key === 'ArrowRight') { e.preventDefault(); move(n, 0); }
      if (e.key === 'ArrowUp') { e.preventDefault(); move(0, -n); }
      if (e.key === 'ArrowDown') { e.preventDefault(); move(0, n); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [step, selected, objects, fields]);

  // ---- cached image loader (avoids re-fetching on every render) ----
  async function getImage(url) {
    if (imgCache.current[url]) return imgCache.current[url];
    const im = new Image();
    im.crossOrigin = 'anonymous';
    await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = url; });
    imgCache.current[url] = im;
    return im;
  }

  // ---- simple line wrapper ----
  function wrap(ctx, text, max, lines) {
    const words = String(text).split(/\s+/);
    const out = [];
    let cur = '';
    // Push a completed line; if it exceeds the line budget, stop early.
    const push = (s) => {
      if (!s) return 0;
      out.push(s);
      return out.length;
    };
    for (const w of words) {
      // If a single word is wider than the box, hard-break it by characters.
      let piece = w;
      while (piece && ctx.measureText(piece).width > max) {
        // split off as many chars as fit into the current line
        let lo = 1, hi = piece.length, keep = 1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          const head = cur ? `${cur} ${piece.slice(0, mid)}` : piece.slice(0, mid);
          if (ctx.measureText(head).width <= max) { keep = mid; lo = mid + 1; }
          else hi = mid - 1;
        }
        const head = piece.slice(0, keep);
        if (cur) {
          if (push(`${cur} ${head}`) >= lines) return out;
          cur = '';
        } else if (push(head) >= lines) {
          return out;
        }
        piece = piece.slice(keep);
      }
      if (!piece) continue;
      const t = cur ? `${cur} ${piece}` : piece;
      if (ctx.measureText(t).width <= max) cur = t;
      else {
        if (push(cur) >= lines) return out;
        cur = piece;
      }
    }
    if (cur && out.length < lines) out.push(cur);
    return out;
  }

  function upload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Select an image');
    if (f.size > 5 * 1024 * 1024) return toast.error('Photo must be below 5MB');
    const r = new FileReader();
    r.onload = x => { setPhoto(x.target.result); setProcessed(null); setPhotoChoice('original'); setPreview(null); setPhotoCrop({ x: 0.5, y: 0.5, scale: 1 }); };
    r.readAsDataURL(f);
  }

  async function removeBg() {
    if (!photo) return toast.error('Upload photo first');
    setRemoving(true);
    setProgress(10);
    let ok = false;
    try {
      const blob = await fetch(photo).then(x => x.blob());
      const fd = new FormData();
      fd.append('file', blob, 'student-photo.png');
      setProgress(35);
      const r = await fetch(`${(import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')}/remove-background`, { method: 'POST', body: fd });
      setProgress(80);
      if (!r.ok) throw Error('Background removal failed');
      const j = await r.json();
      const v = j.processed_base64 || j.image || j.image_data || j.data || j.image_url;
      if (!v) throw Error('No processed image returned');
      setProcessed(v.startsWith('data:') || v.startsWith('http') || v.startsWith('/') ? imageUrl(v) : `data:image/png;base64,${v}`);
      setPhotoChoice('processed');
      setPreview(null);
      setProgress(100);
      toast.success('Background removed and white background applied');
      ok = true;
    } catch (e) {
      toast.error(e.message || 'Background removal failed');
    } finally {
      setTimeout(() => { setRemoving(false); setProgress(0); }, 300);
    }
    return ok;
  }

  function useOriginal() {
    if (!photo) return toast.error('Upload photo first');
    setPhotoChoice('original');
    setProcessed(null);
    setPreview(null);
    setPhotoCrop({ x: 0.5, y: 0.5, scale: 1 });
    setStep(4);
  }


  function removePhoto() {
    setPhoto(null);
    setProcessed(null);
    setPhotoChoice('original');
    setPhotoCrop({ x: 0.5, y: 0.5, scale: 1 });
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  // ---- single source of truth: update one object property ----
  function upd(id, patch) {
    objectsDirty.current = true;
    setObjects(p => ({ ...p, [id]: { ...(p[id] || {}), ...patch } }));
  }

  // Persist changed field attributes (position/size/fonts) to the DB via the
  // scope's bulk design-fields upsert (owner / school-admin / school-staff).
  // Available in every scope including DEMO mode (Owner /designs/demo): moving
  // fields/photo there and changing font size/color auto-saves to the DB.
  const canSaveFields = true;

  async function saveFieldsToDb(showToast = true) {
    if (!design) return;
    const toPayload = fs => fs
      .filter(f => f.source !== 'DEFAULT')            // skip locally-injected defaults
      .map(f => {
        const o = objects[f.id] || f;
        return {
          field_key: f.field_key,
          field_type: f.field_type,
          label: f.label,
          x: o.x, y: o.y, width: o.width, height: o.height,
          font_family: o.font_family, font_size: o.font_size,
          font_weight: o.font_weight, font_style: o.font_style,
          text_align: o.text_align, color: o.color,
          line_height: o.line_height, max_lines: o.max_lines,
          fit_mode: o.fit_mode,
          is_required: f.is_required,
          source: f.source || 'MANUAL',
          sort_order: f.sort_order ?? 0
        };
      });
    setLoading(true);
    try {
      const calls = [api.put(`/${scope}/designs/${design.id}/fields`, { side: 'FRONT', fields: toPayload(fields) })];
      if (backFields.length > 0) {
        calls.push(api.put(`/${scope}/designs/${design.id}/fields`, { side: 'BACK', fields: toPayload(backFields) }));
      }
      await Promise.all(calls);
      objectsDirty.current = false;
      if (showToast) toast.success('Field positions saved to design');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save field positions');
    } finally {
      setLoading(false);
    }
  }

  // Auto-save: after any position/attribute change, persist (debounced) so a
  // whole drag session becomes one request. Works in every scope including
  // Owner demo mode, so field moves / font-size changes there also persist.
  useEffect(() => {
    if (!canSaveFields || !design || !objectsDirty.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveFieldsToDb(false), 1200);
    return () => clearTimeout(saveTimer.current);
  }, [objects, canSaveFields, design]);

  // ============================================================
  // ONE COMMON RENDERER.
  // Renders the template, photo and every text object from the
  // `objects` state. Its output (`preview`) is used verbatim by:
  //   - the on-screen editor image
  //   - the Refresh Preview button
  //   - the Preview download
  //   - the final Generate (credits deducted only here)
  // ============================================================
  const renderCard = useCallback(async (side = 'front', skipWatermark = false) => {
    if (!design || !photo) return null;
    const photoSrc = photoChoice === 'processed' && processed ? processed : photo;
    setRendering(true);
    try {
      const isBack = side === 'back';
      const sideFields = isBack ? backFields : fields;
      const templateUrl = imageUrl(isBack ? (design.back_template || design.front_template) : design.front_template);
      let bg = null;
      if (templateUrl) {
        try { bg = await getImage(templateUrl); } catch (_) { /* keep white canvas */ }
      }
      const c = document.createElement('canvas');
      c.width = bg?.naturalWidth || 1080;
      c.height = bg?.naturalHeight || Math.round(c.width * 88 / 55);
      const ctx = c.getContext('2d');
      if (bg) ctx.drawImage(bg, 0, 0, c.width, c.height);
      else { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height); }
      if (bg) setTemplateSize({ w: bg.naturalWidth, h: bg.naturalHeight });

      const list = sideFields.map(f => objects[f.id] || f);

      // --- PHOTO object (respects Owner fit_mode + rotation + session crop) ---
      const pf = list.find(f => f.field_type === 'PHOTO' || f.field_key === 'photo');
      if (pf && photoSrc) {
        let im = null;
        try { im = await getImage(photoSrc); } catch (_) { /* skip photo */ }
        if (im) {
          const pw = pf.width * c.width;
          const ph = pf.height * c.height;
          ctx.save();
          ctx.translate((pf.x + pf.width / 2) * c.width, (pf.y + pf.height / 2) * c.height);
          ctx.rotate(((rotation % 360) * Math.PI) / 180);
          // Hard-clip to the box so NOTHING (including rotated corners) ever
          // paints outside the configured width/height.
          ctx.beginPath();
          ctx.rect(-pw / 2, -ph / 2, pw, ph);
          ctx.clip();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
          // Fit the COMPLETE uploaded photo inside the frame while preserving
          // its aspect ratio (no stretching/distortion, no unwanted crop or
          // zoom). The whole image is always drawn -- the frame simply acts as
          // a letterbox, leaving white padding on the extra side.
          const fit = pf.fit_mode || 'contain';
          const base = fit === 'fill'
            ? Math.max(pw / im.naturalWidth, ph / im.naturalHeight)
            : Math.min(pw / im.naturalWidth, ph / im.naturalHeight);
          const scale = base * (photoCrop?.scale || 1);
          const dw = im.naturalWidth * scale;
          const dh = im.naturalHeight * scale;
          const cx = photoCrop?.x ?? 0.5;
          const cy = photoCrop?.y ?? 0.5;
          // Place the image so its focal point sits at the box centre.
          const dx = -cx * dw;
          const dy = -cy * dh;
          ctx.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight, dx, dy, dw, dh);
          ctx.restore();
        }
      }

      // --- TEXT objects (Owner font props + temporary overrides) ---
      for (const f of list) {
        if (f.field_type === 'PHOTO' || f.field_key === 'photo') continue;
        const value = String(data[f.field_key] || '').trim();
        if (!value) continue;
        const fs = Math.max(4, Number(f.font_size) || 0);
        ctx.save();
        ctx.font = `${f.font_style === 'italic' ? 'italic ' : ''}${f.font_weight === 'bold' ? 'bold ' : ''}${fs}px ${f.font_family || 'Arial'}`;
        ctx.fillStyle = f.color || '#000000';
        ctx.textAlign = f.text_align || 'left';
        ctx.textBaseline = 'top';
        const lh = Number(f.line_height) > 0 ? Number(f.line_height) : 1.2;
        const linesFit = Math.max(1, Math.floor((f.height * c.height) / (fs * lh)));
        const lines = wrap(ctx, value, f.width * c.width, linesFit);
        const startX = f.x * c.width + (ctx.textAlign === 'center' ? f.width * c.width / 2 : ctx.textAlign === 'right' ? f.width * c.width : 0);
        lines.forEach((line, i) => ctx.fillText(line, startX, f.y * c.height + i * fs * lh));
        ctx.restore();
      }

      // Watermark is baked only into the on-screen/on-demand preview.
      // The final generated card (skipWatermark=true) is kept clean.
      //
      // STRONG WATERMARK: layered + full-coverage so automated watermark-
      // removal tools cannot erase it without destroying the card content
      // itself (name, photo, fields). Four layers:
      //   1) tiled diagonal grid covering the WHOLE canvas (alternating
      //      +/-20 deg, alternating dark/light, varying alpha)
      //   2) denser stronger stamps over the photo and student-name regions
      //   3) fine repeating text strips along all four edges
      if (!skipWatermark) {
        const texts = ['PREVIEW', `${brandName} • PREVIEW`];
        const drawMark = (text, x, y, angle, size, alpha, color) => {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.font = `bold ${Math.round(size)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.translate(x, y);
          ctx.rotate((angle * Math.PI) / 180);
          ctx.fillText(text, 0, 0);
          if (size > c.width * 0.02) {
            ctx.globalAlpha = alpha * 0.45;
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(1, size * 0.03);
            ctx.strokeText(text, 0, 0);
          }
          ctx.restore();
        };

        // --- Layer 1: full-coverage tiled diagonal grid ---
        const base = Math.max(24, Math.round(c.width * 0.045));
        const stepX = Math.max(1, Math.round(c.width * 0.42));
        const stepY = Math.max(1, Math.round(c.height * 0.11));
        let k = 0;
        for (let gy = -stepY; gy <= c.height + stepY; gy += stepY) {
          for (let gx = -stepX; gx <= c.width + stepX; gx += stepX) {
            const t = texts[k % 2];
            const angle = (k % 2 === 0 ? -20 : 20) + ((k % 3) - 1) * 4; // -24/-16/0/16/24 mix
            const alpha = 0.10 + ((k % 4) * 0.02);                      // 0.10..0.16
            const color = k % 2 === 0 ? '#1e293b' : '#ffffff';
            drawMark(t, gx + (gy / stepY % 2) * stepX / 2, gy, angle, base, alpha, color);
            k++;
          }
        }

        // --- Layer 2: stronger targeted stamps over photo + name regions ---
        const pfO = list.find(f => f.field_type === 'PHOTO' || f.field_key === 'photo');
        if (pfO) {
          drawMark('PREVIEW', (pfO.x + pfO.width / 2) * c.width, (pfO.y + pfO.height / 2) * c.height, -25, Math.max(20, pfO.width * c.width * 0.22), 0.22, '#1e293b');
        }
        const nfO = list.find(f => (f.field_key || '').match(/name/i));
        if (nfO) {
          drawMark('PREVIEW', (nfO.x + nfO.width / 2) * c.width, (nfO.y + nfO.height / 2) * c.height, 25, Math.max(18, nfO.width * c.width * 0.16), 0.22, '#1e293b');
        }

        // --- Layer 3: fine repeating strips along all four edges ---
        const es = Math.max(10, Math.round(c.width * 0.018));
        const stripText = `${brandName} • PREVIEW • `;
        ctx.save();
        ctx.font = `bold ${es}px Arial`;
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#1e293b';
        const edges = [
          { x: 0, y: es, a: 0 }, { x: 0, y: c.height - es, a: 0 },
          { x: es, y: c.height, a: -90 }, { x: c.width - es, y: c.height, a: -90 }
        ];
        edges.forEach(({ x, y, a }) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((a * Math.PI) / 180);
          for (let tx = es; tx < Math.max(c.width, c.height); tx += es * stripText.length * 0.55) {
            ctx.fillText(stripText, tx, 0);
          }
          ctx.restore();
        });
        ctx.restore();
      }

      const out = c.toDataURL('image/jpeg', 0.9);
      if (isBack) setBackPreview(out);
      else setPreview(out);
      return out;
    } catch (e) {
      console.error(e);
      toast.error('Failed to create preview');
    } finally {
      setRendering(false);
    }
  }, [design, fields, backFields, objects, data, photo, processed, photoChoice, rotation, photoCrop, brandName]);

  // Live re-render: every edit re-runs the SAME renderer so the on-screen
  // image, downloaded preview and generated card never diverge.
  useEffect(() => {
    if (step !== 4 || !design || !photo) return;
    clearTimeout(renderTimer.current);
    renderTimer.current = setTimeout(() => {
      renderCard('front');
      renderCard('back');
    }, 120);
    return () => clearTimeout(renderTimer.current);
  }, [step, design, fields, backFields, objects, data, photo, processed, photoChoice, rotation, renderCard]);

  async function generate() {
    if (!design || !photo || !valid()) {
      return toast.error('Complete required data');
    }
    setLoading(true);
    try {
      if (!preview) await renderCard('front');
      // Render a clean copy (no watermark) for the final generated card —
      // identical to the preview, so the saved/downloaded image matches the
      // design exactly.
      const finalFront = await renderCard('front', true);
      if (!finalFront || !finalFront.startsWith('data:image/')) {
        throw new Error('Failed to render the ID card. Please try again.');
      }
      // Designs with a back template require the back image in the payload —
      // render a clean (no watermark) back side to send along.
      const hasBack = !!(design.back_template) || backFields.length > 0;
      const finalBack = hasBack ? await renderCard('back', true) : null;
      if (hasBack && (!finalBack || !finalBack.startsWith('data:image/'))) {
        throw new Error('Failed to render the back side of the ID card. Please try again.');
      }
      // Demo mode: download the rendered images only — NOTHING is stored in
      // the database (no student row, no card record, no field data).
      if (demo) {
        downloadDataUrl(finalFront, `${data.studentName || 'student'}-front.png`);
        if (finalBack) setTimeout(() => downloadDataUrl(finalBack, `${data.studentName || 'student'}-back.png`), 500);
        toast.success('Demo images downloaded — nothing saved to database');
        return;
      }
      const payload = {
        name: data.studentName || '',
        fatherName: data.fatherName || '',
        class: data.class || '',
        section: data.section || '',
        rollNumber: data.rollNumber || '',
        phone: data.phone || '',
        address: data.address || '',
        admissionNumber: data.admissionNumber || '',
        dob: data.dob || ''
      };
      // Snapshot the rendered field layout/attributes (NOT the design's live
      // definition) so the card keeps exactly what was generated. Captures the
      // entered value + position/size/font/color/alignment for both sides.
      const snapshotFields = (sideList) => sideList
        .filter(f => f.source !== 'DEFAULT')
        .map(f => {
          const o = objects[f.id] || f;
          return {
            field_key: f.field_key,
            field_type: f.field_type,
            label: cleanLabel(f.label || f.field_key),
            value: data[f.field_key] || '',
            x: o.x, y: o.y, width: o.width, height: o.height,
            font_family: o.font_family, font_size: o.font_size,
            font_weight: o.font_weight, font_style: o.font_style,
            text_align: o.text_align, color: o.color,
            line_height: o.line_height, max_lines: o.max_lines,
            fit_mode: o.fit_mode
          };
        });
      const fieldData = {
        front: snapshotFields(fields),
        back: (design.back_template || backFields.length > 0) ? snapshotFields(backFields) : []
      };
      // Owner demo mode calls the credit-free owner endpoint; real school
      // scopes call the standard generate endpoint (which deducts credits).
      const endpoint = demo ? `/${scope}/id-cards/demo-generate` : `/${scope}/id-cards/generate`;
      const r = await api.post(endpoint, {
        designId: design.id,
        studentData: payload,
        photo: photoChoice === 'processed' && processed ? processed : photo,
        frontImage: finalFront,  // clean (no watermark), matching the preview design
        backImage: finalBack || undefined,
        photoRotation: rotation,
        fieldData,
        output: { width_mm: 55, height_mm: 88, format: 'jpeg', quality: 0.95 }
      });
      if (!r.data?.success) throw Error(r.data?.message || 'Generation failed');
      if (!demo) await loadCredits();
      toast.success(demo ? 'Demo ID card generated — no credit consumed' : 'ID card generated successfully');
      const card = r.data.card || r.data;
      if (card.front_image_url) download(card.front_image_url, `${data.studentName || 'student'}-front.jpg`);
      if (card.back_image_url) setTimeout(() => download(card.back_image_url, `${data.studentName || 'student'}-back.jpg`), 500);
      // Stay on this page after generation — no redirect.
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || e.response?.data?.error || e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  function download(url, name) {
    const a = document.createElement('a');
    a.href = imageUrl(url);
    a.download = name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Trigger a browser download from a canvas data URL (demo mode — no server
  // round-trip, nothing persisted).
  function downloadDataUrl(dataUrl, name) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const selectedField = fields.find(f => f.id === selected) || backFields.find(f => f.id === selected);

  function header() {
    return (
      <div className="id-step-header">
        {STEPS.map((x, i) => (
          <div key={x} className={`id-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
            <span>{step > i + 1 ? <CheckCircleIcon /> : i + 1}</span>
            {x}
          </div>
        ))}
      </div>
    );
  }

  function designStep() {
    return (
      <div className="id-card-panel">
        <h4><SchoolIcon /> Select Design</h4>
        <p className="text-muted">Only after selecting a design will the Owner-marked fields be loaded.</p>
        <div className="row g-4">
          <div className="col-md-5">
            <select className="form-select form-select-lg" value={design?.id || ''} onChange={choose}>
              <option value="">Choose design...</option>
              {designs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="col-md-7">
            {design?.front_template
              ? <img className="original-template" src={imageUrl(design.front_template)} alt="Template" />
              : <div className="empty-box">Select a design</div>}
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-primary btn-lg" disabled={!design || loading} onClick={continueDesign}>
            {loading ? 'Loading Fields...' : <><ArrowForwardIcon /> Continue</>}
          </button>
        </div>
      </div>
    );
  }

  function studentStep() {
    return (
      <div className="id-card-panel">
        <h4><PersonIcon /> Student Data</h4>
        <p className="text-muted">These are the fields marked by the Owner. DOB/Admission No will appear only when configured.</p>
        <div className="fields-group">
          <h5 className="fields-group-title">Front Fields</h5>
          <div className="row g-3">
            {
              fields.filter(f => f.field_type !== 'PHOTO').map(f => (
                <div className="col-md-6 col-lg-4" key={f.id}>
                  <label className="form-label">{f.label}{f.is_required && <b className="text-danger"> *</b>}</label>
                  <input className="form-control" name={f.field_key} value={data[f.field_key] || ''} onChange={change} placeholder={`Enter ${f.label}`} />
                </div>
              ))
            }
          </div>
        </div>

        {backFields.filter(f => f.field_type !== 'PHOTO').length > 0 && (
          <div className="fields-group mt-4">
            <h5 className="fields-group-title">Back Fields</h5>
            <div className="row g-3">
              {
                backFields.filter(f => f.field_type !== 'PHOTO').map(f => (
                  <div className="col-md-6 col-lg-4" key={f.id}>
                    <label className="form-label">{f.label}{f.is_required && <b className="text-danger"> *</b>}</label>
                    <input className="form-control" name={f.field_key} value={data[f.field_key] || ''} onChange={change} placeholder={`Enter ${f.label}`} />
                  </div>
                ))
              }
            </div>
          </div>
        )}
        <div className="actions">
          <button className="btn btn-outline-secondary" onClick={() => setStep(1)}><ArrowBackIcon /> Back</button>
          <button className="btn btn-primary btn-lg" onClick={() => valid() && setStep(3)}>Continue <ArrowForwardIcon /></button>
        </div>
      </div>
    );
  }

  function photoStep() {
    return (
      <div className="id-card-panel">
        <h4><PhotoIcon /> Student Photo</h4>
        <p className="text-muted">Upload the photo then choose to use the original image or remove the background.</p>
        <div className="photo-panel">
          {!photo ? (
            <button className="upload-box" onClick={() => inputRef.current?.click()}>
              <UploadIcon /><b>Upload Photo</b><small>JPG / PNG / WebP, max 5MB</small>
            </button>
          ) : (
            <>
              <img src={processed || photo} className="photo-large" alt="Student" />
              <div className="mt-3 d-flex gap-2">
                <button className="btn btn-outline-primary" disabled={removing} onClick={useOriginal}>
                  Use Original Image
                </button>
                <button className="btn btn-success" disabled={removing} onClick={removeBg}>
                  {removing ? `Removing… ${progress}%` : 'Remove Background'}
                </button>
                <button className="btn btn-outline-danger" onClick={removePhoto}><DeleteIcon /></button>
              </div>
              {removing && <div className="progress mt-3"><div className="progress-bar" style={{ width: `${progress}%` }} /></div>}
              {!removing && photoChoice === 'processed' && <small className="text-success d-block mt-2">✓ Using background-removed image</small>}
              {!removing && photoChoice === 'original' && <small className="text-muted d-block mt-2">Using the original uploaded image</small>}
            </>
          )}
          <input ref={inputRef} type="file" className="d-none" accept="image/*" onChange={upload} />
        </div>
        <div className="actions">
          <button className="btn btn-outline-secondary" onClick={() => setStep(2)}><ArrowBackIcon /> Back</button>
          <button className="btn btn-primary btn-lg" disabled={!photo} onClick={() => setStep(4)}>Continue to Preview <ArrowForwardIcon /></button>
        </div>
      </div>
    );
  }

  // Interaction handles above the rendered preview. Transparent by design —
  // all geometry comes from the same `objects` map the renderer uses, so the
  // handles always line up pixel-perfectly with the canvas output.
  function overlay(f) {
    const o = objects[f.id] || f;
    const isSel = selected === f.id;
    const isPhoto = f.field_type === 'PHOTO' || f.field_key === 'photo';
    // The photo is drawn by the shared renderer (preview canvas).
    return (
      <div
        key={f.id}
        className={`preview-object ${isPhoto ? 'photo-object' : 'text-object'} ${isSel ? 'selected' : ''}`}
        style={{
          left: `${o.x * 100}%`,
          top: `${o.y * 100}%`,
          width: `${o.width * 100}%`,
          height: `${o.height * 100}%`,
          background: isSel ? (isPhoto ? 'rgba(5,150,105,.10)' : 'rgba(37,99,235,.08)') : 'transparent'
        }}
        onPointerDown={e => dragStart(e, f)}
        onClick={e => e.stopPropagation()}
      >
        {isSel && <i>{f.label}</i>}
      </div>
    );
  }

  function previewStep() {
    return (
      <div className="editor">
        <div className="editor-top">
          <div>
            <b>Preview & Advanced Editor</b>
            <small>{demo ? 'Demo flow — generate saves the card but never consumes credits. Layout changes save automatically.' : 'Owner positions are loaded automatically. Changes here are temporary for this card.'}</small>
          </div>
          {(() => {
            const hasBack = !!(design?.back_template) || backFields.length > 0;
            return (
              <div className="d-flex align-items-center gap-2">
                <div className="canvas-toggle">
                  <button className={previewSide === 'front' ? 'active' : ''} onClick={() => setPreviewSide('front')}>Front</button>
                  {hasBack && (
                    <button className={previewSide === 'back' ? 'active' : ''} onClick={() => setPreviewSide('back')}>Back</button>
                  )}
                {demo && (
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={loading}
                    title="Persist the changed field positions/attributes to the design"
                    onClick={() => saveFieldsToDb(true)}
                  >
                    Save Positions
                  </button>
                )}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="editor-grid">
          <aside className="tools">
            <label>Zoom</label>
            <div className="tool-row">
              <button onClick={() => setZoom(x => Math.max(0.5, x - 0.1))}><ZoomOutIcon /></button>
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(x => Math.min(2, x + 0.1))}><ZoomInIcon /></button>
            </div>

            <label>{selectedField?.field_type === 'PHOTO' || selectedField?.field_key === 'photo' ? 'Photo' : 'Image'}</label>
            {selectedField?.field_type === 'PHOTO' || selectedField?.field_key === 'photo' ? (
              <>
                <small className="tool-hint">Zoom the photo in/out and drag it on the canvas to pan inside the frame.</small>
                <div className="tool-row" style={{ marginTop: '4px' }}>
                  <button title="Zoom out" onClick={() => setPhotoCrop(p => ({ ...p, scale: Math.max(1, (p?.scale || 1) - 0.1) }))}><ZoomOutIcon /></button>
                  <span>{`×${(photoCrop?.scale || 1).toFixed(1).replace(/\.0$/, '')}`}</span>
                  <button title="Zoom in" onClick={() => setPhotoCrop(p => ({ ...p, scale: Math.min(4, (p?.scale || 1) + 0.1) }))}><ZoomInIcon /></button>
                  <button title="Reset photo framing" onClick={() => setPhotoCrop({ x: 0.5, y: 0.5, scale: 1 })}>Reset</button>
                </div>
              </>
            ) : (
              <small className="tool-hint">Select the Student Photo field to zoom and frame it.</small>
            )}
            <label>Interaction</label>
            <div className="tool-row">
              <button className={pointerMode === 'move' ? 'active' : ''} title="Move" onClick={() => setPointerMode('move')}>Move</button>
              <button className={pointerMode === 'drag' ? 'active' : ''} title="Drag" onClick={() => setPointerMode('drag')}>Drag</button>
            </div>
            <small className="tool-hint">Select a field object then move/drag it directly on the preview.</small>
            <hr />

            {selectedField && (
              <>
                <label>Resize</label>
                <div className="tool-row">
                  <button onClick={() => resize(-0.01, -0.01)}><RemoveIcon /></button>
                  <button onClick={() => resize(0.01, 0.01)}><AddIcon /></button>
                </div>
                {selectedField.field_type !== 'PHOTO' && (
                  <>
                    <label>Text Size</label>
                    <div className="tool-row">
                      <button onClick={() => upd(selected, { font_size: Math.max(6, (objects[selected]?.font_size || selectedField.font_size) - 2) })}><RemoveIcon /></button>
                      <span>{objects[selected]?.font_size || selectedField.font_size}px</span>
                      <button onClick={() => upd(selected, { font_size: (objects[selected]?.font_size || selectedField.font_size) + 2 })}><AddIcon /></button>
                    </div>
                    <label>Text Style</label>
                    <div className="tool-row">
                      <button onClick={() => upd(selected, { font_weight: objects[selected]?.font_weight === 'bold' ? 'normal' : 'bold' })}><FormatBoldIcon /></button>
                      <button onClick={() => upd(selected, { font_style: objects[selected]?.font_style === 'italic' ? 'normal' : 'italic' })}><FormatItalicIcon /></button>
                    </div>
                    <label>Font</label>
                    <select className="form-select form-select-sm" value={objects[selected]?.font_family || selectedField.font_family || 'Arial'} onChange={ev => upd(selected, { font_family: ev.target.value })}>
                      {['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'Impact'].map(fn => <option key={fn} value={fn}>{fn}</option>)}
                    </select>
                    <label>Font Color</label>
                    <input type="color" className="form-control form-control-sm tool-color" value={objects[selected]?.color || selectedField.color || '#000000'} onChange={ev => upd(selected, { color: ev.target.value })} />
                    <label>Alignment</label>
                    <div className="tool-row">
                      <button className={(objects[selected]?.text_align || selectedField.text_align || 'left') === 'left' ? 'active' : ''} onClick={() => upd(selected, { text_align: 'left' })}>Left</button>
                      <button className={(objects[selected]?.text_align || selectedField.text_align || 'left') === 'center' ? 'active' : ''} onClick={() => upd(selected, { text_align: 'center' })}>Center</button>
                      <button className={(objects[selected]?.text_align || selectedField.text_align || 'left') === 'right' ? 'active' : ''} onClick={() => upd(selected, { text_align: 'right' })}>Right</button>
                    </div>
                  </>
                )}
              </>
            )}

            {selectedField?.field_type === 'PHOTO' && (
              <>
                <label>Photo Rotation</label>
                <div className="tool-row">
                  <button onClick={() => setRotation(r => (r - 15) % 360)}><RotateRightIcon style={{ transform: 'scaleX(-1)' }} /></button>
                  <span>{rotation}°</span>
                  <button onClick={() => setRotation(r => (r + 15) % 360)}><RotateRightIcon /></button>
                </div>
              </>
            )}

            <label>
              <input type="checkbox" checked={grid} onChange={() => setGrid(!grid)} />
              {' '}Grid
            </label>
          </aside>

          <main className="canvas-area">
            {(() => {
              return (
                <>
                  <div
                    className="id-preview-canvas"
                    style={{
                      transform: `scale(${zoom})`,
                      aspectRatio: '55/88'
                    }}
                    onPointerDown={handleCanvasSelect}
                  >
                    {previewSide === 'back' ? (
                      backPreview
                        ? <img src={backPreview} className="canvas-bg" alt="back preview" />
                        : (design?.back_template && <img src={imageUrl(design.back_template)} className="canvas-bg" alt="back template" />)
                    ) : (
                      preview
                        ? <img src={preview} className="canvas-bg" alt="preview" />
                        : (design?.front_template && <img src={imageUrl(design.front_template)} className="canvas-bg" alt="template" />)
                    )}

                    {grid && <div className="preview-grid" />}
                    {previewSide === 'back' ? backFields.map(overlay) : fields.map(overlay)}
                    <div className="watermark">PREVIEW</div>
                    {rendering && <div className="render-badge">Rendering…</div>}
                  </div>
                </>
              );
            })()}
          </main>
          <aside className="fields-panel">
            <h6>Front Fields</h6>
            {fields.length === 0 && <div className="fields-empty">No front fields available</div>}
            {fields.map(f => (
              <button key={f.id} className={`field-item ${selected === f.id ? 'active' : ''}`} onClick={() => setSelected(f.id)}>
                <span className="field-item-label">
                  <i className={`field-type-dot ${f.field_type === 'PHOTO' || f.field_key === 'photo' ? 'photo' : 'text'}`} />
                  {f.label}
                </span>
                <span className="field-item-value">{data[f.field_key] || '—'}</span>
              </button>
            ))}
            {backFields.length > 0 && (
              <>
                <hr />
                <h6>Back Fields</h6>
                {backFields.map(f => (
                  <button key={f.id} className={`field-item ${selected === f.id ? 'active' : ''}`} onClick={() => setSelected(f.id)}>
                    <span className="field-item-label">
                      <i className={`field-type-dot ${f.field_type === 'PHOTO' || f.field_key === 'photo' ? 'photo' : 'text'}`} />
                      {f.label}
                    </span>
                    <span className="field-item-value">{data[f.field_key] || '—'}</span>
                  </button>
                ))}
              </>
            )}
          </aside>
        </div>

        <div className="editor-actions">
          <button className="btn btn-outline-secondary" onClick={() => setStep(3)}><ArrowBackIcon /> Back</button>
          <button
            className="btn btn-outline-secondary"
            disabled={!preview}
            onClick={() => {
              const name = data.studentName || 'student';
              download(preview, `${name}-front.jpg`);
              if (backPreview) setTimeout(() => download(backPreview, `${name}-back.jpg`), 500);
            }}
          >
            <DownloadIcon /> Preview
          </button>
          <button
            className="btn btn-success btn-lg"
            disabled={loading || (!demo && credits <= 0)}
            onClick={generate}
          >
            {loading ? 'Generating...' : (<><CreditCardIcon /> {demo ? 'Generate & Download (Demo)' : 'Generate & Download'}</>)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={full ? 'id-generator full' : 'id-generator'}>
      <div className="generator-head">
        <div>
          <h3>ID Card Studio</h3>
          <small>Owner-configured template workflow</small>
        </div>
        <div className="credit">
          {!demo && <><CreditCardIcon /> Credits: {credits}</>}
          {demo && <small>Demo Mode — no credits used</small>}
          {step === 4 && <button onClick={() => setFull(!full)}>{full ? <FullscreenExitIcon /> : <FullscreenIcon />}</button>}
        </div>
      </div>
      {header()}
      {step === 1 && designStep()}
      {step === 2 && studentStep()}
      {step === 3 && photoStep()}
      {step === 4 && previewStep()}
    </div>
  );
}

export default IDCardGenerator;


