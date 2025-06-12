export interface User {
  id?: string; // Some APIs may use id
  user_id?: string; // Some APIs may use user_id
  email: string;
  name: string;
  role: 'employee' | 'admin';
  isActive?: boolean;
  is_active?: boolean; // To support both camelCase and snake_case
  createdAt?: string;
  created_at?: string;
}

/**
 * Backend-compatible attendance record type. Use this everywhere for attendance data.
 */
export type AttendanceRecordDB = {
  id: string;
  user_id: string;
  username: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'present' | 'absent' | 'partial' | 'half-day';
  ip_address: string;
  workingHours?: string;
  morning_check_in?: string;
  morning_check_out?: string;
  evening_check_in?: string;
  evening_check_out?: string;
};

/**
 * @deprecated Use AttendanceRecordDB instead. This is the legacy type.
 */
export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'partial';
  ipAddress: string;
  workingHours?: string;
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
  setUser?: (user: User | null) => void;
}
