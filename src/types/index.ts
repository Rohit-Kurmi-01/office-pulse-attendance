
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'employee' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'partial';
  ipAddress: string;
}

export interface AllowedIP {
  id: string;
  address: string;
  description: string;
  addedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}
