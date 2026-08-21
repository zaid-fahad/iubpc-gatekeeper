import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyCertificate, fetchTemplateByEvent } from '../api';
import { generateCertificatePDF } from '../utils/certificateGenerator';
import { LoadingSpinner } from '../components';
import { 
  ShieldCheck, ShieldAlert, Award, Calendar, Download, 
  CheckCircle2, RefreshCw, Copy, Check, Search, ArrowRight
} from 'lucide-react';

const PublicCertificateVerification = () => {
  const { certificateNumber } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [certData, setCertData] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchCertInput, setSearchCertInput] = useState('');

  const loadVerification = useCallback(async () => {
    if (!certificateNumber) {
      setCertData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await verifyCertificate(certificateNumber);
      if (fetchErr || !data) {
        setError('Invalid Certificate ID or Certificate record has been revoked.');
        setCertData(null);
      } else {
        setCertData(data);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Certificate verification request failed.');
    } finally {
      setLoading(false);
    }
  }, [certificateNumber]);

  useEffect(() => {
    loadVerification();
  }, [loadVerification]);

  // Handle Download Verified PDF
  const handleDownloadPDF = async () => {
    if (!certData) return;
    try {
      setDownloading(true);
      const { data: template } = await fetchTemplateByEvent(certData.event_id);
      const pdfDoc = await generateCertificatePDF({
        template,
        attendee: certData.attendee,
        event: certData.event,
        certNumber: certData.certificate_number
      });
      pdfDoc.save(`${certData.certificate_number}_${(certData.attendee?.full_name || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (err) {
      console.error('Download certificate error:', err);
      alert('Failed to render PDF certificate.');
    } finally {
      setDownloading(false);
    }
  };

  // Copy Verification Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Search Another Certificate Form Handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchCertInput.trim()) return;
    navigate(`/verify/${searchCertInput.trim().toUpperCase()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <LoadingSpinner />
        <p className="text-xs text-slate-400 font-mono">Verifying Certificate Authenticity...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* BRANDING HEADER (WITHOUT LOGIN BUTTON) */}
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 p-1.5 flex items-center justify-center">
            <img src="/transparent_logo.webp" alt="IUBPC Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>IUBPC Gatekeeper</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verification Portal
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Independent University, Bangladesh Programming Club</p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="w-full max-w-2xl mx-auto my-8">
        {!certificateNumber ? (
          /* MAIN VERIFICATION INPUT PAGE (/verify) */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 space-y-6 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center shadow-lg">
              <ShieldCheck size={28} />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-white tracking-tight">Verify Certificate Authenticity</h2>
              <p className="text-xs text-slate-400">
                Enter an official Certificate ID below to verify recipient authenticity and download the issued PDF.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto space-y-3 pt-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={searchCertInput}
                  onChange={(e) => setSearchCertInput(e.target.value)}
                  placeholder="Enter Certificate ID (e.g. CERT-2026-X8A2)..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3.5 pl-10 text-xs text-white outline-none font-mono placeholder:text-slate-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md min-h-[44px]"
              >
                <span>Verify Certificate</span>
                <ArrowRight size={15} />
              </button>
            </form>
          </div>
        ) : certData ? (
          /* VERIFICATION RESULT PAGE (/verify/:id) */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            {/* STATUS BADGE HEADER */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Verified & Authentic Record
                </span>
              </div>

              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Share Link'}</span>
              </button>
            </div>

            {/* RECIPIENT & DETAILS CARD */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 sm:p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Certificate Recipient
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {certData.attendee?.full_name || 'Verified Recipient'}
                </h2>
                {certData.attendee?.student_id && (
                  <p className="text-xs text-slate-400 font-mono">
                    Student ID: <span className="text-slate-200 font-semibold">{certData.attendee?.student_id}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Event Title
                  </span>
                  <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Award size={15} className="text-purple-400 shrink-0" />
                    <span>{certData.event?.title || 'Official Event'}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Certificate Number
                  </span>
                  <p className="text-xs font-mono font-bold text-purple-400">
                    {certData.certificate_number}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Issue Date
                  </span>
                  <p className="text-slate-300 font-mono">{certData.issue_date || 'N/A'}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Issuing Authority
                  </span>
                  <p className="text-slate-300 font-medium">IUBPC Gatekeeper Engine</p>
                </div>
              </div>
            </div>

            {/* DOWNLOAD PDF ACTION */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/verify')}
                className="py-3 px-4 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all min-h-[44px]"
              >
                Verify Another ID
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex-1 py-3 px-5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 min-h-[44px]"
              >
                {downloading ? <RefreshCw className="animate-spin" size={15} /> : <Download size={15} />}
                <span>{downloading ? 'Rendering PDF...' : 'Download Official Certificate PDF'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* NOT FOUND CARD */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Certificate Not Found</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">{error || 'The certificate ID provided could not be found in our records.'}</p>
            </div>

            <form onSubmit={handleSearchSubmit} className="max-w-xs mx-auto flex items-center gap-2 pt-2">
              <input
                type="text"
                value={searchCertInput}
                onChange={(e) => setSearchCertInput(e.target.value)}
                placeholder="Enter Certificate ID..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-2.5 text-xs text-white outline-none font-mono"
              />
              <button
                type="submit"
                className="px-3 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs transition-all"
              >
                <Search size={14} />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-3xl mx-auto text-center border-t border-slate-800/60 pt-4 text-slate-500 text-[11px] font-mono">
        Official Cryptographic Verification System • IUB Programming Club
      </footer>
    </div>
  );
};

export default PublicCertificateVerification;
