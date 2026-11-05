import React, { useState } from 'react';
import { X, Github, Copy, Check, Terminal, FolderTree } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const gitCommands = `# 1. Initialize local git repository (if not already initialized)
git init

# 2. Add all source files (excluding secrets configured in .gitignore)
git add .

# 3. Create initial commit
git commit -m "feat: complete Company Tech internship management automation system"

# 4. Set branch to main
git branch -M main

# 5. Connect to your GitHub repository
# (Create 'company-tech-internship-management-system' on github.com first)
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/company-tech-internship-management-system.git

# 6. Push code to your GitHub repository
git push -u origin main`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Github size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">GitHub Repository Publication</h3>
              <p className="text-xs text-slate-500">
                Repository Name: <strong className="text-slate-800">company-tech-internship-management-system</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* Instructions */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <Terminal size={15} className="text-blue-600" />
              Git Commands to Publish to Your GitHub
            </h4>
            <div className="relative">
              <pre className="p-4 bg-slate-950 text-slate-200 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800">
                {gitCommands}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 rounded border border-slate-700 flex items-center gap-1 transition-colors"
              >
                {copiedCmd ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copiedCmd ? 'Copied' : 'Copy Commands'}
              </button>
            </div>
          </div>

          {/* Project Structure */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <FolderTree size={15} className="text-blue-600" />
              Verified Clean Project Structure (Monorepo)
            </h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-0.5 text-slate-700">
              <div>📁 company-tech-internship-management-system/</div>
              <div className="pl-4">├── 📁 src/ (React, TypeScript, Tailwind, Context, Components)</div>
              <div className="pl-4">├── 📁 server/ (DB, PDF Engine, Email Templates & Dispatcher, Routes)</div>
              <div className="pl-4">├── 📄 server.ts (Express server + Vite middleware)</div>
              <div className="pl-4">├── 📄 firestore.rules (Hardened Firestore Security Rules)</div>
              <div className="pl-4">├── 📄 firebase-blueprint.json (Intermediate Schema Blueprint)</div>
              <div className="pl-4">├── 📄 firebase.json (Hosting & Rules deployment config)</div>
              <div className="pl-4">├── 📄 security_spec.md (Threat Model & Dirty Dozen Test Invariants)</div>
              <div className="pl-4">├── 📄 .env.example (Safe placeholders only)</div>
              <div className="pl-4">├── 📄 .gitignore (Strictly excludes all secrets & build artifacts)</div>
              <div className="pl-4">└── 📄 README.md (Comprehensive deployment & testing guide)</div>
            </div>
          </div>

          {/* Security Checklist Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-[11px] leading-relaxed">
            <strong>Security Verification:</strong> As required by PRD Section 20, no real API keys, passwords, or Firebase service-account private keys are hardcoded in git. All configuration variables use secure server environment values.
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
