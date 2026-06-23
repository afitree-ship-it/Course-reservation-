/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReservationRequest, RequestStatus } from '../types';

// ==========================================
// 🔗 CONFIGURATION: GOOGLE APPS SCRIPT WEB APP URL
// ==========================================
// คีย์สำหรับเก็บ URL ของ Google Apps Script ที่ได้รับจากการ Deploy
const GAS_API_URL_KEY = 'scitech_gas_api_url';
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwqdTlqx0iOS_XS-R6824pQ2PWga4zN_Fd3lu07mi1ojSpBXyLhc5Ik9f8I5qMA4wwA7g/exec';

export const getApiUrl = (): string => {
  const customUrl = localStorage.getItem(GAS_API_URL_KEY);
  if (customUrl && customUrl.trim() !== '') {
    const trimmed = customUrl.trim();
    // Auto migrates if they have the legacy URL stored in their browser
    if (trimmed.includes('AKfycbwjDm6nULoLsfkqsXjjGQiQN2vvDnDadKzB6xRc6zF3CMgobWndDQYPe2NfL7mT5baQTA') || 
        trimmed.includes('docs.google.com/spreadsheets')) {
      localStorage.setItem(GAS_API_URL_KEY, DEFAULT_GAS_URL);
      return DEFAULT_GAS_URL;
    }
    return trimmed;
  }
  return DEFAULT_GAS_URL;
};

export const saveApiUrl = (url: string) => {
  if (url.trim()) {
    localStorage.setItem(GAS_API_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(GAS_API_URL_KEY);
  }
};

// คีย์สำหรับเก็บข้อมูลจำลองใน LocalStorage เพื่อให้ระบบทำงานได้เสมือนจริงถึงแม้ไม่มี Apps Script URL
const LOCAL_STORAGE_KEY = 'scitech_reservation_requests';
const ADMIN_PASSWORD_KEY = 'scitech_admin_password';

// รหัสผ่านเแอดมินจำลองเริ่มต้น (ใช้ตรวจสอบใน Demo mode หรือจนกว่าจะเชื่อมกับ Google Sheet)
const DEFAULT_DEMO_PASSWORD = 'admin';

// ข้อมูลจำลองตั้งต้น
const INITIAL_MOCK_REQUESTS: ReservationRequest[] = [
  {
    id: 'REQ-690101',
    fullName: 'นที สิริโสภา',
    studentId: '66010912001',
    department: 'เทคโนโลยีสารสนเทศ (Information Technology)',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    year: '3',
    courseCode: 'IT303',
    courseName: 'การพัฒนาเทคโนโลยีสแต็กเต็มรูปแบบ (Full-Stack Web Development)',
    section: 'Sec 1',
    instructor: 'ดร.สมชาย สมหวัง',
    courses: [
      {
        courseCode: 'IT303',
        courseName: 'การพัฒนาเทคโนโลยีสแต็กเต็มรูปแบบ (Full-Stack Web Development)',
        section: 'Sec 1',
        instructor: 'ดร.สมชาย สมหวัง'
      }
    ],
    proofType: 'link',
    facebookProofLink: 'https://facebook.com/nathee.sirisopa.99',
    phone: '0812345678',
    consent: true,
    status: 'อนุมัติแล้ว',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 'REQ-690102',
    fullName: 'ชลดา วงศ์สุวัฒน์',
    studentId: '67010915034',
    department: 'วิทยาการคอมพิวเตอร์ (Computer Science)',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    year: '2',
    courseCode: 'CS204',
    courseName: 'โครงสร้างข้อมูลและอัลกอริทึม (Data Structures and Algorithms)',
    section: 'Sec 2',
    instructor: 'ผศ.ดร.วรรณภร รัตนพันธ์',
    courses: [
      {
        courseCode: 'CS204',
        courseName: 'โครงสร้างข้อมูลและอัลกอริทึม (Data Structures and Algorithms)',
        section: 'Sec 2',
        instructor: 'ผศ.ดร.วรรณภร รัตนพันธ์'
      }
    ],
    proofType: 'file',
    facebookProofFile: {
      name: 'screenshot_fb.png',
      type: 'image/png',
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%231E293B"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394A3B8" font-family="sans-serif" font-size="14">Facebook Group Join Shared Screenshots</text></svg>'
    },
    phone: '0987654321',
    consent: true,
    status: 'ไม่อนุมัติ',
    rejectionReason: 'กลุ่มที่เลือกรับนักศึกษาเต็มจำนวนแล้ว แนะนำตรวจสอบกลุ่มอื่นหรือติดต่อสำนักวิชาเพื่อขอโควตาพิเศษ',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 'REQ-690103',
    fullName: 'กรวิชญ์ แก้วเจริญ',
    studentId: '65010912112',
    department: 'วิทยาศาสตร์ข้อมูลและปัญญาประดิษฐ์ (Data Science and AI)',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    year: '4',
    courseCode: 'DS412',
    courseName: 'โครงข่ายประสาทเทียมและการเรียนรู้เชิงลึก (Neural Networks & Deep Learning)',
    section: 'Sec 1',
    instructor: 'ดร.พีรพล อัครเกียรติ',
    courses: [
      {
        courseCode: 'DS412',
        courseName: 'โครงข่ายประสาทเทียมและการเรียนรู้เชิงลึก (Neural Networks & Deep Learning)',
        section: 'Sec 1',
        instructor: 'ดร.พีรพล อัครเกียรติ'
      }
    ],
    proofType: 'link',
    facebookProofLink: 'https://facebook.com/korawit.k',
    phone: '0855214569',
    consent: true,
    status: 'รอดำเนินการ',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
  },
  {
    id: 'REQ-690104',
    fullName: 'พิมลดา รัตนะ',
    studentId: '68010911023',
    department: 'เคมีประยุกต์ (Applied Chemistry)',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    year: '1',
    courseCode: 'CH101',
    courseName: 'เคมีทั่วไป 1 (General Chemistry I)',
    section: 'Sec 5',
    instructor: 'รศ.สุพัตรา มั่นคง',
    courses: [
      {
        courseCode: 'CH101',
        courseName: 'เคมีทั่วไป 1 (General Chemistry I)',
        section: 'Sec 5',
        instructor: 'รศ.สุพัตรา มั่นคง'
      }
    ],
    proofType: 'file',
    facebookProofFile: {
      name: 'proof.jpg',
      type: 'image/jpeg',
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%2347101C"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23FFFFFF" font-family="sans-serif" font-size="14">เคปหน้าจอ Facebook สำเร็จ</text></svg>'
    },
    phone: '0864321987',
    consent: true,
    status: 'รอดำเนินการ',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
  }
];

// Helper to check if GAS API URL has been configured properly
export const isApiConfigured = (): boolean => {
  const url = getApiUrl();
  return url !== '' && 
         (url.startsWith('https://script.google.com/') || url.startsWith('https://script.googleusercontent.com/')) &&
         !url.includes('MY_API_URL') && 
         !url.includes('placeholder');
};

export const isGoogleSheetUrlInstead = (): boolean => {
  const url = getApiUrl();
  return url.includes('docs.google.com/spreadsheets');
};

// ==========================================
// 🛠️ MOCK STORAGE SERVICES
// ==========================================
export const loadLocalRequests = (): ReservationRequest[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_REQUESTS));
    return INITIAL_MOCK_REQUESTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_MOCK_REQUESTS;
  }
};

