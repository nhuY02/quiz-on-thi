import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  where,
  deleteDoc,
  updateDoc,
  Firestore,
} from 'firebase/firestore';
import type { SavedQuizBank } from '../types/quiz';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';

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

export interface GroupQuizItem {
  id?: string;
  groupId: string;
  quizBank: SavedQuizBank;
  sharedBy: string;
  sharedAt: string;
  allowDownload?: boolean; // Cho phép thành viên khác tải về máy hay không (mặc định true)
  isMemberRecord?: boolean;
}

const STORAGE_KEYS = {
  FIREBASE_CONFIG: 'quiz_on_thi_firebase_config',
  USER_NICKNAME: 'quiz_on_thi_user_nickname',
  ACTIVE_GROUP_ID: 'quiz_on_thi_active_group_id',
};

// Owner default email from git author
const OWNER_EMAIL = 'nhuytran264804@gmail.com';

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyCbLLc6ucwGZyfQn5TBMFARrjqKPtIR7DI",
  authDomain: "quiz-on-thi.firebaseapp.com",
  projectId: "quiz-on-thi",
  storageBucket: "quiz-on-thi.firebasestorage.app",
  messagingSenderId: "95438604177",
  appId: "1:95438604177:web:6e797e52c8c6d0fe743c30",
};

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (!raw) return DEFAULT_FIREBASE_CONFIG;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_FIREBASE_CONFIG;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
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

export function getActiveGroupId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_GROUP_ID) || null;
}

export function setActiveGroupId(groupId: string): void {
  if (groupId.trim()) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GROUP_ID, groupId.trim().toUpperCase());
  }
}

export function clearActiveGroupId(): void {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_GROUP_ID);
}

export function getFirebaseApp(): FirebaseApp | null {
  const config = getSavedFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  try {
    return initializeApp(config);
  } catch (err) {
    console.warn('Lỗi khởi tạo Firebase app:', err);
    return null;
  }
}

let firestoreInstance: Firestore | null = null;

function getDb(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    firestoreInstance = getFirestore(app);
    return firestoreInstance;
  } catch (err) {
    console.warn('Lỗi kết nối Firestore:', err);
    return null;
  }
}

export function resetFirebaseInstance(): void {
  firestoreInstance = null;
}

/**
 * Đăng nhập Admin bằng tài khoản Google (Firebase Authentication)
 * Tuyệt đối không lưu mật khẩu trong code!
 */
export async function signInAdminWithGoogle(): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> {
  const app = getFirebaseApp();
  if (!app) {
    return { success: false, error: 'Chưa cấu hình Firebase.' };
  }

  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  // Prompt user to select account
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userEmail = (user.email || '').toLowerCase().trim();

    // Check permission:
    // 1. Is owner email?
    let isAllowed = userEmail === OWNER_EMAIL.toLowerCase().trim();

    // 2. Or is registered in Firestore 'admins' collection?
    if (!isAllowed) {
      const db = getDb();
      if (db) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', userEmail));
          if (adminDoc.exists()) {
            isAllowed = true;
          }
        } catch {
          // ignore error
        }
      }
    }

    if (!isAllowed) {
      await signOut(auth);
      return {
        success: false,
        error: `Tài khoản (${userEmail}) không có quyền Quản trị viên (Admin). Chỉ tài khoản của chủ web mới được truy cập!`,
      };
    }

    return { success: true, user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('popup-closed-by-user')) {
      return { success: false, error: 'Bạn đã đóng cửa sổ đăng nhập Google.' };
    }
    return { success: false, error: `Lỗi đăng nhập: ${message}` };
  }
}

