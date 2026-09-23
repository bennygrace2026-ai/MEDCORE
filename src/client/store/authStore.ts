import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  secondaryEmail?: string;
  country?: string;
  state?: string;
  status?: string;
  studentId?: string;
  profilePhoto?: string;
}

interface StudentData {
  id?: string;
  institution: string;
  department: string;
  level: string;
  coins: number;
  accessDaysRemaining: number;
  accessExpiryDate: string | null;
  paymentProofUrl?: string | null;
  isExpired?: boolean;
  streak: number;
  isApproved: boolean;
  status?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  studentData: StudentData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: User, studentData?: StudentData) => void;
  updateStudentCoins: (newCoins: number) => void;
  updateStudentData: (data: Partial<StudentData>) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  studentData: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (token, user, studentData) => {
    localStorage.setItem('token', token);
    set({ token, user, studentData: studentData || null, isAuthenticated: true, isLoading: false });
  },
  updateStudentCoins: (newCoins: number) => {
    set((state) => ({
      studentData: state.studentData ? { ...state.studentData, coins: newCoins } : null
    }));
  },
  updateStudentData: (data: Partial<StudentData>) => {
    set((state) => ({
      studentData: state.studentData ? { ...state.studentData, ...data } : null
    }));
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, studentData: null, isAuthenticated: false, isLoading: false });
  },
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        set({ user: data.user, studentData: data.studentData, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem('token');
        set({ token: null, user: null, studentData: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      localStorage.removeItem('token');
      set({ token: null, user: null, studentData: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
