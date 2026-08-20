import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchEventById, 
  fetchTemplateByEvent, 
  saveCertificateTemplate, 
  uploadTemplateBackground 
} from '../api';
import { LoadingSpinner } from '../components';
import { 
  ArrowLeft, Upload, Save, Type, QrCode, Trash2, Eye, Plus, 
  CheckCircle2, AlertCircle, Move, Sliders, Layers, Sparkles
} from 'lucide-react';

const DEFAULT_ELEMENTS = [
  {
    id: 'participant_name',
    field: 'participant_name',
    label: 'Participant Name',
    x: 50,
    y: 45,
    width: 60,
    height: 10,
    fontSize: 48,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: '#0f172a',
    align: 'center'
  },
  {
    id: 'qr_code',
    field: 'qr_code',
    label: 'Verification QR Code',
    x: 82,
    y: 75,
    width: 12,
    height: 18,
    align: 'left'
  },
  {
    id: 'certificate_number',
    field: 'certificate_number',
    label: 'Certificate ID',
    x: 82,
    y: 92,
    fontSize: 14,
    fontFamily: 'Courier',
    fontWeight: 'normal',
    color: '#64748b',
    align: 'left'
  }
];

const SAMPLE_ATTENDEE = {
  full_name: 'Zaid Fahad',
  student_id: '20261994',
  category: 'Competitive Programming Champion'
};

