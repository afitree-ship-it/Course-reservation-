/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  HelpCircle, 
  Sparkles, 
  Lock, 
  FileText, 
  Search, 
  CheckCircle, 
  ArrowRight,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';

import FormSection from './components/FormSection';
import StatusCheckSection from './components/StatusCheckSection';
import AdminSection from './components/AdminSection';
import ToastContainer, { ToastMessage, ToastType } from './components/Toast';
import { isApiConfigured, isGoogleSheetUrlInstead } from './services/api';
import { ReservationRequest } from './types';
import { useTranslation } from './contexts/LanguageContext';

export default function App() {
  const { language, setLanguage, t, isTh } = useTranslation();
  const [activeTab, setActiveTab] = useState<'reserve' | 'status' | 'admin'>('reserve');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Transition states for post-submission success view
  const [latestSubmission, setLatestSubmission] = useState<{ studentId: string; request: ReservationRequest } | null>(null);
  
  // Back-and-forth query sharing state
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Toast utility helper
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + '-' + Math.random().toString().substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Switcher to Status Check with student ID automatically loaded & searched
  const handleViewStatusAfterSubmit = (studentId: string) => {
    setSelectedStudentId(studentId);
    setLatestSubmission(null); // Clear success screen
    setActiveTab('status');
  };

  const handleFormSubmitSuccess = (studentId: string, request: ReservationRequest) => {
    setLatestSubmission({ studentId, request });
  };

  const hasGASUrl = isApiConfigured();
  const hasSheetUrlConflict = isGoogleSheetUrlInstead();

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col justify-between font-sans antialiased">
      {/* Dynamic Demo Warning Banner */}
      {hasSheetUrlConflict ? (
        <div className="bg-rose-600 text-white font-sans text-xs px-4 py-2 text-center flex items-center justify-center gap-2 font-medium shadow-md transition-all duration-300 z-40 animate-bounce">
          <Database className="w-4 h-4 text-white shrink-0 animate-pulse" />
          <span>⚠️ ตรวจพบว่าคุณวาง "ลิงก์ Google Sheets" แทน "ลิงก์ Web App (Google Apps Script)"! ระบบจึงไม่สามารถเชื่อมต่อกันได้อัตโนมัติ กรุณาเข้าสู่ระบบฝ่ายเจ้าหน้าที่เพื่อแก้ไขให้ถูกต้อง!</span>
        </div>
      ) : !hasGASUrl && (
        <div className="bg-amber-500 text-white font-sans text-xs px-4 py-2 text-center flex items-center justify-center gap-2 font-medium shadow-sm transition-all duration-300 z-40">
          <Database className="w-4 h-4 text-white shrink-0 animate-pulse" />
          <span>{t('demoModeWarn')}</span>
          <span className="hidden md:inline-block opacity-75">| {t('demoModeReal')}</span>
        </div>
      )}

      {/* Primary Header */}
      <header className="bg-mangosteen/95 backdrop-blur-md text-white sticky top-0 z-30 shadow-lg border-b border-mangosteen-dark/20">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo & title click resets or targets reserve page */}
          <div 
            onClick={() => {
              setLatestSubmission(null);
              setActiveTab('reserve');
            }}
            className="flex items-center gap-3 cursor-pointer group select-none"
            id="brand-header-logo"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-mangosteen font-bold text-xl shadow-md transition-transform transform group-hover:scale-105">
              Sci
            </div>
            <div>
              <h1 className="text-md sm:text-lg font-bold font-sans tracking-tight text-white flex items-center gap-1.5 leading-tight">
                {t('systemTitle')}
                <span className="text-[10px] font-bold text-white bg-white/20 border border-white/30 px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                  FST
                </span>
              </h1>
              <p className="text-[10px] font-semibold text-white/70 font-sans tracking-wide uppercase">
                {t('fstSubtitle')}
              </p>
            </div>
          </div>

          {/* Navigation Control Group */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 self-stretch sm:self-auto justify-between sm:justify-end">
            {/* Regular Student Toggle Tabs */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10" id="student-navigation-tabs">
              <button
                onClick={() => {
                  setLatestSubmission(null);
                  setActiveTab('reserve');
                }}
                className={`py-2 px-3 sm:py-2 sm:px-4 text-xs font-semibold font-sans rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'reserve'
                    ? 'bg-white text-mangosteen shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                id="tab-btn-reserve"
              >
                <FileText className="w-3.5 h-3.5" />
                {t('tabReserve')}
              </button>
              <button
                onClick={() => {
                  setLatestSubmission(null);
                  setActiveTab('status');
                }}
                className={`py-2 px-3 sm:py-2 sm:px-4 text-xs font-semibold font-sans rounded-lg transition-all flex items-center gap-2 cursor-pointer relative group ${
                  activeTab === 'status'
                    ? 'bg-white text-mangosteen shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                id="tab-btn-status"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t('tabStatus')}</span>
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>
            </div>

            {/* Academic-Standard Lang Toggle Switching Button Group */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-white text-xs font-bold" id="language-switcher-group">
              <button
                onClick={() => setLanguage('th')}
                className={`px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-sans tracking-wider cursor-pointer ${
                  language === 'th' 
                    ? 'bg-white text-mangosteen shadow-xs font-extrabold' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                title="ภาษาไทย"
                id="lang-btn-th"
              >
                TH
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1.5 rounded-lg transition-all text-[11px] font-sans tracking-wider cursor-pointer ${
                  language === 'en' 
                    ? 'bg-white text-mangosteen shadow-xs font-extrabold' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                title="English Language"
                id="lang-btn-en"
              >
                EN
              </button>
            </div>

            {/* Subtly Separated staff login trigger */}
            <div className="hidden sm:block">
              <button
                onClick={() => {
                  setLatestSubmission(null);
                  setActiveTab('admin');
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold font-sans flex items-center gap-1.5 transition-all cursor-pointer border ${
                  activeTab === 'admin'
                    ? 'bg-white text-mangosteen border-white shadow-md'
                    : 'text-white/80 border-white/30 hover:bg-white hover:text-mangosteen'
                }`}
                id="btn-trigger-staff-admin"
                title="สำหรับเจ้าหน้าที่คณะเท่านั้น"
              >
                <Lock className="w-3.5 h-3.5" />
                {t('tabAdmin')}
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-start">
        
        <AnimatePresence mode="wait">
          
          {/* POST-SUBMISSION DETAILED SUCCESS LANDING CARD */}
          {latestSubmission ? (
            <motion.div
              key="submit-success-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-100/90 shadow-2xl space-y-6 text-center"
              id="form-submission-success-page"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-100 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('successProjectDone')}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-800 font-sans tracking-tight">
                  {t('successSubmitted')}
                </h3>
              </div>

              {/* Box Details Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-3 font-sans">
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>{t('successRef')}</span>
                  <strong className="font-mono text-slate-700 font-bold">{latestSubmission.request.id}</strong>
                </div>
                <div className="border-t border-slate-200/50 pt-2.5 space-y-1.5 text-xs text-slate-600">
                  <p>• <strong>{t('successApplicant')}</strong> {latestSubmission.request.fullName} (รหัส {latestSubmission.request.studentId})</p>
                  <p>• <strong>{t('successCourse')}</strong> {latestSubmission.request.courseCode} - {latestSubmission.request.courseName}</p>
                  <p>• <strong>{t('successSec')}</strong> {isTh ? `เซกชัน ${latestSubmission.request.section}` : `Section ${latestSubmission.request.section}`} ({isTh ? `อาจารย์ ${latestSubmission.request.instructor}` : `Instructor: ${latestSubmission.request.instructor}`})</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed max-w-md mx-auto">
                  {t('successDetail')}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setLatestSubmission(null)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 font-sans font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                    id="btn-return-submit-again"
                  >
                    {t('successSubmitAnother')}
                  </button>
                  <button
                    onClick={() => handleViewStatusAfterSubmit(latestSubmission.studentId)}
                    className="flex-1 py-3 bg-mangosteen hover:bg-mangosteen-hover text-white font-sans font-semibold rounded-xl text-sm shadow-md shadow-mangosteen/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    id="btn-go-check-status-direct"
                  >
                    {t('successGoStatus')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* --- SECTION 1: ENROLLMENT REGISTRATION FORM --- */}
              {activeTab === 'reserve' && (
                <FormSection 
                  onSuccess={handleFormSubmitSuccess}
                  showToast={showToast}
                />
              )}

              {/* --- SECTION 2: CHECK SUBMISSION STATUS --- */}
              {activeTab === 'status' && (
                <StatusCheckSection 
                  initialStudentId={selectedStudentId}
                  showToast={showToast}
                />
              )}

              {/* --- SECTION 3: STAFF / ADMINISTRATIVE VIEW --- */}
              {activeTab === 'admin' && (
                <AdminSection 
                  isInitiallyLoggedIn={isAdminLoggedIn}
                  onLoginSuccess={() => setIsAdminLoggedIn(true)}
                  onLogout={() => {
                    setIsAdminLoggedIn(false);
                    showToast(t('logoutAdmin'), 'info');
                    setActiveTab('reserve');
                  }}
                  showToast={showToast}
                />
              )}
            </>
          )}

        </AnimatePresence>

      </main>

      {/* Footer bar hosting responsive links */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <p>
            {t('copyright')}
          </p>
          
          {/* Subtle mobile admin trigger links */}
          <div className="sm:hidden flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <span>{t('forAdmin')}</span>
            <button
              onClick={() => {
                setLatestSubmission(null);
                setActiveTab('admin');
              }}
              className="text-mangosteen font-semibold hover:underline bg-mangosteen/5 py-1 px-2.5 rounded-full inline-flex items-center gap-1 transition-colors cursor-pointer"
              id="footer-staff-trigger"
            >
              <Lock className="w-3 h-3" />
              {t('adminLogin')}
            </button>
          </div>
        </div>
      </footer>

      {/* Embedded Global Toast Containers */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
