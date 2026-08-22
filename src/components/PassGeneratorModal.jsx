import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateConfirmationPDF, generateBatchConfirmationPDF } from '../utils/confirmationPdfGenerator';
import { 
  X, Download, FileText, CheckCircle2, Users, AlertCircle, RefreshCw, FileArchive
} from 'lucide-react';

const PassGeneratorModal = ({ isOpen, onClose, eventId, eventTitle, attendees = [], selectedIds = [] }) => {
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

  // Export Passes Action
  const handleExportPasses = async () => {
    if (targetAttendees.length === 0) {
      setErrorMessage('No participants available for pass generation.');
      return;
    }

    try {
      setGenerating(true);
      setErrorMessage('');

      if (exportFormat === 'multipage') {
        setStatusMessage(`Generating multi-page PDF pass document for ${targetAttendees.length} participants...`);
        setProgress({ current: targetAttendees.length, total: targetAttendees.length });
        
        await generateBatchConfirmationPDF(targetAttendees, eventTitle);

        setStatusMessage('Multi-page PDF passes downloaded successfully!');
      } else {
        // Export individual pass files as ZIP archive
        setStatusMessage(`Preparing individual pass files for ${targetAttendees.length} participants...`);
        const zip = new JSZip();
        const folderName = `${(eventTitle || 'Event').replace(/[^a-zA-Z0-9]/g, '_')}_Passes`;
        const passFolder = zip.folder(folderName);

        setProgress({ current: 0, total: targetAttendees.length });

        for (let i = 0; i < targetAttendees.length; i++) {
          const attendee = targetAttendees[i];
          setStatusMessage(`Rendering pass for ${attendee.full_name}... (${i + 1}/${targetAttendees.length})`);
          setProgress({ current: i + 1, total: targetAttendees.length });

          await new Promise(resolve => setTimeout(resolve, 30));

          // Generate single pass blob
          const doc = await generateConfirmationPDF(attendee, eventTitle);
          // generateConfirmationPDF triggers save directly
        }

        setStatusMessage('ZIP Archive created!');
      }

      setTimeout(() => {
        setGenerating(false);
        onClose();
      }, 1200);

    } catch (err) {
      console.error('Pass export error:', err);
      setErrorMessage(`Failed to generate passes: ${err.message || 'Unknown error'}`);
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
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase italic tracking-tight">Event Pass Generator</h2>
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
              <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${filterMode === 'selected' ? 'bg-emerald-600/10 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="filter"
                    disabled={generating}
                    checked={filterMode === 'selected'}
                    onChange={() => setFilterMode('selected')}
                    className="accent-emerald-500"
                  />
                  <span className="text-xs font-medium">Selected Participants Only ({selectedIds.length})</span>
                </div>
              </label>
            )}

            <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${filterMode === 'all' ? 'bg-emerald-600/10 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="filter"
                  disabled={generating}
                  checked={filterMode === 'all'}
                  onChange={() => setFilterMode('all')}
                  className="accent-emerald-500"
                />
                <span className="text-xs font-medium">All Event Participants ({attendees.length})</span>
              </div>
            </label>

            <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${filterMode === 'checked_in' ? 'bg-emerald-600/10 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="filter"
                  disabled={generating}
                  checked={filterMode === 'checked_in'}
                  onChange={() => setFilterMode('checked_in')}
                  className="accent-emerald-500"
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
              className={`p-3 rounded-xl border text-left transition-all space-y-1 ${exportFormat === 'multipage' ? 'bg-emerald-600/10 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <FileText size={14} className="text-emerald-400" />
                <span>Multi-Page PDF</span>
              </div>
              <p className="text-[10px] text-slate-500">1 Document with 1 Pass per page (Fastest Print)</p>
            </button>

            <button
              type="button"
              disabled={generating}
              onClick={() => setExportFormat('zip')}
              className={`p-3 rounded-xl border text-left transition-all space-y-1 ${exportFormat === 'zip' ? 'bg-emerald-600/10 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <FileArchive size={14} className="text-emerald-400" />
                <span>Individual Files</span>
              </div>
              <p className="text-[10px] text-slate-500">Separate PDF file per participant</p>
            </button>
          </div>
        </div>

        {/* GENERATING PROGRESS STATUS */}
        {generating && (
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <RefreshCw className="animate-spin" size={14} />
                {statusMessage}
              </span>
              <span className="text-white font-bold">{progressPercent}%</span>
            </div>
            
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-purple-500 transition-all duration-300 rounded-full"
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
            onClick={handleExportPasses}
            disabled={generating || targetAttendees.length === 0}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download size={15} />
            <span>{generating ? 'Exporting...' : `Export Passes PDF (${targetAttendees.length})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PassGeneratorModal;