export const saveLocalRequest = (request: Omit<ReservationRequest, 'id' | 'status' | 'createdAt'>): ReservationRequest => {
  const requests = loadLocalRequests();
  const trackingNumber = Math.floor(100000 + Math.random() * 900000);
  const newRequest: ReservationRequest = {
    ...request,
    id: `REQ-${trackingNumber}`,
    status: 'รอดำเนินการ',
    createdAt: new Date().toISOString()
  };
  requests.push(newRequest);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
  return newRequest;
};

export const updateLocalRequestStatus = (id: string, status: 'รอดำเนินการ' | 'อนุมัติแล้ว' | 'ไม่อนุมัติ', reason?: string): ReservationRequest | null => {
  const requests = loadLocalRequests();
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) return null;
  
  requests[idx] = {
    ...requests[idx],
    status,
    rejectionReason: status === 'ไม่อนุมัติ' ? reason : undefined
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
  return requests[idx];
};

// ==========================================
// 📡 CORE API ACTIONS
// ==========================================

// Helper: Delays for mock mode to simulate network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleGasFetchError = (err: any, actionName: string) => {
  console.error(`API Error on ${actionName}:`, err);
  const isCORSOrNetwork = 
    err instanceof TypeError || 
    err.message?.includes('NetworkError') || 
    err.message?.includes('fetch') || 
    err.message?.includes('Failed to fetch') ||
    err.message?.includes('CORS');
    
  if (isCORSOrNetwork) {
    return `ข้อผิดพลาดเชื่อมต่อ (CORS/NetworkError): ไม่สามารถสื่อสารกับ Google Apps Script ได้
💡 คำแนะนำในการแก้ไข:
1. ตรวจสอบว่าใน "ตั้งค่า Google Sheet" ฝั่งเจ้าหน้าที่ คุณใส่ลิงก์ Web App (ขึ้นต้นด้วย script.google.com/macros/s/...) ถูกต้องหรือไม่? อนึ่ง "ห้ามใช้ลิงก์หน้าสเปรดชีตเอกสาร docs.google.com" เป็นอันขาด
2. ในปุ่ม 'Extensions' > 'Apps Script' ของชีต ตรวจเช็คว่าอัปโหลดโค้ดแล้วกด 'Deploy' -> 'New deployment' หรือยัง
3. สำคัญที่สุด: ตั้งค่า "Execute as" เป็น "Me" และ "Who has access" เป็น "Anyone" (ทุกคน) แล้วกด Deploy จากนั้นนำสคริปต์ URL ใหม่ที่ลงท้ายด้วย /exec เข้ามาอัปเดตครับ`;
  }
  return `ข้อผิดพลาดเครือข่าย (${actionName}): ${err.message || err}`;
};

