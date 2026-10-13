import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Firestore,
} from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface UploadLogItem {
  id?: string;
  fileName: string;
  fileSize: number;
  questionCount: number;
  sectionsCount: number;
  userName: string;
  createdAt: string;
  quizTitle: string;
}

export interface SubmissionLogItem {
  id?: string;
  quizTitle: string;
  userName: string;
  score: number;
  total: number;
  percentage: number;
  mode: string;
  weakSections?: string[];
  createdAt: string;
}

const STORAGE_KEYS = {
  FIREBASE_CONFIG: 'quiz_on_thi_firebase_config',
  ADMIN_PASSWORD: 'quiz_on_thi_admin_password',
  USER_NICKNAME: 'quiz_on_thi_user_nickname',
};

const DEFAULT_ADMIN_PASSWORD = 'admin';

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
}

export function getAdminPassword(): string {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || DEFAULT_ADMIN_PASSWORD;
}

export function saveAdminPassword(password: string): void {
  localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, password);
}

export function getUserNickname(): string {
  let name = localStorage.getItem(STORAGE_KEYS.USER_NICKNAME);
  if (!name) {
    name = `Học viên #${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem(STORAGE_KEYS.USER_NICKNAME, name);
  }
  return name;
}

export function setUserNickname(name: string): void {
  if (name.trim()) {
    localStorage.setItem(STORAGE_KEYS.USER_NICKNAME, name.trim());
  }
}

let firestoreInstance: Firestore | null = null;

function getDb(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;

  const config = getSavedFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    const apps = getApps();
    let app: FirebaseApp;
    if (apps.length > 0) {
      app = apps[0];
    } else {
      app = initializeApp(config);
    }
    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  } catch (err) {
    console.warn('Lỗi kết nối Firebase:', err);
    return null;
  }
}

// Reset instance when config updates
export function resetFirebaseInstance(): void {
  firestoreInstance = null;
}

/**
 * Ghi log khi có người dùng tải tài liệu lên và tạo đề thành công
 */
export async function logFileUploadEvent(data: {
  fileName: string;
  fileSize: number;
  questionCount: number;
  sectionsCount: number;
  quizTitle: string;
}): Promise<void> {
  const db = getDb();
  if (!db) return; // Nếu chưa cấu hình Firebase thì bỏ qua nhẹ nhàng

  try {
    const log: UploadLogItem = {
      ...data,
      userName: getUserNickname(),
      createdAt: new Date().toISOString(),
    };
    await addDoc(collection(db, 'upload_logs'), log);
  } catch (err) {
    console.warn('Không thể gửi log upload lên Firebase:', err);
  }
}

/**
 * Ghi log khi có người dùng nộp bài thi
 */
export async function logQuizSubmissionEvent(data: {
  quizTitle: string;
  score: number;
  total: number;
  percentage: number;
  mode: string;
  weakSections?: string[];
}): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    const log: SubmissionLogItem = {
      ...data,
      userName: getUserNickname(),
      createdAt: new Date().toISOString(),
    };
    await addDoc(collection(db, 'submission_logs'), log);
  } catch (err) {
    console.warn('Không thể gửi log nộp bài lên Firebase:', err);
  }
}

/**
 * Lấy lịch sử tải file dành cho Admin
 */
export async function getUploadLogs(limitCount = 50): Promise<UploadLogItem[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'upload_logs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as UploadLogItem),
    }));
  } catch (err) {
    console.error('Lỗi lấy danh sách upload logs:', err);
    return [];
  }
}

/**
 * Lấy lịch sử nộp bài dành cho Admin
 */
export async function getSubmissionLogs(limitCount = 50): Promise<SubmissionLogItem[]> {
  const db = getDb();
  if (!db) return [];

  try {
    const q = query(
      collection(db, 'submission_logs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as SubmissionLogItem),
    }));
  } catch (err) {
    console.error('Lỗi lấy danh sách submission logs:', err);
    return [];
  }
}
