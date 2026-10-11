import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { fetchTemplateByEvent, bulkGetOrCreateCertificates } from '../api';
import { generateCertificatePDF, generateBatchCertificatesPDF } from '../utils/certificateGenerator';
import { 
  X, Download, FileArchive, CheckCircle2, Award, Users, AlertCircle, RefreshCw, FileText
} from 'lucide-react';

const CertificateGeneratorModal = ({ isOpen, onClose, eventId, eventTitle, attendees = [], selectedIds = [] }) => {
  const [filterMode, setFilterMode] = useState('all');
  const [exportFormat, setExportFormat] = useState('multipage'); // 'multipage' | 'zip'
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFilterMode(selectedIds.length > 0 ? 'selected' : 'all');
      setExportFormat('multipage');
      setErrorMessage('');
      setStatusMessage('');
      setProgress({ current: 0, total: 0 });
      setGenerating(false);
    }
  }, [isOpen, selectedIds]);

  if (!isOpen) return null;

  // Filter attendees based on mode
  const getTargetAttendees = () => {
    if (selectedIds.length > 0 && filterMode === 'selected') {
      return attendees.filter(a => selectedIds.includes(a.id));
    }
    if (filterMode === 'checked_in') {
      return attendees.filter(a => a.checked_in_1 || a.checked_in_2);
    }
    return attendees;
  };

  const targetAttendees = getTargetAttendees();

  // Export Certificates Action
  const handleExportCertificates = async () => {
    if (targetAttendees.length === 0) {
      setErrorMessage('No participants available for certificate generation.');
      return;
    }

    try {
      setGenerating(true);
      setErrorMessage('');
      setStatusMessage('Fetching certificate layout template...');

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

      if (exportFormat === 'multipage') {
        setStatusMessage(`Generating multi-page certificate PDF for ${targetAttendees.length} participants...`);
        setProgress({ current: targetAttendees.length, total: targetAttendees.length });

        await generateBatchCertificatesPDF({
          template: activeTemplate,
          targetAttendees,
          certRecords,
          eventTitle
        });

        setStatusMessage('Multi-page certificate PDF downloaded successfully!');
      } else {
        // ZIP Format
        const zip = new JSZip();
        const folderName = `${(eventTitle || 'Event').replace(/[^a-zA-Z0-9]/g, '_')}_Certificates`;
        const certFolder = zip.folder(folderName);

        setProgress({ current: 0, total: targetAttendees.length });

        for (let i = 0; i < targetAttendees.length; i++) {
          const attendee = targetAttendees[i];
          const cert = certRecords.find(c => c.attendee_id === attendee.id);
          const certNum = cert?.certificate_number || `CERT-2026-${i + 1}`;

          setStatusMessage(`Rendering certificate for ${attendee.full_name}... (${i + 1}/${targetAttendees.length})`);
          setProgress({ current: i + 1, total: targetAttendees.length });

          await new Promise(resolve => setTimeout(resolve, 30));

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

        setStatusMessage('ZIP Export completed successfully!');
      }

      setTimeout(() => {
        setGenerating(false);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Batch export error:', err);
      setErrorMessage(`Failed to generate certificates: ${err.message || 'Unknown error'}`);
      setGenerating(false);
    }
  };

  const progressPercent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans italic">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase italic tracking-tight">Certificate Generator</h2>
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

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* RECIPIENTS SELECTION */}
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
                <span className="text-xs font-medium">All Event Participants ({attendees.length})</span>
              </div>
            </label>

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
                <span className="text-xs font-medium">Checked-in Participants Only</span>
              </div>
            </label>
          </div>
        </div>

        {/* FORMAT SELECTION */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Export Format
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={generating}
              onClick={() => setExportFormat('multipage')}
              className={`p-3 rounded-xl border text-left transition-all space-y-1 ${exportFormat === 'multipage' ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <FileText size={14} className="text-purple-400" />
                <span>Multi-Page PDF</span>
              </div>
              <p className="text-[10px] text-slate-500">1 Document with 1 Cert per page (Fastest Print)</p>
            </button>

            <button
              type="button"
              disabled={generating}
              onClick={() => setExportFormat('zip')}
              className={`p-3 rounded-xl border text-left transition-all space-y-1 ${exportFormat === 'zip' ? 'bg-purple-600/10 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <FileArchive size={14} className="text-purple-400" />
                <span>Individual Files</span>
              </div>
              <p className="text-[10px] text-slate-500">Separate PDF file per participant (.zip)</p>
            </button>
          </div>
        </div>

        {/* GENERATING PROGRESS STATUS */}
        {generating && (
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-purple-400 font-bold flex items-center gap-1.5">
                <RefreshCw className="animate-spin" size={14} />
                {statusMessage}
              </span>
              <span className="text-white font-bold">{progressPercent}%</span>
            </div>
            
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* ACTION FOOTER */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            className="flex-1 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExportCertificates}
            disabled={generating || targetAttendees.length === 0}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download size={15} />
            <span>{generating ? 'Exporting...' : `Export Certificates (${targetAttendees.length})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default CertificateGeneratorModal;
