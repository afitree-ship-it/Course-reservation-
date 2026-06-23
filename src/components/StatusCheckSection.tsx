/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  BookOpen, 
  Calendar, 
  User, 
  ArrowRight, 
  AlertCircle,
  Hash,
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import { ReservationRequest, RequestStatus } from '../types';
import { getStatusByStudentId } from '../services/api';

interface StatusCheckSectionProps {
  initialStudentId?: string;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function StatusCheckSection({ initialStudentId = '', showToast }: StatusCheckSectionProps) {
  const [studentId, setStudentId] = useState(initialStudentId);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<ReservationRequest[]>([]);

  // Automatically fetch if initialized with a studentId
  useEffect(() => {
    if (initialStudentId) {
      setStudentId(initialStudentId);
      performSearch(initialStudentId);
    }
  }, [initialStudentId]);

  const performSearch = async (targetId: string) => {
    if (!targetId.trim()) {
      showToast('กรุณากรอกรหัสนักศึกษาเพื่อใช้ตรวจสอบสถานะ', 'warning');
      return;
    }
    
    if (!/^\d{9}$/.test(targetId.trim())) {
      showToast('รหัสนักศึกษาต้องประกอบด้วยตัวเลข 9 หลักเท่านั้น', 'warning');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await getStatusByStudentId(targetId.trim());
      if (response.success) {
        setResults(response.data);
        if (response.data.length > 0) {
          showToast(`พบคำร้องจำนวน ${response.data.length} รายการสำหรับนักศึกษานี้`, 'success');
        } else {
          showToast('ไม่พบข้อมูลคำร้องของรหัสนักศึกษานี้', 'info');
        }
      } else {
        showToast(response.error || 'ไม่สามารถดึงข้อมูลได้สำเร็จ', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการตรวจสอบสถานะ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(studentId);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' น.';
    } catch (e) {
      return isoString;
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'รอดำเนินการ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            รอดำเนินการ
          </span>
        );
      case 'อนุมัติแล้ว':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fade-in">
            <CheckCircle className="w-3.5 h-3.5" />
            อนุมัติแล้ว
          </span>
        );
      case 'ไม่อนุมัติ':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            ไม่อนุมัติ
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto space-y-6"
      id="status-check-container"
    >
      {/* Search Header card */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 border border-slate-200 flex flex-col gap-3.5 sm:gap-5">
        <div className="text-center md:text-left">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="w-1.5 h-6 bg-mangosteen rounded-full"></div>
            <h2 className="text-xl font-extrabold tracking-tight text-mangosteen font-sans underline decoration-2 underline-offset-8">
              ตรวจสอบสถานะคำร้อง
            </h2>
          </div>
          <p className="text-slate-500 text-xs font-sans">
            กรอกรหัสนักศึกษา 9 หลักของคุณด้านล่าง เพื่อเรียกดูประวัติและติดตามผลการจัดสิทธิ์จากเจ้าหน้าที่โดยตรง
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3" id="student-search-form">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              pattern="\d*"
              maxLength={9}
              placeholder="รหัสนักศึกษา 9 หลัก (เช่น 650109121)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm font-sans tracking-wide transition-all focus:outline-hidden focus:border-mangosteen focus:ring-1 focus:ring-mangosteen"
              id="search-student-id"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-mangosteen hover:bg-mangosteen-hover active:scale-[0.98] text-white rounded-lg text-sm font-semibold tracking-wide font-sans shadow-sm flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer"
            id="btn-trigger-search"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            ค้นหาคำร้อง
          </button>
        </form>
      </div>

      {/* Results / Skeletons Grid */}
      <div id="status-results-panel">
        {loading ? (
          /* Skeletons */
          <div className="space-y-4">
            {[1, 2].map(n => (
              <div key={n} className="bg-white rounded-xl p-5 border border-slate-100 animate-pulse space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
                    <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                  </div>
                  <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                </div>
                <div className="border-t border-slate-100 pt-3 flex gap-4">
                  <div className="h-3 bg-slate-150 rounded-md w-1/5"></div>
                  <div className="h-3 bg-slate-150 rounded-md w-1/5"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {hasSearched && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 sm:space-y-4"
              >
                {results.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-xs font-semibold text-slate-500 font-sans">
                        พบคำร้องทั้งหมด {results.length} รายการ
                      </span>
                    </div>

                    {results.map((request, idx) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200/80 hover:border-mangosteen/20 transition-all relative overflow-hidden animate-fade-in"
                        id={`request-status-card-${request.id}`}
                      >
                        {/* Status bar top */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                          request.status === 'รอดำเนินการ' 
                            ? 'bg-amber-400' 
                            : request.status === 'อนุมัติแล้ว' 
                              ? 'bg-emerald-500' 
                              : 'bg-rose-500'
                        }`}></div>

                        <div className="pt-2">
                          {/* Student & Tracking Header */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4 mb-3 sm:mb-4">
                            <div className="space-y-1.5">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 bg-slate-100 font-mono">
                                <Hash className="w-3 h-3 text-slate-400" />
                                Tracking ID: {request.id}
                              </span>
                              
                              {/* Highlight Student ID */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-mangosteen to-mangosteen-hover text-white text-xs font-extrabold rounded-lg font-mono shadow-xs">
                                  <User className="w-3.5 h-3.5" />
                                  รหัสนักศึกษา: {request.studentId}
                                </span>
                                <span className="text-sm font-bold text-slate-800 font-sans">
                                  คุณ{request.fullName} (ชั้นปีที่ {request.year})
                                </span>
                              </div>
                            </div>
                            
                            {/* Highlight Approval Status */}
                            <div className="shrink-0 self-start md:self-center">
                              {getStatusBadge(request.status)}
                            </div>
                          </div>

                          {/* Highlight Course Code, Name, Section, Instructor */}
                          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                            <div className="text-xs font-bold text-slate-400 font-sans tracking-wide uppercase flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 text-mangosteen" />
                              ข้อมูลวิชาเรียนที่ยื่นคำร้องสำรองที่นั่ง
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {((request.courses && request.courses.length > 0) ? request.courses : [{
                                courseCode: request.courseCode || '',
                                courseName: request.courseName || '',
                                section: request.section || '',
                                instructor: request.instructor || ''
                              }]).map((course, cIdx) => (
                                <div 
                                  key={cIdx} 
                                  className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 hover:border-slate-350 transition-colors space-y-3"
                                >
                                  {/* Code & Name Header */}
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-extrabold text-white bg-slate-800 px-2.5 py-1 rounded-md font-mono tracking-wide shadow-xs shrink-0">
                                          {course.courseCode}
                                        </span>
                                        <span className="text-xs font-bold text-slate-800 font-sans leading-snug">
                                          {course.courseName}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Section & Instructor highlight */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs font-sans">
                                    <div className="flex items-center gap-2 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-100">
                                      <span className="text-slate-400 font-semibold font-sans text-[11px] sm:text-xs">กลุ่มเรียน (Section):</span>
                                      <strong className="text-mangosteen font-extrabold text-xs sm:text-sm font-mono">{course.section}</strong>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-100">
                                      <span className="text-slate-400 font-semibold font-sans text-[11px] sm:text-xs">อาจารย์ผู้สอน:</span>
                                      <strong className="text-slate-700 font-bold max-w-[150px] truncate text-xs sm:text-sm">{course.instructor || 'ไม่ระบุผู้สอน'}</strong>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Request Meta details */}
                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-sans pt-1 border-t border-slate-100 mt-3 sm:mt-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>ยื่นเมื่อ: {formatDate(request.createdAt)}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {request.department}
                            </div>
                          </div>

                          {/* Unified visual display for Admin Notes & Remarks (กรณีจะแจ้งให้คนส่งคำร้องได้รู้) */}
                          {request.rejectionReason && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl flex gap-2.5 sm:gap-3 text-xs font-sans leading-relaxed border ${
                                request.status === 'อนุมัติแล้ว'
                                  ? 'bg-emerald-50/90 text-emerald-900 border-emerald-100'
                                  : request.status === 'ไม่อนุมัติ'
                                    ? 'bg-rose-50/90 text-rose-900 border-rose-100'
                                    : 'bg-amber-50/90 text-amber-900 border-amber-100'
                              }`}
                            >
                              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                                request.status === 'อนุมัติแล้ว' 
                                  ? 'text-emerald-600' 
                                  : request.status === 'ไม่อนุมัติ' 
                                    ? 'text-rose-500' 
                                    : 'text-amber-500'
                              }`} />
                              <div>
                                <span className="font-bold block mb-0.5">⚠️ บันทึกแนะนำ/หมายเหตุพิจารณาจากเจ้าหน้าที่:</span>
                                <span className="font-medium whitespace-pre-wrap">{request.rejectionReason}</span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  /* No results fallback design */
                  <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center space-y-4" id="no-status-results">
                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 font-sans text-base">ไม่พบรายงานคำร้องของคุณ</h4>
                      <p className="text-slate-400 text-xs font-sans mt-1 max-w-sm mx-auto">
                        ไม่พบคำร้องสำรองที่นั่งสำหรับรหัสประจำตัวนักศึกษา "{studentId}" ในระบบ หากคุณเพิ่งส่งคำร้อง โปรดกรอกข้อมูลให้ถูกต้องอีกครั้ง
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
