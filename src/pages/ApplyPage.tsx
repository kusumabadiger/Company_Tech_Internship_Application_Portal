import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, Navigate, useLocation } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowLeft, X, Sparkles } from 'lucide-react';
import { INTERNSHIP_ROLES, PURSUING_YEARS, InternshipRole, PursuingYear, ExperienceLevel } from '../types';
import { API } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { firebaseUser } = useAuth();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [pursuingYear, setPursuingYear] = useState<PursuingYear>('3rd Year');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Fresher');
  const [internshipRole, setInternshipRole] = useState<InternshipRole>('Frontend Developer');

  // Resume File State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeBase64, setResumeBase64] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValidEmail = (value: string) => /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim());

  // Pre-fill role from URL query param if present
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && (INTERNSHIP_ROLES as readonly string[]).includes(roleParam)) {
      setInternshipRole(roleParam as InternshipRole);
    }
  }, [searchParams]);

  useEffect(() => {
    if (firebaseUser?.email) {
      setEmail(firebaseUser.email);
    }
  }, [firebaseUser]);

  if (!firebaseUser) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{
          returnTo: `${location.pathname}${location.search}`,
          message: 'Please sign in or create an account to apply for this internship.',
        }}
      />
    );
  }

  if (!firebaseUser.emailVerified) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{
          returnTo: `${location.pathname}${location.search}`,
          message: 'Please verify your email before continuing with your application.',
        }}
      />
    );
  }

  // Handle File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setResumeError('Resume file size must be less than 5 MB.');
      return;
    }

    // Validate type (.pdf, .docx, .doc)
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
      setResumeError('Only PDF and DOCX documents are accepted.');
      return;
    }

    setResumeFile(file);

    // Read as Base64 for upload
    const reader = new FileReader();
    reader.onload = () => {
      setResumeBase64(reader.result as string);
    };
    reader.onerror = () => {
      setResumeError('Failed to read resume file. Please select again.');
    };
    reader.readAsDataURL(file);
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeBase64(null);
    setResumeError(null);
  };

  // Submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!fullName.trim() || fullName.trim().length > 100) {
      setErrorMessage('Please provide a valid full name (max 100 characters).');
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!college.trim() || college.trim().length > 150) {
      setErrorMessage('Please provide your college or institution name (max 150 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await API.submitApplication({
        fullName: fullName.trim(),
        email: email.trim(),
        college: college.trim(),
        pursuingYear,
        experienceLevel,
        internshipRole,
        resumeBase64,
        resumeName: resumeFile ? resumeFile.name : null,
      });

      // Navigate to confirmation screen with details
      navigate('/application-confirmation', {
        state: {
          applicationId: response.applicationId,
          trackingToken: response.trackingToken,
          internshipRole: response.internshipRole,
          status: response.status,
          submittedAt: response.submittedAt,
          fullName: fullName.trim(),
          email: email.trim(),
        },
      });
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred while submitting.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Form Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={14} />
            <span>Company Tech Internship Application</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Apply for Internship
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Please fill in your authentic academic and professional details. You will receive a unique Application ID and secret tracking token upon submission.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-semibold">Submission Warning:</span> {errorMessage}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Section 1: Candidate Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              1. Candidate Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Alex Johnson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  maxLength={120}
                  placeholder="name@example.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Submission confirmation and offer updates will be delivered here.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Background */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              2. Academic & Experience Particulars
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  College / Institution Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. National Institute of Technology"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Year of Study <span className="text-rose-500">*</span>
                </label>
                <select
                  value={pursuingYear}
                  onChange={(e) => setPursuingYear(e.target.value as PursuingYear)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white transition-all"
                >
                  {PURSUING_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Experience Level: Exactly 2 options per PRD Section 6.2 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Experience Level <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {(['Fresher', 'Experienced'] as ExperienceLevel[]).map((level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => setExperienceLevel(level)}
                    className={`py-2.5 px-4 rounded-lg border text-xs font-medium text-center transition-all ${
                      experienceLevel === level
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Role Selection (12 options) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              3. Role Selection
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Internship Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={internshipRole}
                onChange={(e) => setInternshipRole(e.target.value as InternshipRole)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white transition-all font-medium"
              >
                {INTERNSHIP_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 4: Resume Upload (Optional, PDF/DOCX <= 5MB) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                4. Resume / CV (Optional)
              </h3>
              <span className="text-[11px] text-slate-400">Max 5 MB • PDF or DOCX</span>
            </div>

            {resumeFile ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                      {resumeFile.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for secure transmission
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeResume}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-200 transition-colors"
                  title="Remove File"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <UploadCloud size={28} className="text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                <span className="text-xs font-semibold text-slate-700">
                  Click to select a resume or drag file here
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Supported formats: PDF, DOCX (Max 5 MB)
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            {resumeError && (
              <p className="text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle size={13} />
                {resumeError}
              </p>
            )}
          </div>

          {/* Submission Button & Lock */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 text-center sm:text-left">
              By submitting, your application will be securely persisted and assigned a verifiable tracking token.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
