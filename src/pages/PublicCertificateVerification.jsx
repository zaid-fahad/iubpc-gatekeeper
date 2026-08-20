import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyCertificate, fetchTemplateByEvent } from '../api';
import { generateCertificatePDF } from '../utils/certificateGenerator';
import { LoadingSpinner } from '../components';
import { 
  ShieldCheck, ShieldAlert, Award, Calendar, User, Download, 
  CheckCircle2, ExternalLink, RefreshCw, ArrowLeft, Sparkles 
} from 'lucide-react';

const PublicCertificateVerification = () => {
  const { certificateNumber } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const loadVerification = useCallback(async () => {
    if (!certificateNumber) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await verifyCertificate(certificateNumber);
      if (fetchErr || !data) {
        setError('Invalid Certificate ID or Certificate has been revoked.');
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
      pdfDoc.save(`${certData.certificate_number}_${certData.attendee?.full_name || 'Certificate'}.pdf`);
    } catch (err) {
      console.error('Download certificate error:', err);
      alert('Failed to render PDF certificate.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <LoadingSpinner />
        <p className="text-xs text-slate-400 font-mono mt-3">Verifying Certificate Authenticity...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* BRANDING HEADER */}
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <img src="/transparent_logo.webp" alt="IUBPC Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white uppercase italic">IUBPC Gatekeeper</h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Official Certificate Verification</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="text-xs text-slate-400 hover:text-white transition-all flex items-center gap-1 font-medium"
        >
          <span>Staff Login</span>
          <ExternalLink size={14} />
        </button>
      </header>

      {/* VERIFICATION DISPLAY CARD */}
      <main className="w-full max-w-2xl mx-auto my-8">
        {certData ? (
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
            {/* AMBIENT GLOW */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* STATUS BADGE */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-emerald-400">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>OFFICIALLY VERIFIED & AUTHENTIC</span>
            </div>

            {/* PARTICIPANT & EVENT INFORMATION */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Recipient Name
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {certData.attendee?.full_name}
                </h2>
                {certData.attendee?.student_id && (
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Student ID: <span className="text-purple-400 font-bold">{certData.attendee?.student_id}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Event Name
                  </span>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Award size={16} className="text-amber-400 shrink-0" />
                    <span>{certData.event?.title}</span>
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Certificate Number
                  </span>
                  <p className="text-sm font-mono font-bold text-emerald-400">
                    {certData.certificate_number}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 font-mono">
                <span>Issue Date: {certData.issue_date}</span>
                <span className="text-emerald-400 font-bold">Status: Active</span>
              </div>
            </div>

            {/* DOWNLOAD ACTION BUTTON */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 min-h-[48px]"
              >
                {downloading ? <LoadingSpinner /> : <Download size={18} />}
                <span>Download Official Verified PDF</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <ShieldAlert size={48} className="mx-auto text-red-500" />
            <div>
              <h2 className="text-xl font-bold text-white">Certificate Verification Failed</h2>
              <p className="text-xs text-slate-400 mt-1">{error}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
            >
              Go to Homepage
            </button>
          </div>
        )}
      </main>

      {/* FOOTER BRANDING */}
      <footer className="w-full max-w-3xl mx-auto text-center border-t border-slate-800/60 pt-4 text-slate-400 text-xs">
        <p className="font-mono text-[11px]">
          Independent University, Bangladesh (IUB) Programming Club — Gatekeeper Engine
        </p>
      </footer>
    </div>
  );
};

export default PublicCertificateVerification;
