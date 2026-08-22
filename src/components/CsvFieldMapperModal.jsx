import React, { useState } from 'react';
import Papa from 'papaparse';
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, 
  HelpCircle, ArrowRight, X, Table, Check, Layers
} from 'lucide-react';

const CsvFieldMapperModal = ({ isOpen, onClose, onImportAttendees }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Fields, 3: Preview
  const [csvFile, setCsvFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [showHowTo, setShowHowTo] = useState(false);

  // Field Mapping State
  const [mapping, setMapping] = useState({
    full_name: '',
    student_id: '',
    reference: '',
    category: '',
    phone: ''
  });

  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
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
          const autoMap = { full_name: '', student_id: '', reference: '', category: '', phone: '' };
          fields.forEach((h) => {
            const lower = h.toLowerCase();
            if (lower.includes('name') && !autoMap.full_name) autoMap.full_name = h;
            else if ((lower.includes('student') || lower.includes('id') || lower.includes('roll')) && !autoMap.student_id) autoMap.student_id = h;
            else if ((lower.includes('email') || lower.includes('ref') || lower.includes('phone') || lower.includes('contact')) && !autoMap.reference) autoMap.reference = h;
            else if (lower.includes('category') || lower.includes('type')) autoMap.category = h;
            else if (lower.includes('phone') || lower.includes('mobile')) autoMap.phone = h;
          });

          setMapping(autoMap);
          setStep(2);
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
      const nameVal = row[mapping.full_name] || `Participant ${idx + 1}`;
      const studentIdVal = row[mapping.student_id] || `ID-${Math.floor(1000 + Math.random() * 9000)}`;
      const refVal = row[mapping.reference] || row[mapping.phone] || `REF-${Math.floor(1000 + Math.random() * 9000)}`;
      const catVal = row[mapping.category] || 'Participant';

      return {
        full_name: nameVal,
        student_id: studentIdVal,
        reference: refVal,
        category: catVal,
        email: row[mapping.reference]?.includes('@') ? row[mapping.reference] : '',
        phone: row[mapping.phone] || '',
        raw_row: row
      };
    });
  };

  const handleCompleteImport = async () => {
    if (!mapping.full_name || !mapping.student_id || !mapping.reference) {
      alert('Please assign all mandatory fields (Full Name, Student ID, Reference/Email).');
      return;
    }

    try {
      setImporting(true);
      const mapped = getMappedAttendees();
      await onImportAttendees(mapped);
      onClose();
    } catch (err) {
      console.error('Import failed:', err);
      alert('Failed to import attendees.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase italic tracking-tight">
                CSV Column Mapping Wizard
              </h3>
              <p className="text-xs text-slate-400">
                Step {step} of 3 • Map CSV column headers to mandatory attendee fields
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowTo(!showHowTo)}
              className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
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
          <div className="p-5 bg-purple-950/30 border-b border-purple-500/20 text-xs text-purple-200 space-y-2 font-mono">
            <h4 className="font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> How CSV Field Mapping Works
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
              <li><strong>Step 1: Upload CSV</strong> — Select your .csv registration or participant file.</li>
              <li><strong>Step 2: Map Mandatory Fields</strong> — You MUST map 3 key columns: <em>Full Name</em>, <em>Student ID</em>, and <em>Reference / Email</em>.</li>
              <li><strong>Step 3: Preview & Confirm</strong> — Verify mapped rows before saving to the database.</li>
            </ul>
          </div>
        )}

        {/* BODY STEP CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {step === 1 && (
            /* STEP 1: FILE UPLOAD */
            <div className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-3xl p-10 text-center space-y-4 transition-all bg-slate-950/40">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center shadow-lg">
                <Upload size={30} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Upload Attendee CSV File</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a CSV spreadsheet containing attendee names, IDs, emails, or reference codes.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all shadow-lg shadow-purple-600/20">
                <FileSpreadsheet size={16} />
                <span>Browse Computer CSV</span>
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          )}

          {step === 2 && (
            /* STEP 2: FIELD MAPPING */
            <div className="space-y-5">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Uploaded File: <strong className="text-white">{csvFile?.name}</strong></span>
                <span className="text-purple-400 font-bold font-mono">{parsedRows.length} Rows Detected</span>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Mandatory Field Assignments (Required)
                </h4>

                {/* Name Mapping */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">1. Full Name Column *</span>
                    <span className="text-amber-400 text-[10px] font-bold uppercase">Mandatory</span>
                  </div>
                  <select
                    value={mapping.full_name}
                    onChange={(e) => setMapping({ ...mapping, full_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="">-- Select CSV Header for Name --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Student ID Mapping */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">2. Student ID / Roll Column *</span>
                    <span className="text-amber-400 text-[10px] font-bold uppercase">Mandatory</span>
                  </div>
                  <select
                    value={mapping.student_id}
                    onChange={(e) => setMapping({ ...mapping, student_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="">-- Select CSV Header for Student ID --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Reference / Email Mapping */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">3. Reference / Email / Phone Column *</span>
                    <span className="text-amber-400 text-[10px] font-bold uppercase">Mandatory</span>
                  </div>
                  <select
                    value={mapping.reference}
                    onChange={(e) => setMapping({ ...mapping, reference: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="">-- Select CSV Header for Reference/Email --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            /* STEP 3: PREVIEW */
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Import Preview ({parsedRows.length} Attendees)
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Mapped Full Name</th>
                      <th className="p-3">Mapped Student ID</th>
                      <th className="p-3">Mapped Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                    {getMappedAttendees().slice(0, 8).map((att, idx) => (
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
          )}
        </div>

        {/* FOOTER ACTION BUTTONS */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Back
            </button>
          ) : <div />}

          {step === 2 && (
            <button
              onClick={() => {
                if (!mapping.full_name || !mapping.student_id || !mapping.reference) {
                  alert('Please select mandatory fields.');
                  return;
                }
                setStep(3);
              }}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              <span>Preview Import</span>
              <ArrowRight size={14} />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleCompleteImport}
              disabled={importing}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
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
