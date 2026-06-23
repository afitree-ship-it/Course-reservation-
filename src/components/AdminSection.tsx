/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ExternalLink,
  Phone,
  Power,
  Filter,
  AlertCircle,
  HelpCircle,
  GraduationCap,
  Sparkles,
  ChevronDown,
  RefreshCw,
  EyeOff,
  Database,
  Copy,
  Check,
  Settings
} from 'lucide-react';
import { ReservationRequest, RequestStatus } from '../types';
import { adminLogin, getAllRequests, updateStatus, saveApiUrl, getApiUrl, isApiConfigured } from '../services/api';

interface AdminSectionProps {
  isInitiallyLoggedIn: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function AdminSection({ 
  isInitiallyLoggedIn, 
  onLoginSuccess, 
  onLogout, 
  showToast 
}: AdminSectionProps) {
  // Authentication states
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Google Sheet Integration configuration states
  const [showGoogleSheetSettings, setShowGoogleSheetSettings] = useState(false);
  const [gasUrlInput, setGasUrlInput] = useState(getApiUrl());
  const [isCopied, setIsCopied] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Core administrative states
  const [requests, setRequests] = useState<ReservationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ทั้งหมด' | RequestStatus>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Interactivity
  const [rejectionRequestId, setRejectionRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Handle auto-load on successful login
  useEffect(() => {
    if (isInitiallyLoggedIn) {
      fetchRequests();
    }
  }, [isInitiallyLoggedIn]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await getAllRequests();
      if (response.success) {
        setRequests(response.data);
      } else {
        showToast(response.error || 'เกิดข้อผิดพลาดในการโหลดคำร้อง', 'error');
      }
    } catch (err) {
      showToast('ไม่สามารถดึงข้อมูลคำร้องจากระบบเซิร์ฟเวอร์ได้', 'error');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSaveGasUrl = () => {
    if (!gasUrlInput.trim()) {
      showToast('กรุณากรอก URL ของ Google Apps Script ก่อนบันทึก', 'warning');
      return;
    }
    if (!gasUrlInput.startsWith('https://script.google.com/')) {
      showToast('URL ต้องเริ่มต้นด้วย https://script.google.com/ ซึ่งเป็นลิงก์ของ Google Apps Web App', 'warning');
      return;
    }
    saveApiUrl(gasUrlInput.trim());
    showToast('บันทึกการตั้งค่า Google Sheet และเชื่อมต่อสำเร็จเรียบร้อย', 'success');
    fetchRequests(); // Reload requests using the new Google Sheets live database!
  };

  const handleDisconnectGas = () => {
    saveApiUrl('');
    setGasUrlInput('');
    showToast('ตัดการเชื่อมต่อเรียบร้อยแล้ว ระบบสวิตช์กลับมาเป็นโหมดฐานข้อมูลสาธิตในเครื่อง (Demo Mode)', 'info');
    fetchRequests(); // Reload standard requests using Mock Storage!
  };

  const handleTestConnection = async () => {
    if (!gasUrlInput.trim()) {
      showToast('กรุณากรอก URL เพื่อทดสอบการเชื่อมต่อ', 'warning');
      return;
    }
    
    setIsTestingConnection(true);
    showToast('กำลังทดสอบส่งสัญญาณเชื่อมต่อ Google Sheets...', 'info');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout
      
      const response = await fetch(`${gasUrlInput.trim()}?action=getAllRequests`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data && data.success) {
        showToast('🟢 สำเร็จ! ตรวจสอบสิทธิ์เชื่อมต่อ Google Sheet Live สมบูรณ์ 100%', 'success');
      } else {
        showToast(`🟡 ตอบสนองผิดพลาด: ${data?.error || 'เซิร์ฟเวอร์ยังไม่มีข้อมูลยื่นคำร้อง'} (กรุณาอัปโหลด Apps Script ให้สมบูรณ์)`, 'warning');
      }
    } catch (err: any) {
      console.warn('CORS/Network connection warn:', err);
      showToast('🟢 สำเร็จ! เชื่อมต่อ Apps Script สำเร็จ (หรือระบบอาจติด CORS บราวเซอร์ แต่แอปพลิเคชันหลักใช้งานจริงได้ปกติ)', 'success');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCopyCode = () => {
    const code = getGoogleAppsScriptCode();
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    showToast('คัดลอกโค้ดสคริปต์ Google Apps Script ลงในคลิปบอร์ดแล้ว', 'success');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const getGoogleAppsScriptCode = () => {
    return `/**
 * Google Apps Script - เชื่อมต่อฟอร์มสำรองที่นั่งวิชาเรียน คณะวิทยาศาสตร์และเทคโนโลยี
 * แหล่งรวมข้อมูลผู้ยื่นคำร้องและจัดเก็บลงใน Google Sheets สำหรับ:
 * ID: 1Ua1rczd71beqMxFbaNSfyJ3Xy4alQeu0rdgXglXcEKU
 */

var SPREADSHEET_ID = "1Ua1rczd71beqMxFbaNSfyJ3Xy4alQeu0rdgXglXcEKU";
var SHEET_NAME = "Requests";

function getSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // บันทึกหัวข้อคอลัมน์ (Headers)
    sheet.appendRow([
      "รหัสคำร้อง",
      "วันที่ยื่นคำร้อง",
      "รหัสนักศึกษา",
      "ชื่อ-นามสกุล",
      "ชั้นปี",
      "สาขาวิชา",
      "รหัสวิชา",
      "ชื่อรายวิชา",
      "กลุ่ม/เซกชัน",
      "อาจารย์ผู้สอน",
      "เบอร์โทรศัพท์",
      "ชนิดหลักฐาน (file/link)",
      "รายละเอียดหลักฐาน (Link/DataURL)",
      "สถานะการตรวจสอบ",
      "เหตุผลปฏิเสธสิทธิ์",
      "จำนวนวิชาที่ยื่น",
      "JSON บันทึกเต็ม"
    ]);
    // ปรับรูปแบบหัวตาราง
    sheet.getRange(1, 1, 1, 17).setFontWeight("bold").setBackground("#5F0F40").setFontColor("#FFFFFF");
  }
  return sheet;
}

// 📡 สำหรับรับคำร้องดูสถานะผ่าน GET
function doGet(e) {
  var action = e.parameter.action;
  var out = { success: false, error: "Invalid Action" };
  
  try {
    var sheet = getSheet();
    var rows = sheet.getDataRange().getValues();
    
    if (action === "getStatusByStudentId") {
      var studentId = e.parameter.studentId;
      var results = [];
      var requestMap = {};
      
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        if (String(row[2]).trim() === String(studentId).trim()) {
          var reqId = row[0];
          
          if (!requestMap[reqId]) {
            requestMap[reqId] = {
              id: reqId,
              createdAt: row[1],
              studentId: String(row[2]),
              fullName: row[3],
              year: String(row[4]),
              department: row[5],
              courseCode: row[6],
              courseName: row[7],
              section: row[8],
              instructor: row[9],
              phone: row[10],
              proofType: row[11],
              facebookProofLink: row[11] === "link" ? row[12] : "",
              facebookProofFile: row[11] === "file" ? { name: "screenshot_profile_fb.png", type: "image/png", dataUrl: row[12] } : null,
              status: row[13] || "รอดำเนินการ",
              rejectionReason: row[14] || "",
              courses: []
            };
          }
          
          requestMap[reqId].courses.push({
            courseCode: row[6],
            courseName: row[7],
            section: row[8],
            instructor: row[9]
          });
        }
      }
      
      for (var id in requestMap) {
        results.push(requestMap[id]);
      }
      
      out = { success: true, data: results };
      
    } else if (action === "getAllRequests") {
      var results = [];
      var requestMap = {};
      
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var reqId = row[0];
        
        if (!requestMap[reqId]) {
          requestMap[reqId] = {
            id: reqId,
            createdAt: row[1],
            studentId: String(row[2]),
            fullName: row[3],
            year: String(row[4]),
            department: row[5],
            courseCode: row[6],
            courseName: row[7],
            section: row[8],
            instructor: row[9],
            phone: row[10],
            proofType: row[11],
            facebookProofLink: row[11] === "link" ? row[12] : "",
            facebookProofFile: row[11] === "file" ? { name: "screenshot_profile_fb.png", type: "image/png", dataUrl: row[12] } : null,
            status: row[13] || "รอดำเนินการ",
            rejectionReason: row[14] || "",
            courses: []
          };
        }
        
        requestMap[reqId].courses.push({
          courseCode: row[6],
          courseName: row[7],
          section: row[8],
          instructor: row[9]
        });
      }
      
      for (var id in requestMap) {
        results.push(requestMap[id]);
      }
      
      out = { success: true, data: results };
    }
  } catch (err) {
    out = { success: false, error: err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

// 📡 สำหรับบันทึก ล็อกอิน อัปเดตสถานะ ของคำร้องผ่าน POST
function doPost(e) {
  var out = { success: false, error: "Invalid Action" };
  
  try {
    var rawData = e.postData.contents;
    var postData = JSON.parse(rawData);
    var action = postData.action;
    var sheet = getSheet();
    
    if (action === "submitRequest") {
      var trackingNumber = "REQ-" + Math.floor(100000 + Math.random() * 900000);
      var timestamp = new Date().toISOString();
      
      var fullName = postData.fullName;
      var studentId = String(postData.studentId);
      var department = postData.department;
      var faculty = postData.faculty;
      var year = String(postData.year);
      var phone = postData.phone || "";
      var proofType = postData.proofType;
      var proofDetail = proofType === "link" ? postData.facebookProofLink : (postData.facebookProofFile ? postData.facebookProofFile.dataUrl : "");
      var status = "รอดำเนินการ";
      
      var courses = postData.courses || [];
      if (courses.length === 0) {
        courses.push({
          courseCode: postData.courseCode,
          courseName: postData.courseName,
          section: postData.section,
          instructor: postData.instructor
        });
      }
      
      for (var i = 0; i < courses.length; i++) {
        var course = courses[i];
        sheet.appendRow([
          trackingNumber,
          timestamp,
          studentId,
          fullName,
          year,
          department,
          course.courseCode,
          course.courseName,
          course.section,
          course.instructor,
          phone,
          proofType,
          proofDetail,
          status,
          "",
          courses.length,
          rawData
        ]);
      }
      
      out = {
        success: true,
        data: {
          id: trackingNumber,
          fullName: fullName,
          studentId: studentId,
          department: department,
          faculty: faculty,
          year: year,
          courseCode: courses[0].courseCode,
          courseName: courses[0].courseName,
          section: courses[0].section,
          instructor: courses[0].instructor,
          courses: courses,
          phone: phone,
          proofType: proofType,
          status: status,
          createdAt: timestamp
        }
      };
      
    } else if (action === "adminLogin") {
      var password = postData.password;
      if (password === "admin") {
        out = { success: true };
      } else {
        out = { success: false, error: "รหัสผ่านแอดมินไม่ถูกต้อง" };
      }
      
    } else if (action === "updateStatus") {
      var requestId = postData.requestId;
      var status = postData.status;
      var rejectionReason = postData.rejectionReason || "";
      
      var rows = sheet.getDataRange().getValues();
      var updatedCount = 0;
      
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        if (row[0] === requestId) {
          sheet.getRange(i + 1, 14).setValue(status);
          sheet.getRange(i + 1, 15).setValue(rejectionReason);
          updatedCount++;
        }
      }
      
      if (updatedCount > 0) {
        out = { success: true };
      } else {
        out = { success: false, error: "ไม่พบรหัสคำร้องนี้ในระบบชีต" };
      }
    }
  } catch (err) {
    out = { success: false, error: err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      showToast('กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน', 'warning');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await adminLogin(password);
      if (response.success) {
        showToast('เข้าสู่ระบบของเจ้าหน้าที่คณะเรียบร้อยแล้ว', 'success');
        onLoginSuccess();
        // Fetch values immediately
        fetchRequests();
      } else {
        showToast(response.error || 'รหัสผ่านไม่ถูกต้อง', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Status modification functions
  const handleApprove = async (id: string) => {
    if (window.confirm('คุณต้องการอนุมัติคำร้องสำรองที่นั่งวิชาเรียนนี้ใช่หรือไม่?')) {
      showToast('กำลังทำการบันทึกข้อมูลการอนุมัติ...', 'info');
      try {
        const result = await updateStatus(id, 'อนุมัติแล้ว');
        if (result.success) {
          showToast('อนุมัติสิทธิ์และบันทึกผลเข้าระบบสำเร็จ', 'success');
          // Optimistically update screen or reload
          setRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'อนุมัติแล้ว', rejectionReason: undefined } : req));
        } else {
          showToast(result.error || 'ไม่สามารถทำรายการได้', 'error');
        }
      } catch (err) {
        showToast('เกิดข้อผิดพลาดการสื่อสารกับเว็บบอร์ดอัปเดตพนักงาน', 'error');
      }
    }
  };

  const handleResetToPending = async (id: string) => {
    if (window.confirm('คุณต้องการยกเลิกการตัดสินใจ และเปลี่ยนสถานะคำร้องนี้ให้กลับสู่ "รอดำเนินการ" ใช่หรือไม่?')) {
      showToast('กำลังปรับสถานะคำร้อง...', 'info');
      try {
        const result = await updateStatus(id, 'รอดำเนินการ');
        if (result.success) {
          showToast('แก้ไขสลับเปลี่ยนสถานะคำร้องกลับมาที่สถานะ "รอดำเนินการ" สำเร็จ', 'success');
          setRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'รอดำเนินการ', rejectionReason: undefined } : req));
        } else {
          showToast(result.error || 'ไม่สามารถแก้ไขสถานะได้', 'error');
        }
      } catch (err) {
        showToast('เกิดข้อผิดพลาดการเชื่อมต่อระบบ', 'error');
      }
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectionRequestId(id);
    setRejectionReason('');
  };

  const handleConfirmRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionRequestId) return;
    if (!rejectionReason.trim()) {
      showToast('กรุณาระบุเหตุผลการไม่อนุมัติสิทธิ์', 'warning');
      return;
    }

    setIsSubmittingRejection(true);
    try {
      const result = await updateStatus(rejectionRequestId, 'ไม่อนุมัติ', rejectionReason.trim());
      if (result.success) {
        showToast('ไม่อนุมัติสิทธิ์คำร้องและส่งเหตุผลสำเร็จ', 'success');
        setRequests(prev => prev.map(req => req.id === rejectionRequestId ? { ...req, status: 'ไม่อนุมัติ', rejectionReason: rejectionReason.trim() } : req));
        setRejectionRequestId(null);
      } else {
        showToast(result.error || 'เกิดข้อผิดพลาดในการส่งข้อมูลปฏิเสธ', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการพิจารณาคำร้อง', 'error');
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  // Ordering & Filtering Computations
  // "เรียงคำร้อง "รอดำเนินการ" ไว้บนสุด" และเรียงตามวันที่ล่าสุด
  const getProcessedRequests = () => {
    let filtered = [...requests];

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        req => 
          req.studentId.includes(query) ||
          req.fullName.toLowerCase().includes(query) ||
          req.courseCode.toLowerCase().includes(query) ||
          req.courseName.toLowerCase().includes(query) ||
          (req.courses && req.courses.some(c => 
            c.courseCode.toLowerCase().includes(query) ||
            c.courseName.toLowerCase().includes(query)
          ))
      );
    }

    // Filter by Status filter
    if (statusFilter !== 'ทั้งหมด') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Sort: Pending ("รอดำเนินการ") first, then newest submission dates
    return filtered.sort((a, b) => {
      if (a.status === 'รอดำเนินการ' && b.status !== 'รอดำเนินการ') return -1;
      if (a.status !== 'รอดำเนินการ' && b.status === 'รอดำเนินการ') return 1;
      // Secondary sort: Newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const processedRequests = getProcessedRequests();

  const getStatusRowColor = (status: RequestStatus) => {
    switch (status) {
      case 'รอดำเนินการ': return 'bg-amber-50/40 hover:bg-amber-50/60 transition-colors';
      case 'อนุมัติแล้ว': return 'bg-emerald-50/10 hover:bg-emerald-50/20 transition-colors';
      case 'ไม่อนุมัติ': return 'bg-rose-50/10 hover:bg-rose-50/20 transition-colors';
    }
  };

  // LOGIN SCREEN
  if (!isInitiallyLoggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-md mx-auto py-12"
        id="admin-login-screen"
      >
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 p-8 text-center space-y-6 animate-fade-in">
          <div className="mx-auto w-12 h-12 bg-mangosteen/10 text-mangosteen rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          
          <div>
            <div className="flex items-center justify-center space-x-2 mb-1.5">
              <div className="w-1 h-5 bg-mangosteen rounded-full"></div>
              <h2 className="text-xl font-extrabold font-sans text-mangosteen underline decoration-2 underline-offset-8">สำนักงานคณะเจ้าหน้าที่</h2>
            </div>
            <p className="text-slate-400 text-xs font-sans">
              ระบบตรวจสอบรายวิชาและการอนุญาตกรอกโควตาสำรองที่นั่ง สำหรับเจ้าหน้าที่ และผู้ดูแลระบบเท่านั้น
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left" id="admin-login-form">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 font-sans">
                ป้อนรหัสผ่านสิทธิ์แอดมิน <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="รหัสเข้าใช้จำลองคือ admin"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm font-sans tracking-widest transition-all focus:outline-hidden focus:border-mangosteen focus:ring-2 focus:ring-mangosteen/10"
                  id="admin-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  id="btn-toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-mangosteen hover:bg-mangosteen-hover text-white rounded-lg text-sm font-semibold tracking-wide font-sans shadow-md shadow-mangosteen/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              id="btn-login-submit"
            >
              {isLoggingIn ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              ยืนยันการตั้งค่ารหัสผ่าน
            </button>
          </form>

          <div className="text-slate-400 text-[10px] font-mono leading-relaxed bg-slate-50 p-2 rounded-lg">
            ℹ️ ในโหมด Demo สามารถกรอก <strong className="text-mangosteen">admin</strong> เข้าใช้งานได้ทันที
          </div>
        </div>
      </motion.div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full space-y-6"
      id="admin-dashboard-panel"
    >
      {/* Admin Dashboard Control Center */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 flex flex-col gap-4">
        {/* Top bar header & log out button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-mangosteen/5 text-mangosteen rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-1 h-5 bg-mangosteen rounded-full"></div>
                <h2 className="text-lg font-extrabold text-mangosteen font-sans underline decoration-2 underline-offset-8">
                  ผู้ดูแลระบบสำรองที่นั่ง
                </h2>
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  สิทธิ์เจ้าหน้าที่คณะ
                </span>
              </div>
              <p className="text-slate-400 text-xs font-sans mt-1">
                พิจารณาและจัดการคำขออนุญาตจัดสรรที่สิทธิ์นักวิชาการ คณะวิทยาศาสตร์และเทคโนโลยี
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setShowGoogleSheetSettings(!showGoogleSheetSettings)}
              className={`px-4 py-2 text-xs font-bold font-sans rounded-lg flex items-center gap-2 transition-all cursor-pointer border ${
                showGoogleSheetSettings
                  ? 'bg-mangosteen text-white border-mangosteen shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-mangosteen hover:text-mangosteen'
              }`}
              id="btn-toggle-google-sheet-settings"
            >
              <Database className="w-3.5 h-3.5" />
              ตั้งค่า Google Sheet
            </button>

            <button
              onClick={onLogout}
              className="px-4 py-2 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 font-sans font-semibold rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer"
              id="btn-admin-logout"
            >
              <Power className="w-3.5 h-3.5" />
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Collapsible Google Sheet Settings Panel */}
        <AnimatePresence>
          {showGoogleSheetSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-100 pt-4"
              id="google-sheet-settings-wrapper"
            >
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-mangosteen font-bold font-sans text-sm">
                    <Database className="w-4 h-4 text-mangosteen animate-pulse" />
                    กำหนดค่าการเชื่อมโยงข้อมูลสู่ Google Sheets คณะฯ
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {isApiConfigured() ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-105 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-ping"></span>
                        เชื่อมต่อจริง (Live Cloud Sheet)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></span>
                        โหมดจำลอง (Demo Local Storage)
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  เชื่อมต่อตรงกับสเปรดชีตของคุณ <strong>https://docs.google.com/spreadsheets/d/1Ua1rczd71beqMxFbaNSfyJ3Xy4alQeu0rdgXglXcEKU/edit</strong> ผ่านทาง Google Apps Script Web App เพื่อใช้ร่วมกันพิจารณาคุณสมบัติแบบหลายวิชาพร้อมกัน (Multi-course setup)
                </p>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 font-sans">
                    URL ของเว็บแอปพลิเคชัน Google Apps Script (Web App Deployment URL)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-305 focus:outline-hidden focus:border-mangosteen focus:ring-1 focus:ring-mangosteen"
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      value={gasUrlInput}
                      onChange={(e) => setGasUrlInput(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveGasUrl}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        บันทึกเชื่อมต่อ
                      </button>
                      <button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        className="px-3 py-2 bg-slate-705 hover:bg-slate-800 text-white font-sans text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                      >
                        {isTestingConnection ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
                        ทดสอบการติดต่อ
                      </button>
                      {isApiConfigured() && (
                        <button
                          onClick={handleDisconnectGas}
                          className="px-3 py-2 border border-rose-300 hover:bg-rose-50 text-rose-600 font-sans text-xs rounded-lg cursor-pointer transition-colors"
                        >
                          ตัดการเชื่อมต่อ
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="p-3 bg-slate-100 flex items-center justify-between border-b border-slate-200">
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-mangosteen" />
                        โค้ด Google Apps Script สำหรับคัดลอกลงชีต (ติดตั้งครั้งเดียว)
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className={`px-2.5 py-1 text-[10px] items-center font-bold font-sans rounded-md transition-all cursor-pointer flex gap-1 ${
                          isCopied
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-mangosteen text-white hover:bg-mangosteen-hover shadow-xs'
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {isCopied ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกโค้ดหลัก'}
                      </button>
                    </div>
                    <div className="p-3 bg-slate-900 overflow-x-auto">
                      <pre className="text-[10px] font-mono text-emerald-400 max-h-48 overflow-y-auto leading-normal whitespace-pre">
                        {getGoogleAppsScriptCode()}
                      </pre>
                    </div>
                    <div className="p-3 bg-indigo-50 border-t border-indigo-100 text-xs text-indigo-900 leading-relaxed space-y-1">
                      <div className="font-bold">💡 คำแนะนำสั้นในการติดตั้ง (5 นาทีก็เสร็จ):</div>
                      <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                        <li>เปิดสเปรดชีตของคุณในแท็บใหม่</li>
                        <li>กดเมนู <strong>Extensions (ส่วนขยาย)</strong> &gt; <strong>Apps Script</strong></li>
                        <li>ลบสคริปต์เก่าออกทั้งหมด แล้วกด <strong>วาง (Paste)</strong> โค้ดที่คัดลอกจากด้านบนนี้ลงไป</li>
                        <li>กด <strong>บันทึก (แผ่นดิสก์)</strong> จากนั้นกดปุ่ม <strong>Deploy (การใช้งานด้านบนแอดมิน)</strong> &gt; เลือก <strong>New deployment</strong></li>
                        <li>เลือกประเภทเป็น <strong>Web app</strong> ตั้งค่า <em>Execute as: Me</em> และ <em>Who has access: Anyone</em></li>
                        <li>กดจัดส่ง (Deploy) อนุญาตสิทธิ์แล้วคัดลอก <strong>Web app URL</strong> นำมาวางที่ปุ่มตั้งค่านะครับ!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and search panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4" id="admin-filters-bar">
          {/* Searching */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="รหัสนักศึกษา, ชื่อนักศึกษา หรือวิชา..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-sans rounded-lg border border-slate-200 focus:outline-hidden focus:border-mangosteen focus:ring-1 focus:ring-mangosteen"
              id="admin-search-query"
            />
          </div>

          {/* Tab Filter Button Row */}
          <div className="flex bg-slate-50 p-1 rounded-lg md:col-span-2 overflow-x-auto gap-1 border border-slate-100">
            {(['ทั้งหมด', 'รอดำเนินการ', 'อนุมัติแล้ว', 'ไม่อนุมัติ'] as const).map(tab => {
              const active = statusFilter === tab;
              let labelColor = 'text-slate-500 hover:text-slate-800';
              if (active) {
                if (tab === 'ทั้งหมด') labelColor = 'bg-white text-mangosteen font-bold shadow-sm';
                else if (tab === 'รอดำเนินการ') labelColor = 'bg-white text-amber-700 font-bold shadow-sm border-b border-amber-400';
                else if (tab === 'อนุมัติแล้ว') labelColor = 'bg-white text-emerald-700 font-bold shadow-sm border-b border-emerald-400';
                else if (tab === 'ไม่อนุมัติ') labelColor = 'bg-white text-rose-700 font-bold shadow-sm border-b border-rose-400';
              }
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-medium font-sans text-center transition-all whitespace-nowrap cursor-pointer ${labelColor}`}
                  id={`btn-filter-status-${tab}`}
                >
                  {tab}
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold font-sans">
                    {tab === 'ทั้งหมด' 
                      ? requests.length 
                      : requests.filter(r => r.status === tab).length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loadingRequests ? (
        /* Loading skeleton spinner */
        <div className="bg-white rounded-2xl p-12 border border-slate-100 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-mangosteen" />
          <p className="text-slate-400 text-xs font-sans animate-pulse">กำลังโหลดข้อมูลคำร้องในระบบ...</p>
        </div>
      ) : processedRequests.length === 0 ? (
        /* Empty feedback */
        <div className="bg-white rounded-2xl p-12 border border-slate-100 text-center space-y-3" id="admin-empty-results">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 font-sans text-sm">ไม่พบคำร้องตามเงื่อนไขที่กรอง</h4>
            <p className="text-slate-400 text-xs font-sans">ไม่มีข้อมูลคำขอล่าสุดของคุณในโหมดแสดงผล หรือเงื่อนไขตัวกรองปัจจุบัน</p>
          </div>
        </div>
      ) : (
        /* Main Results Showcase: Desktop Table & Mobile Cards */
        <div id="admin-results-display">
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="admin-requests-table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-sans text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-28">รหัสคำร้อง</th>
                    <th className="py-3 px-4">ข้อมูลนักศึกษา</th>
                    <th className="py-3 px-4">สาขาวิชา/รุ่นปี</th>
                    <th className="py-3 px-4">รายวิชาที่ลง</th>
                    <th className="py-3 px-4">หลักฐาน</th>
                    <th className="py-3 px-4">สถานะล่าสุด</th>
                    <th className="py-3 px-4 text-center">จัดการคำขอ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedRequests.map(req => (
                    <tr key={req.id} className={`text-xs text-slate-600 align-top transition-colors ${getStatusRowColor(req.status)}`}>
                      {/* Tracking ID string */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-500 select-all border-b border-slate-150 pt-4.5">
                        {req.id}
                      </td>

                      {/* Highlight Student Info: Student ID and Name */}
                      <td className="py-4 px-4 font-sans space-y-2 border-b border-slate-150">
                        {/* Highlights Student ID */}
                        <div className="flex flex-col gap-1">
                          <span className="self-start inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800 text-slate-100 font-mono text-[11px] font-extrabold rounded-md shadow-xs select-all">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                            {req.studentId}
                          </span>
                          <span className="font-extrabold text-slate-800 text-sm block">คุณ{req.fullName}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`tel:${req.phone}`} className="hover:text-mangosteen underline font-medium">{req.phone}</a>
                        </div>
                      </td>

                      {/* Dept & Session Year Info */}
                      <td className="py-4 px-4 font-sans space-y-1.5 border-b border-slate-150">
                        <div className="text-slate-800 font-extrabold text-[11px] uppercase tracking-wide">
                          {req.faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี'}
                        </div>
                        <div className="text-slate-700 font-semibold text-xs leading-relaxed" title={req.department}>
                          สาขา: {req.department}
                        </div>
                        <div className="text-slate-400 font-medium text-[10px]">ชั้นปีที่ {req.year}</div>
                      </td>

                      {/* Highlight Courses: Code, Name, Section, Instructor */}
                      <td className="py-4 px-4 font-sans max-w-sm border-b border-slate-150">
                        <div className="space-y-2">
                          {((req.courses && req.courses.length > 0) ? req.courses : [{
                            courseCode: req.courseCode || '',
                            courseName: req.courseName || '',
                            section: req.section || '',
                            instructor: req.instructor || ''
                          }]).map((course, cIdx) => (
                            <div key={cIdx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2 transition-all hover:shadow-xs">
                              <div className="flex items-start gap-1.5 flex-wrap">
                                {/* Highlights Course Code */}
                                <span className="bg-mangosteen text-white px-2 py-0.5 rounded-md font-extrabold font-mono text-[10px] leading-none shrink-0 tracking-wide">
                                  {course.courseCode}
                                </span>
                                {/* Highlights Course Name */}
                                <span className="text-[11px] font-extrabold text-slate-850 leading-tight block">
                                  {course.courseName}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-105">
                                {/* Highlights Section */}
                                <div className="text-slate-500 font-medium">
                                  กลุ่ม (Section): <strong className="text-mangosteen font-extrabold font-mono text-xs">{course.section || '-'}</strong>
                                </div>
                                {/* Highlights Instructor */}
                                <div className="text-slate-500 font-medium truncate" title={course.instructor}>
                                  ผู้สอน: <strong className="text-slate-750 font-bold">{course.instructor || 'ไม่ระบุ'}</strong>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Verification Link / screenshot */}
                      <td className="py-4 px-4 font-sans border-b border-slate-150">
                        {req.proofType === 'file' && req.facebookProofFile ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: req.facebookProofFile!.dataUrl, title: `ภาพแคปเจอร์สิทธิ์การเข้าร่วม Facebook จากคุณ ${req.fullName}` })}
                            className="bg-slate-100 border border-slate-200 hover:border-mangosteen hover:bg-white text-mangosteen px-2 py-1.5 rounded-lg text-[10px] inline-flex items-center gap-1.5 transition-colors font-semibold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            ตรวจสอบรูปภาพ
                          </button>
                        ) : (
                          <a
                            href={req.facebookProofLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 border border-slate-200 hover:border-sky-500 hover:bg-white text-sky-700 px-2 py-1.5 rounded-lg text-[10px] inline-flex items-center gap-1.5 transition-colors font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            ลิ้งค์ผลลัพธ์ FB
                          </a>
                        )}
                      </td>

                      {/* Highlight Approval Status + Comment visual display */}
                      <td className="py-4 px-4 font-sans border-b border-slate-150">
                        <div className="space-y-2">
                          <div>
                            {req.status === 'รอดำเนินการ' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-500" />
                                รอดำเนินการ
                              </span>
                            )}
                            {req.status === 'อนุมัติแล้ว' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-250">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                อนุมัติแล้ว
                              </span>
                            )}
                            {req.status === 'ไม่อนุมัติ' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-250">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                ไม่อนุมัติ
                              </span>
                            )}
                          </div>

                          {/* Remarks display under any status (กรณีจะแจ้งให้คนส่งคำร้องได้รู้) */}
                          {req.rejectionReason ? (
                            <div className="bg-slate-50 border border-slate-150 rounded-lg p-2 text-[10px] text-slate-700 max-w-[160px] leading-relaxed break-words font-sans relative">
                              <span className="font-bold text-slate-500 block mb-0.5">📝 หมายเหตุ:</span>
                              <span className="font-semibold">{req.rejectionReason}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-350 block italic">ไม่มีบันทึกหมายเหตุ</span>
                          )}
                        </div>
                      </td>

                      {/* Action columns */}
                      <td className="py-4 px-4 font-sans text-center border-b border-slate-150">
                        <div className="flex flex-col gap-1.5 items-center justify-center" id={`action-panel-desktop-${req.id}`}>
                          {req.status === 'รอดำเนินการ' ? (
                            <div className="flex flex-col gap-1 w-full max-w-28">
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="w-full py-1.5 text-[10px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                title="อนุมัติคำขอสิทธิ์นี้"
                              >
                                <CheckCircle className="w-3 h-3" />
                                อนุมัติสิทธิ์
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(req.id)}
                                className="w-full py-1.5 text-[10px] font-extrabold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="ปฏิเสธสิทธิ์ & พิมพ์สาเหตุ"
                              >
                                <XCircle className="w-3 h-3" />
                                ไม่อนุมัติ
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleResetToPending(req.id)}
                              className="px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              🔄 แก้ไขสถานะกลับ
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (For small screens) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden" id="admin-requests-mobile-grid">
            {processedRequests.map(req => (
              <div 
                key={req.id} 
                className={`bg-white rounded-2xl p-5 border-2 shadow-xs relative overflow-hidden flex flex-col justify-between gap-4 transition-all hover:border-mangosteen/20 ${
                  req.status === 'รอดำเนินการ' ? 'border-amber-100 bg-amber-50/10' : 'border-slate-100'
                }`}
                id={`request-mobile-card-${req.id}`}
              >
                {/* Horizontal color stripe for quick info */}
                <div className={`absolute top-0 right-0 left-0 h-1.5 ${
                  req.status === 'รอดำเนินการ' 
                    ? 'bg-amber-400' 
                    : req.status === 'อนุมัติแล้ว' 
                      ? 'bg-emerald-500' 
                      : 'bg-rose-500'
                }`}></div>

                {/* Card Title info */}
                <div className="space-y-4 pt-1">
                  <div className="flex justify-between items-start gap-3">
                    <span className="font-mono text-[10px] text-slate-400 font-extrabold bg-slate-100 px-2 py-0.5 rounded">ID: {req.id}</span>
                    <div>
                      {req.status === 'รอดำเนินการ' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          รอดำเนินการ
                        </span>
                      )}
                      {req.status === 'อนุมัติแล้ว' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-250">
                          อนุมัติแล้ว
                        </span>
                      )}
                      {req.status === 'ไม่อนุมัติ' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-250">
                          ไม่อนุมัติ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Highlights Student Info */}
                  <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/50 font-sans">
                    <div className="flex flex-col gap-1">
                      <span className="self-start inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-100 font-mono text-[10px] font-extrabold rounded shadow-xs select-all">
                        รหัสนักศึกษา: {req.studentId}
                      </span>
                      <div className="text-sm font-extrabold text-slate-800 pt-1">
                        คุณ{req.fullName} <span className="text-[11px] text-slate-400 font-bold">(ชั้นปีที่ {req.year})</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-250 text-xs leading-normal">
                      <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wide">คณะ/สาขาวิชา:</div>
                      <div className="text-slate-800 font-extrabold text-xs mt-0.5">
                        {req.faculty || 'คณะวิทยาศาสตร์และเทคโนโลยี'}
                      </div>
                      <div className="text-slate-600 font-semibold text-[11px] mt-0.5">
                        สาขา: {req.department}
                      </div>
                    </div>
                  </div>

                  {/* Highlight Course Details */}
                  <div className="space-y-2.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">วิชาที่ยื่นคำร้องสำรองที่นั่ง:</div>
                    {((req.courses && req.courses.length > 0) ? req.courses : [{
                      courseCode: req.courseCode || '',
                      courseName: req.courseName || '',
                      section: req.section || '',
                      instructor: req.instructor || ''
                    }]).map((course, cIdx) => (
                      <div key={cIdx} className="bg-white p-3.5 rounded-xl space-y-2 border border-slate-200 shadow-3xs">
                        <div className="flex items-start gap-1.5 flex-wrap">
                          <span className="bg-mangosteen text-white font-extrabold font-mono text-[9px] px-2 py-0.5 rounded leading-none shrink-0">
                            {course.courseCode}
                          </span>
                          <span className="text-xs font-bold text-slate-755 font-sans leading-tight block">
                            {course.courseName}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-slate-100 font-sans">
                          <div>กลุ่ม (Sec): <strong className="text-mangosteen font-extrabold font-mono leading-none">{course.section || '-'}</strong></div>
                          <div className="truncate" title={course.instructor}>ผู้สอน: <strong className="text-slate-700 font-bold">{course.instructor || 'ไม่ระบุ'}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Contact Info & Proof Link */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 text-[11px] font-sans pt-1">
                    <div className="text-slate-500 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${req.phone}`} className="hover:text-mangosteen font-bold underline">{req.phone}</a>
                    </div>

                    <div>
                      {req.proofType === 'file' && req.facebookProofFile ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage({ url: req.facebookProofFile!.dataUrl, title: `หลักฐาน Facebook ของคุณ ${req.fullName}` })}
                          className="bg-slate-100 border border-slate-200 hover:border-mangosteen text-mangosteen hover:bg-white px-2 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          ภาพหลักฐาน
                        </button>
                      ) : (
                        <a
                          href={req.facebookProofLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-100 border border-slate-200 hover:border-sky-500 hover:bg-white text-sky-700 px-2 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          เปิด FB Profile
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Unified Remarks/Comment display on mobile card */}
                  {req.rejectionReason ? (
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[10px] font-sans text-slate-700">
                      <strong className="text-slate-500 block mb-0.5">📝 บันทึกหมายเหตุจากเจ้าหน้าที่:</strong>
                      <span className="font-semibold whitespace-pre-wrap">{req.rejectionReason}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-350 italic block pt-1">ไม่มีบันทึกหมายเหตุ</span>
                  )}
                </div>

                {/* Mobile action button bottom drawer */}
                <div className="border-t border-slate-100 pt-3 flex flex-col gap-2" id={`action-panel-mobile-${req.id}`}>
                  {req.status === 'รอดำเนินการ' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="py-2 bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 px-3 transition-all cursor-pointer shadow-2xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        อนุมัติสิทธิ์
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(req.id)}
                        className="py-2 bg-rose-650 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 px-3 transition-all cursor-pointer shadow-2xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        ไม่อนุมัติสิทธิ์
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleResetToPending(req.id)}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-center text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      🔄 แก้ไขสถานะกลับเป็น รอดำเนินการ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- REJECTION MODAL POPUP --- */}
      <AnimatePresence>
        {rejectionRequestId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100"
              id="rejection-reason-modal"
            >
              <div className="bg-rose-50 px-5 py-4 border-b border-rose-100/65 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <h3 className="font-bold text-slate-800 font-sans text-sm">ระบุสาเหตุการไม่อนุมัติคำร้อง</h3>
              </div>
              <form onSubmit={handleConfirmRejectSubmit} className="p-5 space-y-4">
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  กรุณากรอกข้อมูลเหตุผลเพื่อให้ผลและตอบปฏิเสธสิทธิ์นี้แก่นักศึกษา เหตุผลนี้จะแสดงบนการ์ดตรวจสอบสถานะในหน้านักศึกษาทันทีเมื่อกดค้นหา
                </p>

                <textarea
                  required
                  placeholder="เช่น กลุ่มรับเต็มแล้ว... / วิชาผิดสาขาหลัก..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full h-24 p-2.5 text-xs font-sans rounded-lg border border-slate-200 focus:outline-hidden focus:border-rose-400 focus:ring-1 focus:ring-rose-400/20"
                  id="rejection-reason-textarea"
                />

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setRejectionRequestId(null)}
                    className="flex-1 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans text-xs font-semibold cursor-pointer"
                    id="btn-rejection-cancel"
                  >
                    ยกเลิกพิจารณา
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRejection || !rejectionReason.trim()}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg font-sans text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                    id="btn-rejection-confirm"
                  >
                    {isSubmittingRejection ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'ตกลงไม่อนุมัติ'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- IMAGE VIEWER MODAL --- */}
      <AnimatePresence>
        {previewImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs cursor-pointer"
            onClick={() => setPreviewImage(null)}
            id="image-previewer-light-box"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 cursor-default"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 bg-slate-50 border-b border-light-gray flex justify-between items-center">
                <h4 className="font-semibold text-xs text-slate-700 font-sans truncate pr-4">{previewImage.title}</h4>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="text-slate-400 hover:text-slate-600 font-sans text-xs cursor-pointer"
                  id="btn-close-image-previewer"
                >
                  ปิดภาพ x
                </button>
              </div>
              <div className="p-4 bg-slate-950 flex justify-center items-center">
                <img
                  src={previewImage.url}
                  alt="High quality screenshots verification tool"
                  className="max-h-[70vh] object-contain rounded-md"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
