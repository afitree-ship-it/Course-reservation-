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
  Layers,
  ChevronDown,
  ChevronUp,
  Filter
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ทั้งหมด' | RequestStatus>('ทั้งหมด');

  const currentBEYear = new Date().getFullYear() + 543;
  const [selectedYear, setSelectedYear] = useState<number>(currentBEYear);

  // Get unique BE years from results (always includes currentBEYear)
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentBEYear);
    results.forEach(r => {
      try {
        const year = new Date(r.createdAt).getFullYear() + 543;
        if (!isNaN(year)) {
          yearsSet.add(year);
        }
      } catch (e) {}
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [results, currentBEYear]);

  // Filter results for the selected year
  const resultsForYear = React.useMemo(() => {
    return results.filter(r => {
      try {
        const year = new Date(r.createdAt).getFullYear() + 543;
        return year === selectedYear;
      } catch (e) {
        return selectedYear === currentBEYear;
      }
    });
  }, [results, selectedYear, currentBEYear]);

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
        // Sort by newest first (newest createdAt at index 0)
        const sortedData = [...response.data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setResults(sortedData);
        if (sortedData.length > 0) {
          // Auto-expand the newest request
          setExpandedId(sortedData[0].id);
          showToast(`พบคำร้องจำนวน ${sortedData.length} รายการสำหรับนักศึกษานี้`, 'success');
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
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-white text-sm font-sans tracking-wide transition-all focus:outline-hidden focus:border-mangosteen focus:ring-4 focus:ring-mangosteen/20"
              id="search-student-id"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-mangosteen hover:bg-mangosteen-hover active:scale-[0.98] text-white rounded-xl text-sm font-bold tracking-wide font-sans shadow-md flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer"
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
                <div className="flex justify-between items-start animate-pulse">
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
                  <div className="space-y-4">
                    {/* 📅 ตัวเลือกปี พ.ศ. (Year Selector) */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-3xs" id="status-year-selector">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-extrabold text-slate-800 font-sans flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-mangosteen animate-pulse" />
                          ปีที่ยื่นคำร้อง (พ.ศ.)
                        </h4>
                        <p className="text-xs text-slate-400 font-sans">
                          เลือกเพื่อตรวจสอบข้อมูลย้อนหลังแยกตามรายปี พ.ศ. ของข้อมูลคำร้อง
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {availableYears.map((yr) => {
                          const isActive = selectedYear === yr;
                          const yrCount = results.filter(r => {
                            try {
                              return (new Date(r.createdAt).getFullYear() + 543) === yr;
                            } catch (e) {
                              return yr === currentBEYear;
                            }
                          }).length;
                          
                          return (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => {
                                setSelectedYear(yr);
                                setStatusFilter('ทั้งหมด');
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 border ${
                                isActive
                                  ? 'bg-mangosteen text-white border-mangosteen shadow-sm'
                                  : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span>พ.ศ. {yr}</span>
                              <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                                isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {yrCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Filter Tabs / Pills */}
                    <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60" id="status-filter-tabs">
                      {(['ทั้งหมด', 'รอดำเนินการ', 'อนุมัติแล้ว', 'ไม่อนุมัติ'] as const).map((tab) => {
                        const count = tab === 'ทั้งหมด' 
                          ? resultsForYear.length 
                          : resultsForYear.filter(r => r.status === tab).length;
                        
                        const isActive = statusFilter === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setStatusFilter(tab)}
                            className={`flex-1 min-w-[70px] sm:min-w-[90px] text-xs py-2 px-2.5 sm:px-3 text-center rounded-xl font-sans font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isActive 
                                ? 'bg-white text-mangosteen shadow-sm border border-slate-200/50' 
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                            }`}
                          >
                            <span>{tab}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono ${
                              isActive 
                                ? 'bg-mangosteen/10 text-mangosteen' 
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center px-1 text-xs font-semibold text-slate-400 font-sans">
                      <span>
                        แสดง {resultsForYear.filter(r => statusFilter === 'ทั้งหมด' ? true : r.status === statusFilter).length} จาก {resultsForYear.length} รายการคำร้อง ของปี พ.ศ. {selectedYear}
                      </span>
                      <span className="text-[10px] text-slate-400/90 font-medium">
                        *จัดเรียงจากรายการล่าสุดที่ยื่นเข้ามาก่อน
                      </span>
                    </div>

                    {resultsForYear
                      .filter(request => statusFilter === 'ทั้งหมด' ? true : request.status === statusFilter)
                      .map((request, idx) => {
                        const isNewestGlobal = results[0]?.id === request.id;
                        const isExpanded = expandedId === request.id;
                        
                        const coursesArray = (request.courses && request.courses.length > 0) ? request.courses : [{
                          courseCode: request.courseCode || '',
                          courseName: request.courseName || '',
                          section: request.section || '',
                          instructor: request.instructor || ''
                        }];
                        const primaryCourse = coursesArray[0];

                        return (
                          <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`bg-white rounded-xl sm:rounded-2xl shadow-xs border transition-all relative overflow-hidden ${
                              isExpanded 
                                ? 'border-mangosteen/30 shadow-sm ring-1 ring-mangosteen/5' 
                                : 'border-slate-200 hover:border-slate-350 hover:shadow-xs'
                            }`}
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

                            {/* Clickable Header for Collapsible Accordion */}
                            <div 
                              onClick={() => setExpandedId(isExpanded ? null : request.id)}
                              className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/40 select-none transition-colors"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500 bg-slate-100 font-mono">
                                      ID: {request.id}
                                    </span>

                                    {/* Highlight Badge if it's the absolute latest submission */}
                                    {isNewestGlobal && (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-200/50 shadow-3xs">
                                        <Sparkles className="w-3 h-3 text-amber-600 animate-spin-slow" />
                                        ยื่นคำร้องล่าสุด
                                      </span>
                                    )}
                                  </div>

                                  <h4 className="text-sm sm:text-base font-extrabold text-slate-800 font-sans truncate pr-2">
                                    {coursesArray.length > 1 
                                      ? `ยื่นคำร้องร่วมกันทั้งหมด ${coursesArray.length} รายวิชา` 
                                      : `${primaryCourse.courseCode} • ${primaryCourse.courseName}`}
                                  </h4>

                                  <div className="flex items-center gap-2 text-xs text-slate-400 font-sans">
                                    <span>ยื่นเมื่อ {formatDate(request.createdAt)}</span>
                                    <span>•</span>
                                    <span>กลุ่ม {primaryCourse.section}</span>
                                  </div>
                                </div>

                                {/* Right Side Actions: Status Badge & Chevron */}
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="hidden xs:block">
                                    {getStatusBadge(request.status)}
                                  </div>
                                  <div className="w-7 h-7 bg-slate-100 hover:bg-slate-200/80 rounded-full flex items-center justify-center text-slate-500 transition-colors">
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Show status badge on small screen lines if hidden */}
                              <div className="block xs:hidden mt-2 pt-2 border-t border-slate-100/60">
                                {getStatusBadge(request.status)}
                              </div>

                              {/* 📌 แสดงรายวิชาและสถานะการพิจารณา โดยให้สถานะอยู่หลังแต่ละวิชาเลยเพื่อดูง่ายและไม่สับสน */}
                              <div className="mt-3 pt-2.5 border-t border-slate-100/70 flex flex-col gap-1.5">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                  รายวิชาที่ยื่นและสถานะพิจารณา:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {coursesArray.map((c, cIdx) => {
                                    const cStatus = c.status || 'รอดำเนินการ';
                                    let statusStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                                    if (cStatus === 'อนุมัติแล้ว') statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                    if (cStatus === 'ไม่อนุมัติ') statusStyle = 'bg-rose-50 text-rose-700 border-rose-200';

                                    return (
                                      <div key={cIdx} className="inline-flex items-center gap-1.5 text-xs font-sans bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors">
                                        <span className="font-extrabold text-slate-700">{c.courseCode}</span>
                                        <span className="text-slate-300">|</span>
                                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${statusStyle}`}>
                                          {cStatus === 'อนุมัติแล้ว' && '✅ อนุมัติ'}
                                          {cStatus === 'ไม่อนุมัติ' && '❌ ไม่อนุมัติ'}
                                          {cStatus === 'รอดำเนินการ' && '⏳ รอพิจารณา'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Detailed Content shown only when Expanded */}
                            {isExpanded && (
                              <div className="px-4 pb-5 sm:px-6 sm:pb-6 border-t border-slate-100 pt-5 space-y-4 animate-fade-in bg-slate-50/30">
                                
                                {/* 📢 แสดงสถานะข้อมูลอนุมัติ/ไม่อนุมัติอย่างชัดเจน */}
                                <div className={`p-4 rounded-xl border font-sans ${
                                  request.status === 'อนุมัติแล้ว'
                                    ? 'bg-emerald-50/70 border-emerald-100 text-emerald-900'
                                    : request.status === 'ไม่อนุมัติ'
                                      ? 'bg-rose-50/70 border-rose-100 text-rose-900'
                                      : 'bg-amber-50/70 border-amber-100 text-amber-900'
                                }`}>
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start sm:items-center gap-3">
                                      {request.status === 'อนุมัติแล้ว' ? (
                                        <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
                                      ) : request.status === 'ไม่อนุมัติ' ? (
                                        <XCircle className="w-8 h-8 text-rose-500 shrink-0" />
                                      ) : (
                                        <Clock className="w-8 h-8 text-amber-500 animate-pulse shrink-0" />
                                      )}
                                      <div>
                                        <span className="text-xs text-slate-500 font-medium block mb-0.5">
                                          สถานะคำร้อง (ภาพรวม):
                                        </span>
                                        <span className={`text-lg font-black leading-tight ${
                                          request.status === 'อนุมัติแล้ว'
                                            ? 'text-emerald-700'
                                            : request.status === 'ไม่อนุมัติ'
                                              ? 'text-rose-700'
                                              : 'text-amber-700'
                                        }`}>
                                          {request.status === 'อนุมัติแล้ว' && 'อนุมัติสิทธิ์เรียบร้อยแล้ว'}
                                          {request.status === 'ไม่อนุมัติ' && 'ไม่ผ่านการอนุมัติ'}
                                          {request.status === 'รอดำเนินการ' && 'กำลังรอเจ้าหน้าที่พิจารณา'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 🚨 แสดงเฉพาะหมายเหตุที่ไม่อนุมัติอย่างชัดเจนสะดุดตา */}
                                  {request.status === 'ไม่อนุมัติ' && request.rejectionReason && (
                                    <div className="mt-3 pt-3 border-t border-rose-200/60">
                                      <span className="font-extrabold text-xs text-rose-800 block mb-1">
                                        หมายเหตุ:
                                      </span>
                                      <div className="text-xs text-rose-950 font-semibold bg-white/80 px-3 py-2 rounded-lg border border-rose-100 whitespace-pre-wrap shadow-3xs">
                                        {request.rejectionReason}
                                      </div>
                                    </div>
                                  )}

                                  {/* สำหรับกรณีอนุมัติแล้วแต่แอดมินเขียนโน้ตเพิ่มเติมก็ให้แสดงเป็นบันทึกอื่น */}
                                  {request.status !== 'ไม่อนุมัติ' && request.rejectionReason && (
                                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                                      <span className="font-bold text-xs text-slate-600 block mb-1">
                                        บันทึกเพิ่มเติมจากเจ้าหน้าที่:
                                      </span>
                                      <div className="text-xs text-slate-800 font-medium bg-white/70 px-3 py-2 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                        {request.rejectionReason}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* 📚 ข้อมูลวิชาเรียนที่ยื่นคำร้องสำรองที่นั่งทั้งหมด */}
                                <div className="space-y-2.5 font-sans">
                                  <div className="text-xs font-bold text-slate-500 tracking-wide uppercase flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-mangosteen animate-pulse" />
                                    ผลการอนุมัติรายวิชาเรียน ({coursesArray.length} รายการเรียน)
                                  </div>

                                  <div className="grid grid-cols-1 gap-2.5 bg-slate-50/50 p-2 sm:p-3 rounded-xl border border-slate-200">
                                    {coursesArray.map((course, cIdx) => {
                                      const courseStatus = course.status || 'รอดำเนินการ';
                                      return (
                                        <div 
                                          key={cIdx} 
                                          className={`bg-white rounded-lg p-3.5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs ${
                                            courseStatus === 'อนุมัติแล้ว' 
                                              ? 'border-emerald-250 bg-emerald-50/10' 
                                              : courseStatus === 'ไม่อนุมัติ' 
                                                ? 'border-rose-250 bg-rose-50/10' 
                                                : 'border-slate-200'
                                          }`}
                                        >
                                          <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-[10px] font-extrabold text-white bg-slate-800 px-2 py-0.5 rounded font-mono tracking-wide">
                                                {course.courseCode}
                                              </span>
                                              <span className="text-sm font-extrabold text-slate-800 leading-tight">
                                                {course.courseName}
                                              </span>
                                              
                                              {/* 📍 สถานะการดำเนินการรายวิชา (อยู่หลังรายวิชาเรียนเพื่อดูง่าย ทันที ไม่สับสน) */}
                                              <span className="inline-flex items-center">
                                                {courseStatus === 'อนุมัติแล้ว' ? (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 leading-none">
                                                    ✅ อนุมัติสิทธิ์แล้ว
                                                  </span>
                                                ) : courseStatus === 'ไม่อนุมัติ' ? (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-805 border border-rose-200 leading-none">
                                                    ❌ ไม่อนุมัติ
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-750 border border-amber-200 leading-none">
                                                    ⏳ รอดำเนินการพิจารณา
                                                  </span>
                                                )}
                                              </span>
                                            </div>
                                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4">
                                              <div>อาจารย์ผู้สอน: <span className="font-semibold text-slate-700">{course.instructor || 'ไม่ระบุ'}</span></div>
                                              <div className="hidden sm:block text-slate-350">|</div>
                                              <div>กลุ่มเรียน: <span className="font-black text-mangosteen font-mono text-xs">{course.section}</span></div>
                                            </div>

                                            {/* Extra individual course rejection reason */}
                                            {courseStatus === 'ไม่อนุมัติ' && course.rejectionReason && (
                                              <div className="text-[11px] font-medium text-rose-800 bg-rose-50 border border-rose-100 p-2 rounded-md mt-1.5">
                                                ⚠️ แนะนำคุณ: {course.rejectionReason}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}

                    {/* Fallback when no item matches current filter */}
                    {resultsForYear.filter(request => statusFilter === 'ทั้งหมด' ? true : request.status === statusFilter).length === 0 && (
                      <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-150 font-sans space-y-2">
                        <Filter className="w-8 h-8 text-slate-400 mx-auto opacity-70" />
                        <h5 className="font-bold text-slate-700">ไม่มีประวัติคำร้องในสถานะนี้</h5>
                        <p className="text-xs text-slate-400">
                          คุณไม่มีประวัติการส่งคำร้องที่มีสถานะเป็น "{statusFilter}" ในปี พ.ศ. {selectedYear}
                        </p>
                      </div>
                    )}
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