export async function signOutAdmin(): Promise<void> {
  const app = getFirebaseApp();
  if (app) {
    const auth = getAuth(app);
    await signOut(auth);
  }
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  const app = getFirebaseApp();
  if (!app) {
    callback(null);
    return () => {};
  }
  const auth = getAuth(app);
  return onAuthStateChanged(auth, (user) => {
    if (user && (user.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      callback(user);
    } else {
      callback(null);
    }
  });
}

/**
 * Thêm một email admin phụ vào Firestore (nếu chủ web muốn chia sẻ quyền)
 */
export async function addAuthorizedAdminEmail(email: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const clean = email.toLowerCase().trim();
  await setDoc(doc(db, 'admins', clean), {
    email: clean,
    addedAt: new Date().toISOString(),
  });
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
  if (!db) return;

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

/**
 * Chia sẻ một bộ đề thi vào nhóm học tập
 */
export async function shareQuizToGroup(groupId: string, quizBank: SavedQuizBank): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Chưa kết nối cơ sở dữ liệu Firebase.');
  const cleanGroup = groupId.trim().toUpperCase();
  const item = {
    groupId: cleanGroup,
    quizBank,
    sharedBy: getUserNickname(),
    sharedAt: new Date().toISOString(),
    allowDownload: true, // Mặc định cho phép tải về
    isMemberRecord: false,
  };
  await addDoc(collection(db, 'group_quizzes'), item);
  // Đồng thời đăng ký thành viên cho người chia sẻ
  await registerGroupMember(cleanGroup, getUserNickname());
}

/**
 * Lấy danh sách các đề thi được chia sẻ trong nhóm học tập
 */
export async function getGroupQuizzes(groupId: string): Promise<GroupQuizItem[]> {
  const db = getDb();
  if (!db) return [];
  const cleanGroup = groupId.trim().toUpperCase();

  try {
    const q = query(
      collection(db, 'group_quizzes'),
      where('groupId', '==', cleanGroup),
      limit(50)
    );
    const snap = await getDocs(q);
    const list = snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<GroupQuizItem, 'id'>),
      }))
      .filter((item) => !item.isMemberRecord && item.quizBank); // Chỉ lấy đề thi, bỏ qua record thành viên

    // Sắp xếp đề mới nhất lên đầu
    return list.sort((a, b) => (b.sharedAt || '').localeCompare(a.sharedAt || ''));
  } catch (err) {
    console.error('Lỗi lấy danh sách đề thi của nhóm:', err);
    return [];
  }
}

/**
 * Xóa một đề thi khỏi nhóm học tập
 */
export async function deleteGroupQuiz(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'group_quizzes', id));
  } catch (err) {
    console.error('Lỗi xóa đề thi khỏi nhóm:', err);
  }
}

/**
 * Đổi tên đề thi trong nhóm (chỉ người chia sẻ mới có quyền)
 */
export async function updateGroupQuizTitle(id: string, newTitle: string): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Chưa kết nối Firestore');
  await updateDoc(doc(db, 'group_quizzes', id), {
    'quizBank.title': newTitle.trim(),
  });
}

/**
 * Cập nhật quyền cho phép tải đề thi về máy (chỉ người chia sẻ mới có quyền)
 */
export async function updateGroupQuizAllowDownload(id: string, allowDownload: boolean): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('Chưa kết nối Firestore');
  await updateDoc(doc(db, 'group_quizzes', id), {
    allowDownload,
  });
}

/**
 * Đăng ký người dùng hiện tại là thành viên nhóm
 */
export async function registerGroupMember(groupId: string, nickname: string): Promise<void> {
  const db = getDb();
  if (!db || !nickname.trim()) return;
  const cleanGroup = groupId.trim().toUpperCase();
  const cleanNick = nickname.trim();
  try {
    const docId = `__member_${cleanGroup}_${encodeURIComponent(cleanNick)}`;
    await setDoc(
      doc(db, 'group_quizzes', docId),
      {
        isMemberRecord: true,
        groupId: cleanGroup,
        nickname: cleanNick,
        lastActive: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Lỗi đăng ký thành viên nhóm:', err);
  }
}

/**
 * Lấy danh sách thành viên trong nhóm
 */
export async function getGroupMembers(groupId: string): Promise<string[]> {
  const db = getDb();
  const myNick = getUserNickname();
  if (!db) return [myNick];
  const cleanGroup = groupId.trim().toUpperCase();

  try {
    const q = query(
      collection(db, 'group_quizzes'),
      where('groupId', '==', cleanGroup),
      limit(100)
    );
    const snap = await getDocs(q);
    const set = new Set<string>();
    set.add(myNick);

    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.isMemberRecord && data.nickname) {
        set.add(data.nickname);
      } else if (data.sharedBy) {
        set.add(data.sharedBy);
      }
    });

    return Array.from(set);
  } catch (err) {
    console.error('Lỗi lấy danh sách thành viên nhóm:', err);
    return [myNick];
  }
}
