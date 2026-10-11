import React, { useState } from 'react';
import Papa from 'papaparse';
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, 
  HelpCircle, ArrowRight, X, Table, Check, Layers, Eye, RefreshCw
} from 'lucide-react';
import { bulkInsertAttendees } from '../api/attendees';

const CsvFieldMapperModal = ({ isOpen, onClose, eventId, onImportAttendees, onImportSuccess }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [showHowTo, setShowHowTo] = useState(false);

  // Field Mapping State
  const [mapping, setMapping] = useState({
    full_name: '',
    student_id: '',
    reference: '',
    email: '',
    phone: '',
    category: ''
  });

  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  // Handle File Selection & Auto-detection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta?.fields) {
          const fields = results.meta.fields;
          setHeaders(fields);
          setParsedRows(results.data);

          // Auto-detect mandatory fields based on header names
          const autoMap = { full_name: '', student_id: '', reference: '', email: '', phone: '', category: '' };
          fields.forEach((h) => {
            const lower = h.toLowerCase();
            if (lower.includes('name') && !autoMap.full_name) autoMap.full_name = h;
            else if ((lower.includes('student') || lower.includes('id') || lower.includes('roll')) && !autoMap.student_id) autoMap.student_id = h;
            else if ((lower.includes('reference') || lower.includes('host') || lower.includes('ref')) && !autoMap.reference) autoMap.reference = h;
            else if (lower.includes('email') && !autoMap.email) autoMap.email = h;
            else if ((lower.includes('phone') || lower.includes('mobile')) && !autoMap.phone) autoMap.phone = h;
            else if (lower.includes('category') || lower.includes('type')) autoMap.category = h;
          });

          setMapping(autoMap);
        }
      },
      error: (err) => {
        alert(`Failed to parse CSV file: ${err.message}`);
      }
    });
  };

  // Generate mapped attendee list
  const getMappedAttendees = () => {
    return parsedRows.map((row, idx) => {
      const nameVal = (row[mapping.full_name] || `Participant ${idx + 1}`).trim();
      const normName = nameVal.toLowerCase();
      const fallbackId = `GUEST-${normName.replace(/[^a-z0-9]/g, '')}`;
      const studentIdVal = (row[mapping.student_id] || '').trim() || fallbackId;
      const refVal = (row[mapping.reference] || row[mapping.phone] || 'CSV Roster Import').trim();
      const catVal = (row[mapping.category] || 'Participant').trim();

      return {
        full_name: nameVal,
        student_id: studentIdVal,
        reference: refVal,
        category: catVal,
        email: row[mapping.email] || (row[mapping.reference]?.includes('@') ? row[mapping.reference] : ''),
        phone: row[mapping.phone] || '',
        raw_row: row
      };
    });
  };

  const handleCompleteImport = async () => {
    if (!mapping.full_name || !mapping.student_id || !mapping.reference) {
      alert('Please assign all mandatory fields (Full Name, Student ID, Reference Person / Host).');
      return;
    }

    try {
      setImporting(true);
      const mapped = getMappedAttendees();

      let result = null;
      if (typeof onImportAttendees === 'function') {
        result = await onImportAttendees(mapped);
      } else if (eventId) {
        const payload = mapped.map(a => ({ ...a, event_id: eventId }));
        result = await bulkInsertAttendees(payload);
      } else {
        alert('Please save the event first before importing CSV attendees.');
        setImporting(false);
        return;
      }

      const importedCount = result?.data?.length ?? result?.length ?? mapped.length;
      const skippedCount = result?.skippedCount || 0;

      alert(`CSV Import Complete: ${importedCount} attendee records imported! (${skippedCount} duplicate records skipped)`);
      if (typeof onImportSuccess === 'function') onImportSuccess();
      onClose();
    } catch (err) {
      console.error('Import failed:', err);
      alert(`Import failed: ${err.message || 'Failed to import attendees.'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-0 flex flex-col max-h-[90vh] text-left">
        
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase italic tracking-tight">
                CSV Column Mapper & Live Preview
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Inspect Parsed Data Stream & Pair Column Headers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowTo(!showHowTo)}
              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <HelpCircle size={14} />
              <span>How-To Guide</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* HOW-TO GUIDE COLLAPSIBLE CARD */}
        {showHowTo && (
          <div className="p-5 bg-emerald-950/30 border-b border-emerald-500/20 text-xs text-emerald-200 space-y-2 font-mono">
            <h4 className="font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> How CSV Field Mapping & Live Preview Works
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
              <li><strong>Select File</strong>: Choose a CSV file containing participant names and details.</li>
              <li><strong>Pair Column Headers</strong>: Select headers matching <code>Full Name *</code>, <code>Student ID *</code>, and <code>Reference Person / Host *</code>.</li>
              <li><strong>Live Data Inspection</strong>: The live response table below automatically updates as headers are paired.</li>
            </ul>
          </div>
        )}

        {/* BODY STEP CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!csvFile ? (
            /* UPLOAD DROPZONE */
            <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-3xl p-10 text-center space-y-4 transition-all bg-slate-950/40">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                <Upload size={30} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Upload Attendee CSV File</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a CSV spreadsheet containing attendee names, IDs, emails, or reference codes.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all shadow-lg shadow-emerald-600/20">
                <FileSpreadsheet size={16} />
                <span>Browse Computer CSV</span>
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          ) : (
            /* LIVE MAPPER & DATA PREVIEW */
            <div className="space-y-5">
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center justify-between font-mono text-xs">
                <span className="font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>File Loaded: {csvFile.name}</span>
                </span>
                <span className="bg-slate-950 px-2.5 py-1 rounded text-[11px] font-bold">{parsedRows.length} Rows Detected</span>
              </div>

              {/* COLUMN HEADER MAPPER GRID */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers size={14} className="text-emerald-400" />
                    <span>Pair CSV Headers with Attendee Record Fields</span>
                  </h4>
                  <label className="text-[11px] font-semibold text-emerald-400 hover:underline cursor-pointer">
                    Change CSV File
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Full Name <span className="text-red-400">*</span></label>
                    <select
                      value={mapping.full_name}
                      onChange={(e) => setMapping({ ...mapping, full_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="">Select Header...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Student ID / Roll No <span className="text-red-400">*</span></label>
                    <select
                      value={mapping.student_id}
                      onChange={(e) => setMapping({ ...mapping, student_id: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="">Select Header...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Reference Person / Host <span className="text-red-400">*</span></label>
                    <select
                      value={mapping.reference}
                      onChange={(e) => setMapping({ ...mapping, reference: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="">Select Header...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">Email Address (Optional)</label>
                    <select
                      value={mapping.email}
                      onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="">Select Header...</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* LIVE MAPPED DATA PREVIEW TABLE */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Live Mapped Response Preview (Showing Sample Rows)
                </span>
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 max-h-48">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Mapped Full Name</th>
                        <th className="p-3">Mapped Student ID</th>
                        <th className="p-3">Mapped Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {getMappedAttendees().slice(0, 6).map((att, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-bold text-white">{att.full_name}</td>
                          <td className="p-3 text-purple-400">{att.student_id}</td>
                          <td className="p-3 text-emerald-400">{att.reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTION BUTTONS */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Close Preview
          </button>

          {csvFile && (
            <button
              onClick={handleCompleteImport}
              disabled={importing}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 uppercase tracking-wider"
            >
              <Check size={16} />
              <span>{importing ? 'Importing Attendees...' : `Import ${parsedRows.length} Attendees`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvFieldMapperModal;
