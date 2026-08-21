import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { fetchTemplateByEvent, bulkGetOrCreateCertificates, getOrCreateCertificate } from '../api';
import { generateCertificatePDF } from '../utils/certificateGenerator';
import { 
  X, Download, FileArchive, CheckCircle2, Award, Users, AlertCircle, RefreshCw, FileText
} from 'lucide-react';

const CertificateGeneratorModal = ({ isOpen, onClose, eventId, eventTitle, attendees = [], selectedIds = [] }) => {
  const [exportType, setExportType] = useState('batch'); // 'batch' | 'single'
  const [filterMode, setFilterMode] = useState('checked_in');
  const [selectedSingleId, setSelectedSingleId] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setExportType(selectedIds.length === 1 ? 'single' : 'batch');
      setFilterMode(selectedIds.length > 0 ? 'selected' : 'checked_in');
      setSelectedSingleId(selectedIds.length === 1 ? selectedIds[0] : (attendees[0]?.id || ''));
      setErrorMessage('');
      setStatusMessage('');
      setProgress({ current: 0, total: 0 });
      setGenerating(false);
    }
  }, [isOpen, selectedIds, attendees]);

  if (!isOpen) return null;

  // Filter attendees based on mode
  const getEligibleAttendees = () => {
    if (filterMode === 'selected' && selectedIds.length > 0) {
      return attendees.filter(a => selectedIds.includes(a.id));
    }
    if (filterMode === 'checked_in') {
      return attendees.filter(a => a.checked_in_1 || a.checked_in_2);
    }
    return attendees;
  };

  const targetAttendees = getEligibleAttendees();

  // Export Single Certificate PDF
  const handleExportSingle = async () => {
    const attendee = attendees.find(a => a.id === selectedSingleId);
    if (!attendee) {
      setErrorMessage('Please select a valid participant for single certificate export.');
      return;
    }

    try {
      setGenerating(true);
      setErrorMessage('');
      setStatusMessage(`Preparing certificate for ${attendee.full_name}...`);

      const { data: template } = await fetchTemplateByEvent(eventId);
      const activeTemplate = template || {
        orientation: 'landscape',
        canvas_width: 1920,
        canvas_height: 1080,
        elements: [
          { id: 'participant_name', field: 'participant_name', label: 'Participant Name', x: 50, y: 45, fontSize: 48, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#0f172a', align: 'center' },
          { id: 'qr_code', field: 'qr_code', label: 'Verification QR Code', x: 82, y: 72, width: 12, height: 18, align: 'left' },
          { id: 'certificate_number', field: 'certificate_number', label: 'Certificate ID', x: 82, y: 92, fontSize: 14, fontFamily: 'Courier', fontWeight: 'normal', color: '#64748b', align: 'left' },
          { id: 'event_title', field: 'event_title', label: 'Event Title', x: 50, y: 30, fontSize: 24, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#475569', align: 'center' },
          { id: 'issue_date', field: 'issue_date', label: 'Issue Date', x: 50, y: 85, fontSize: 14, fontFamily: 'Helvetica', fontWeight: 'normal', color: '#64748b', align: 'center' }
        ]
      };

      const certRecord = await getOrCreateCertificate(eventId, attendee.id, activeTemplate.id || null, attendee);
      const certNum = certRecord?.certificate_number || 'CERT-2026-SINGLE';

      const pdfDoc = await generateCertificatePDF({
        template: activeTemplate,
        attendee,
        event: { title: eventTitle },
        certNumber: certNum
      });

      const safeName = (attendee.full_name || 'Participant').replace(/[^a-zA-Z0-9]/g, '_');
      pdfDoc.save(`${certNum}_${safeName}.pdf`);

      setStatusMessage('Certificate downloaded successfully!');
      setTimeout(() => {
        setGenerating(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Single export error:', err);
      setErrorMessage(`Failed to export certificate: ${err.message || 'Unknown error'}`);
      setGenerating(false);
    }
  };

  // Export Batch Certificates as ZIP File with Smooth Animated Progress Bar
  const handleExportZIP = async () => {
    if (targetAttendees.length === 0) {
      setErrorMessage('No participants selected for batch export.');
      return;
    }

    try {
      setGenerating(true);
      setErrorMessage('');
      setStatusMessage('Fetching layout template and certificate keys...');

      const { data: template } = await fetchTemplateByEvent(eventId);
      const activeTemplate = template || {
        orientation: 'landscape',
        canvas_width: 1920,
        canvas_height: 1080,
        elements: [
          { id: 'participant_name', field: 'participant_name', label: 'Participant Name', x: 50, y: 45, fontSize: 48, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#0f172a', align: 'center' },
          { id: 'qr_code', field: 'qr_code', label: 'Verification QR Code', x: 82, y: 72, width: 12, height: 18, align: 'left' },
          { id: 'certificate_number', field: 'certificate_number', label: 'Certificate ID', x: 82, y: 92, fontSize: 14, fontFamily: 'Courier', fontWeight: 'normal', color: '#64748b', align: 'left' },
          { id: 'event_title', field: 'event_title', label: 'Event Title', x: 50, y: 30, fontSize: 24, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#475569', align: 'center' },
          { id: 'issue_date', field: 'issue_date', label: 'Issue Date', x: 50, y: 85, fontSize: 14, fontFamily: 'Helvetica', fontWeight: 'normal', color: '#64748b', align: 'center' }
        ]
      };

      const attendeeIds = targetAttendees.map(a => a.id);
      const certRecords = await bulkGetOrCreateCertificates(eventId, attendeeIds, activeTemplate.id || null, targetAttendees);

      const zip = new JSZip();
      const folderName = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Certificates`;
      const certFolder = zip.folder(folderName);

      setProgress({ current: 0, total: targetAttendees.length });

      for (let i = 0; i < targetAttendees.length; i++) {
        const attendee = targetAttendees[i];
        const cert = certRecords.find(c => c.attendee_id === attendee.id);
        const certNum = cert?.certificate_number || `CERT-2026-${i + 1}`;

        setStatusMessage(`Rendering PDF for ${attendee.full_name}... (${i + 1}/${targetAttendees.length})`);
        setProgress({ current: i + 1, total: targetAttendees.length });

        // Micro delay to yield control so React updates progress bar smoothly
        await new Promise(resolve => setTimeout(resolve, 40));

        const pdfDoc = await generateCertificatePDF({
          template: activeTemplate,
          attendee,
          event: { title: eventTitle },
          certNumber: certNum
        });

        const pdfBlob = pdfDoc.output('blob');
        const safeName = (attendee.full_name || 'Participant').replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${certNum}_${safeName}.pdf`;

        certFolder.file(fileName, pdfBlob);
      }

      setStatusMessage('Compressing ZIP archive...');
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${folderName}.zip`);

      setStatusMessage('Export completed successfully!');
      setTimeout(() => {
        setGenerating(false);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Batch export error:', err);
      setErrorMessage(`Failed to generate batch certificates ZIP: ${err.message || 'Unknown error'}`);
      setGenerating(false);
    }
  };

  const progressPercent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Certificate Generator</h2>
              <p className="text-xs text-slate-400 font-mono">{eventTitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={generating}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* EXPORT MODE TYPE SWITCH (SINGLE vs BATCH) */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl gap-1">
          <button
            type="button"
            disabled={generating}
            onClick={() => setExportType('batch')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${exportType === 'batch' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <FileArchive size={15} />
            <span>Batch ZIP Export</span>
          </button>

          <button
            type="button"
            disabled={generating}
            onClick={() => setExportType('single')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${exportType === 'single' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <FileText size={15} />
            <span>Single PDF Export</span>
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE CONTENT */}
        {exportType === 'single' ? (
          /* SINGLE PARTICIPANT SELECTION */
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Select Participant
            </label>
            <select
              value={selectedSingleId}
              onChange={(e) => setSelectedSingleId(e.target.value)}
              disabled={generating}
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white outline-none"
            >
              {attendees.map(a => (
                <option key={a.id} value={a.id}>
                  {a.full_name} ({a.student_id || a.email || 'No ID'})
                </option>
              ))}
            </select>
          </div>
        ) : (
          /* BATCH RECIPIENTS SELECTION */
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Target Recipients ({targetAttendees.length} eligible)
            </label>

            <div className="space-y-2">
              {selectedIds.length > 0 && (
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${filterMode === 'selected' ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="filter"
                      disabled={generating}
                      checked={filterMode === 'selected'}
                      onChange={() => setFilterMode('selected')}
                      className="accent-purple-500"
                    />
                    <span className="text-xs font-medium">Selected Participants Only ({selectedIds.length})</span>
                  </div>
                </label>
              )}

              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${filterMode === 'checked_in' ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="filter"
                    disabled={generating}
                    checked={filterMode === 'checked_in'}
                    onChange={() => setFilterMode('checked_in')}
                    className="accent-purple-500"
                  />
                  <span className="text-xs font-medium">Checked-In Attendees Only</span>
                </div>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${filterMode === 'all' ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="filter"
                    disabled={generating}
                    checked={filterMode === 'all'}
                    onChange={() => setFilterMode('all')}
                    className="accent-purple-500"
                  />
                  <span className="text-xs font-medium">All Registered Attendees ({attendees.length})</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* REAL-TIME PROGRESS LOADBAR */}
        {generating && (
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 truncate max-w-[260px]">{statusMessage}</span>
              <span className="text-purple-400 font-bold ml-2 shrink-0">{progressPercent}% ({progress.current}/{progress.total})</span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
          >
            Cancel
          </button>

          {exportType === 'single' ? (
            <button
              type="button"
              onClick={handleExportSingle}
              disabled={generating || !selectedSingleId}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 min-h-[44px]"
            >
              {generating ? <RefreshCw className="animate-spin text-white" size={16} /> : <Download size={16} />}
              <span>{generating ? 'Downloading...' : 'Download Single PDF'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExportZIP}
              disabled={generating || targetAttendees.length === 0}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 min-h-[44px]"
            >
              {generating ? <RefreshCw className="animate-spin text-white" size={16} /> : <FileArchive size={16} />}
              <span>{generating ? 'Exporting ZIP...' : `Export ZIP Bundle (${targetAttendees.length})`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateGeneratorModal;