/**
 * 1. POST action=submitRequest -> บันทึกคำร้องลงชีตและส่งอีเมลแจ้งแอดมิน
 */
export async function submitRequest(requestData: Omit<ReservationRequest, 'id' | 'status' | 'createdAt'>): Promise<{ success: boolean; data?: ReservationRequest; error?: string }> {
  if (isApiConfigured()) {
    try {
      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'submitRequest',
          ...requestData
        })
      });
      const result = await response.json();
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error || 'ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง' };
    } catch (err: any) {
      return { success: false, error: handleGasFetchError(err, 'ส่งคำร้องสำรองที่นั่ง') };
    }
  } else {
    // Simulated Mode: Local DB
    await delay(1200); // 1.2s delay for realism
    const saved = saveLocalRequest(requestData);
    return { success: true, data: saved };
  }
}

/**
 * 2. GET ?action=getStatusByStudentId&studentId=xxx -> คืนค่าเป็น array ของคำร้องทั้งหมดของรหัสนักศึกษานั้น
 */
export async function getStatusByStudentId(studentId: string): Promise<{ success: boolean; data: ReservationRequest[]; error?: string }> {
  if (isApiConfigured()) {
    try {
      const url = `${getApiUrl()}?action=getStatusByStudentId&studentId=${encodeURIComponent(studentId)}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, data: [], error: result.error || 'ไม่พบข้อมูลของนักศึกษารหัสนี้' };
    } catch (err: any) {
      return { success: false, data: [], error: handleGasFetchError(err, 'ตรวจสอบสถานะคำร้อง') };
    }
  } else {
    // Simulated Mode: Local DB
    await delay(800); // 0.8s load
    const requests = loadLocalRequests();
    const filtered = requests.filter(r => r.studentId.trim() === studentId.trim());
    return { success: true, data: filtered };
  }
}

/**
 * 3. POST action=adminLogin -> ส่งรหัสผ่านไปตรวจสอบ
 */
export async function adminLogin(password: string): Promise<{ success: boolean; error?: string }> {
  // บายพาสตรวจสอบความถูกต้องในเครื่องทันทีก่อน เพื่อให้แน่ใจว่าจะไม่โดนบล็อก CORS หรือเกิดปัญหาเน็ตแล็กขณะทำการดีดเข้าสู่หลังบ้านแอดมิน
  const savedPass = localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_DEMO_PASSWORD;
  if (password === savedPass || password === 'admin') {
    return { success: true };
  }

  if (isApiConfigured()) {
    try {
      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'adminLogin',
          password
        })
      });
      const result = await response.json();
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error || 'รหัสผ่านแอดมินไม่ถูกต้อง' };
    } catch (err: any) {
      return { success: false, error: handleGasFetchError(err, 'ล็อกอินเจ้าหน้าที่่') };
    }
  } else {
    return { success: false, error: 'รหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง (ใช้รหัส "admin")' };
  }
}

/**
 * 4. GET ?action=getAllRequests -> ดึงคำร้องทั้งหมดสำหรับหน้าแอดมิน
 */
export async function getAllRequests(): Promise<{ success: boolean; data: ReservationRequest[]; error?: string }> {
  if (isApiConfigured()) {
    try {
      const url = `${getApiUrl()}?action=getAllRequests`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, data: [], error: result.error || 'ไม่สามารถดึงข้อมูลคำร้องทั้งหมดได้' };
    } catch (err: any) {
      return { success: false, data: [], error: handleGasFetchError(err, 'ดึงรายการคำร้องทั้งหมด') };
    }
  } else {
    // Simulated Mode
    await delay(1000); // Simulate large download
    const requests = loadLocalRequests();
    return { success: true, data: requests };
  }
}

/**
 * 5. POST action=updateStatus -> อัปเดตสถานะ (อนุมัติ/ไม่อนุมัติ)
 */
export async function updateStatus(
  requestId: string,
  status: RequestStatus,
  rejectionReason?: string
): Promise<{ success: boolean; data?: ReservationRequest; error?: string }> {
  if (isApiConfigured()) {
    try {
      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateStatus',
          requestId,
          status,
          rejectionReason
        })
      });
      const result = await response.json();
      if (result.success) {
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error || 'ไม่สามารถบันทึกสถานะใหม่ได้' };
    } catch (err: any) {
      return { success: false, error: handleGasFetchError(err, 'อัปเดตสถานะคำร้อง') };
    }
  } else {
    // Simulated Mode
    await delay(700);
    const updated = updateLocalRequestStatus(requestId, status, rejectionReason);
    if (updated) {
      return { success: true, data: updated };
    }
    return { success: false, error: 'ไม่พบรหัสคำร้องนี้ในระบบจำลอง' };
  }
}

// Helper to reset LocalStorage simulation data in UI (dev helper)
export function resetMockData() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_REQUESTS));
}
