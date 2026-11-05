import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, Eye, Code } from 'lucide-react';
import { API } from '../services/api';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  emailType: string;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  emailType,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    subject: string;
    recipient: string;
    html: string;
    text: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && applicationId && emailType) {
      setLoading(true);
      setError(null);
      API.getEmailPreview(applicationId, emailType)
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load preview');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, applicationId, emailType]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(viewMode === 'html' ? data.html : data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Mail size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Automated Transactional Email Preview</h3>
              <p className="text-[11px] text-slate-500">Live rendered template with candidate values</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-500">Rendering email template...</p>
            </div>
          ) : error || !data ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-center">
              {error || 'Could not render email.'}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Envelope Metadata */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-slate-700 font-mono text-[11px]">
                <div>
                  <strong className="font-sans text-slate-500">To: </strong>
                  <span>{data.recipient}</span>
                </div>
                <div>
                  <strong className="font-sans text-slate-500">From: </strong>
                  <span>Company Tech &lt;admissions@companytech.internal&gt;</span>
                </div>
                <div>
                  <strong className="font-sans text-slate-500">Subject: </strong>
                  <span className="font-semibold text-slate-900">{data.subject}</span>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-md">
                  <button
                    onClick={() => setViewMode('html')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                      viewMode === 'html' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    <Eye size={12} /> Rendered HTML
                  </button>
                  <button
                    onClick={() => setViewMode('text')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                      viewMode === 'text' ? 'bg-white shadow-xs font-semibold text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    <Code size={12} /> Plain Text
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy Content'}
                </button>
              </div>

              {/* Email Body Preview */}
              {viewMode === 'html' ? (
                <div
                  className="border border-slate-200 rounded-lg p-2 bg-slate-50 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: data.html }}
                />
              ) : (
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed whitespace-pre-wrap">
                  {data.text}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