const CertificateDesigner = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState(null);

  const [templateName, setTemplateName] = useState('Official Event Certificate');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [orientation, setOrientation] = useState('landscape');
  const [elements, setElements] = useState(DEFAULT_ELEMENTS);
  const [selectedElementId, setSelectedElementId] = useState('participant_name');
  const [uploadingBg, setUploadingBg] = useState(false);

  const [canvasWidth, setCanvasWidth] = useState(1920);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [scaleFactor, setScaleFactor] = useState(0.4427);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Auto-detect image natural resolution for 100% exact ratio
  useEffect(() => {
    if (!bgImageUrl) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setCanvasWidth(img.naturalWidth);
        setCanvasHeight(img.naturalHeight);
        setOrientation(img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait');
      }
    };
    img.src = bgImageUrl;
  }, [bgImageUrl]);

  // Compute exact scale ratio between screen canvas box and true template dimensions
  useEffect(() => {
    if (!canvasRef.current) return;

    const updateScale = () => {
      if (canvasRef.current) {
        const clientW = canvasRef.current.clientWidth;
        if (clientW > 0 && canvasWidth > 0) {
          setScaleFactor(clientW / canvasWidth);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    const observer = new ResizeObserver(updateScale);
    observer.observe(canvasRef.current);

    return () => {
      window.removeEventListener('resize', updateScale);
      observer.disconnect();
    };
  }, [canvasWidth, loading]);

  // Fetch Event & Existing Template Layout with Async Image Preloading
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: eventData, error: eventErr } = await fetchEventById(eventId);
      if (eventErr) throw eventErr;
      setEvent(eventData);

      const { data: tmplData } = await fetchTemplateByEvent(eventId);
      if (tmplData) {
        setTemplateId(tmplData.id);
        setTemplateName(tmplData.template_name || 'Official Event Certificate');
        setOrientation(tmplData.orientation || 'landscape');
        if (tmplData.elements && tmplData.elements.length > 0) {
          setElements(tmplData.elements);
        }

        if (tmplData.background_image_url) {
          setBgImageUrl(tmplData.background_image_url);
          // Preload image to detect exact aspect ratio before rendering
          await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                setCanvasWidth(img.naturalWidth);
                setCanvasHeight(img.naturalHeight);
                setOrientation(img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait');
              }
              resolve();
            };
            img.onerror = () => resolve();
            img.src = tmplData.background_image_url;
          });
        }
      }
    } catch (err) {
      console.error('Failed to load certificate designer:', err);
      setErrorMessage('Failed to load event certificate layout.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Template File Upload with Bulletproof Local & Remote Fallback
  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingBg(true);
      setErrorMessage('');

      // 1. Read file as local Data URL immediately for instant preview & zero-failure local mode
      const reader = new FileReader();
      reader.onload = async (event) => {
        const localDataUrl = event.target?.result;
        if (localDataUrl) {
          setBgImageUrl(localDataUrl);
          setSuccessMessage('Background template loaded successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }

        // 2. Attempt remote Supabase Storage upload in background
        try {
          const publicUrl = await uploadTemplateBackground(eventId, file);
          if (publicUrl) {
            setBgImageUrl(publicUrl);
          }
        } catch (storageErr) {
          console.warn('Supabase storage upload fallback to local Data URL:', storageErr);
        } finally {
          setUploadingBg(false);
        }
      };

      reader.onerror = () => {
        setErrorMessage('Failed to read image file.');
        setUploadingBg(false);
      };

      reader.readAsDataURL(file);

    } catch (err) {
      console.error('Failed to upload background:', err);
      setErrorMessage('Upload failed. Please upload a valid image (PNG/JPEG/SVG).');
      setUploadingBg(false);
    }
  };

  // Add Element to Canvas
  const addElement = (field, label) => {
    const newId = `${field}_${Date.now()}`;
    const newEl = {
      id: newId,
      field,
      label,
      x: 50,
      y: 50,
      width: field === 'qr_code' ? 12 : 50,
      height: field === 'qr_code' ? 18 : 10,
      fontSize: field === 'participant_name' ? 44 : 24,
      fontFamily: field === 'certificate_number' ? 'Courier' : 'Helvetica',
      fontWeight: field === 'participant_name' ? 'bold' : 'normal',
      color: '#0f172a',
      align: 'center',
      customText: field === 'custom_text' ? 'Sample Text' : ''
    };

    setElements([...elements, newEl]);
    setSelectedElementId(newId);
  };

  // Remove Selected Element
  const removeElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  // Update Active Element Properties
  const updateSelectedElement = (updates) => {
    if (!selectedElementId) return;
    setElements(elements.map(el => {
      if (el.id === selectedElementId) {
        return { ...el, ...updates };
      }
      return el;
    }));
  };

  // Drag Element Handling on Preview Canvas
  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    setSelectedElementId(id);
    isDraggingRef.current = true;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !selectedElementId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    let posXPercent = Math.round((clientX / rect.width) * 100);
    let posYPercent = Math.round((clientY / rect.height) * 100);

    // Clamp within 0% - 100%
    posXPercent = Math.max(0, Math.min(100, posXPercent));
    posYPercent = Math.max(0, Math.min(100, posYPercent));

    updateSelectedElement({ x: posXPercent, y: posYPercent });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Save Layout to Supabase
  const handleSaveTemplate = async () => {
    if (!bgImageUrl) {
      setErrorMessage('Please upload a template background before saving.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      const { data, error } = await saveCertificateTemplate({
        id: templateId || undefined,
        event_id: eventId,
        template_name: templateName,
        background_image_url: bgImageUrl,
        canvas_width: canvasWidth,
        canvas_height: canvasHeight,
        orientation,
        elements
      });

      if (error) {
        console.error('Save template error response:', error);
        setErrorMessage(error.message || 'Failed to save certificate template.');
      } else {
        if (data?.id) setTemplateId(data.id);
        setSuccessMessage('Certificate layout saved successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Save template exception:', err);
      setErrorMessage('Failed to save certificate template.');
    } finally {
      setSaving(false);
    }
  };

  const activeElement = elements.find(el => el.id === selectedElementId);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* HEADER BAR */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 px-6 flex items-center justify-between sticky top-0 z-[100] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Certificate Visual Designer
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono">Event: {event?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveTemplate}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 min-h-[40px]"
          >
            {saving ? <LoadingSpinner /> : <Save size={16} />}
            <span>Save Template</span>
          </button>
        </div>
      </header>

      {/* NOTIFICATION MESSAGES */}
      {successMessage && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/30 p-3 px-6 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-500/10 border-b border-red-500/30 p-3 px-6 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MAIN DESIGNER WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT TOOLBAR & PLACEHOLDERS PANEL */}
        <div className="lg:col-span-3 bg-slate-900/60 border-r border-slate-800/80 p-5 space-y-6 overflow-y-auto max-h-screen">
          {/* TEMPLATE NAME & BACKGROUND */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-purple-400" /> Template Settings
            </h2>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Background Image/PDF</label>
              <label className="w-full border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 transition-all group">
                <Upload size={22} className="text-slate-500 group-hover:text-purple-400 transition-colors mb-1" />
                <span className="text-xs text-slate-300 font-medium">
                  {uploadingBg ? 'Uploading...' : bgImageUrl ? 'Change Background' : 'Upload Template Image'}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, SVG or PDF page</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleBgUpload}
                  disabled={uploadingBg}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* DYNAMIC PLACEHOLDERS TOOLBAR */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={14} className="text-emerald-400" /> Add Dynamic Placeholders
            </h2>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => addElement('participant_name', 'Participant Name')}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-xl text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-all text-left"
              >
                <Type size={14} className="text-purple-400" />
                <span>Participant Name</span>
              </button>

              <button
                onClick={() => addElement('student_id', 'Student ID')}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-xl text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-all text-left"
              >
                <Type size={14} className="text-blue-400" />
                <span>Student ID</span>
              </button>

              <button
                onClick={() => addElement('certificate_number', 'Certificate ID')}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-all text-left"
              >
                <Type size={14} className="text-emerald-400" />
                <span>Certificate Number</span>
              </button>

              <button
                onClick={() => addElement('event_title', 'Event Title')}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-all text-left"
              >
                <Type size={14} className="text-amber-400" />
                <span>Event Title</span>
              </button>

              <button
                onClick={() => addElement('qr_code', 'Verification QR Code')}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-xs text-slate-200 hover:text-white flex items-center gap-2 transition-all text-left font-semibold"
              >
                <QrCode size={14} className="text-cyan-400" />
                <span>Verification QR Code</span>
              </button>

              <button
                onClick={() => addElement('issue_date', 'Issue Date')}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-2 transition-all text-left"
              >
                <Type size={14} className="text-slate-400" />
                <span>Issue Date</span>
              </button>
            </div>
          </div>
        </div>

        {/* CENTER INTERACTIVE VISUAL CANVAS PREVIEW */}
        <div 
          className="lg:col-span-6 bg-slate-950 p-6 flex flex-col items-center justify-center relative overflow-auto min-h-[500px]"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {bgImageUrl ? (
            <div
              ref={canvasRef}
              className="relative bg-white shadow-2xl rounded-lg border border-slate-800 overflow-hidden select-none transition-all duration-300 animate-in fade-in duration-300"
              style={{
                width: '100%',
                maxWidth: '850px',
                aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                backgroundImage: `url(${bgImageUrl})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* RENDER PLACEHOLDER OVERLAYS */}
              {elements.map((el) => {
                const isSelected = el.id === selectedElementId;
                let text = '';
                switch (el.field) {
                  case 'participant_name': text = SAMPLE_ATTENDEE.full_name; break;
                  case 'student_id': text = `ID: ${SAMPLE_ATTENDEE.student_id}`; break;
                  case 'certificate_number': text = 'CERT-2026-A1B2C3'; break;
                  case 'event_title': text = event?.title || 'IUB Programming Contest'; break;
                  case 'issue_date': text = new Date().toLocaleDateString(); break;
                  default: text = el.label;
                }

                const transformStyle = el.field === 'qr_code' 
                  ? 'none' 
                  : (el.align === 'center' ? 'translateX(-50%)' : el.align === 'right' ? 'translateX(-100%)' : 'none');

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    className={`absolute cursor-move transition-shadow ${isSelected ? 'ring-2 ring-purple-500 bg-purple-500/10 rounded-md p-1' : 'hover:ring-1 hover:ring-purple-400/50'}`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: transformStyle,
                      textAlign: el.align || 'left',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {el.field === 'qr_code' ? (
                      <div 
                        className="bg-white p-1 border border-slate-300 rounded shadow-md flex flex-col items-center justify-center"
                        style={{ width: `${Math.max(40, (el.width || 12) * scaleFactor * canvasWidth / 100)}px`, height: 'auto', aspectRatio: '1 / 1' }}
                      >
                        <QrCode size={Math.max(24, (el.width || 12) * scaleFactor * canvasWidth / 150)} className="text-slate-900" />
                        <span className="text-[7px] font-mono text-slate-600 font-bold mt-0.5">SCAN TO VERIFY</span>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize: `${Math.max(8, (el.fontSize || 36) * scaleFactor)}px`,
                          fontFamily: el.fontFamily || 'Helvetica',
                          fontWeight: el.fontWeight || 'normal',
                          color: el.color || '#0f172a',
                          lineHeight: 1,
                          display: 'inline-block'
                        }}
                      >
                        {text}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-md">
              <Upload size={40} className="mx-auto text-slate-600" />
              <div>
                <h3 className="text-base font-bold text-white">No Background Template Uploaded</h3>
                <p className="text-xs text-slate-400 mt-1">Upload a certificate template image on the left sidebar to start placing dynamic placeholders.</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PROPERTY STYLING PANEL */}
        <div className="lg:col-span-3 bg-slate-900/60 border-l border-slate-800/80 p-5 space-y-6 overflow-y-auto max-h-screen">
          {activeElement ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Active Element</span>
                  <h3 className="text-sm font-bold text-white">{activeElement.label}</h3>
                </div>
                <button
                  onClick={() => removeElement(activeElement.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                  title="Remove Element"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* TYPOGRAPHY CONTROLS (Non-QR) */}
              {activeElement.field !== 'qr_code' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={13} /> Typography Settings
                  </h4>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Font Size ({activeElement.fontSize || 36}px)</label>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={activeElement.fontSize || 36}
                      onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Font Family</label>
                    <select
                      value={activeElement.fontFamily || 'Helvetica'}
                      onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="Helvetica">Helvetica / Sans-Serif</option>
                      <option value="Times">Times New Roman / Serif</option>
                      <option value="Courier">Courier / Monospace</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Font Weight</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateSelectedElement({ fontWeight: activeElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        className={`py-1.5 text-xs rounded-lg border font-bold ${activeElement.fontWeight === 'bold' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        Bold
                      </button>
                      <button
                        onClick={() => updateSelectedElement({ fontWeight: activeElement.fontWeight === 'italic' ? 'normal' : 'italic' })}
                        className={`py-1.5 text-xs rounded-lg border italic ${activeElement.fontWeight === 'italic' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        Italic
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeElement.color || '#0f172a'}
                        onChange={(e) => updateSelectedElement({ color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-700 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={activeElement.color || '#0f172a'}
                        onChange={(e) => updateSelectedElement({ color: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 font-mono text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Text Alignment</label>
                    <div className="grid grid-cols-3 gap-1">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          onClick={() => updateSelectedElement({ align })}
                          className={`py-1.5 text-xs uppercase font-bold rounded-lg border ${activeElement.align === align ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* COORDINATE POSITIONING */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Move size={13} /> Coordinates Position (%)
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">X Position (%)</label>
                    <input
                      type="number"
                      value={activeElement.x}
                      onChange={(e) => updateSelectedElement({ x: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Y Position (%)</label>
                    <input
                      type="number"
                      value={activeElement.y}
                      onChange={(e) => updateSelectedElement({ y: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Eye size={32} className="mx-auto text-slate-600" />
              <p className="text-xs">Click on any placeholder element on the canvas to customize its typography, color, and position.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateDesigner;
