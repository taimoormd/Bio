import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { CitationReport } from '../../engines/provenance/citationCompiler';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CitationReport | null;
}

export const CitationModal: React.FC<CitationModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Manuscript Citations & Provenance
              </h2>
              <p className="text-xs text-slate-500">
                Scientific attribution statement for publication & posters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Formatted Citation Block */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-800 flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Formatted Acknowledgment Text</span>
              </span>
              <span className="text-[10px] text-slate-400">Markdown Format</span>
            </div>

            <div className="relative">
              <textarea
                readOnly
                rows={5}
                value={report.markdown}
                className="w-full font-mono text-[11px] p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 resize-none focus:outline-hidden"
              />
              <button
                onClick={handleCopy}
                className={`absolute right-2.5 top-2.5 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all shadow-xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Detected Figures / Assets Breakdown */}
          <div>
            <span className="font-semibold text-slate-800 block mb-2">
              Detected Canvas Assets ({report.items.length})
            </span>

            {report.items.length === 0 ? (
              <p className="text-slate-500 italic">No scientific assets detected on canvas.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {report.items.map((item) => (
                  <div
                    key={item.name}
                    className="p-2 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-slate-900">{item.name}</span>
                      <span className="text-slate-500 text-[10px] ml-2">
                        by {item.creator}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100/80 text-sky-800">
                        {item.spdx}
                      </span>
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-sky-600"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Paste into your manuscript Acknowledgments section or poster footer.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
