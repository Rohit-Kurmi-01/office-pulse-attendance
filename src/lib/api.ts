// src/lib/api.ts
import { AttendanceRecord } from '@/types';

const API_BASE_URL = 'http://localhost:3001/';

export async function getAllowedIPs() {
  const res = await fetch('/api/allowed-ips');
  if (!res.ok) throw new Error('Failed to fetch allowed IPs');
  return res.json();
}

export async function addAllowedIP(ip) {
  const res = await fetch('/api/allowed-ips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ip),
  });
  if (!res.ok) throw new Error('Failed to add allowed IP');
  return res.json();
}

export async function deleteAllowedIP(id) {
  const res = await fetch(`/api/allowed-ips/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete allowed IP');
}

export interface LoginResponse {
  status: string;
  payload?: {
    id: string;
    email: string;
    auth_token: string;
  };
  message: string;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error('Invalid server response. Please try again later.');
  }

  if (!response.ok || data.status !== '1') {
    throw new Error(data?.message || 'Login failed');
  }
  return data;
}

export function loginUser(data: { email: string; password: string }): Promise<LoginResponse> {
  return fetch(`${API_BASE_URL}api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then(async (response) => {
      let resData;
      try {
        resData = await response.json();
      } catch (e) {
        throw new Error('Invalid server response. Please try again later.');
      }
      if (!response.ok || resData.status !== '1') {
        throw new Error(resData?.message || 'Login failed');
      }
      return resData;
    });
}

// Employee CRUD API
export async function getEmployees() {
  const res = await fetch(`${API_BASE_URL}api/employee/list`);
  if (!res.ok) throw new Error('Failed to fetch employees');
  const data = await res.json();
  if (data.status !== '1') throw new Error(data.message || 'Failed to fetch employees');
  return data.payload;
}

export async function addEmployee(employee: { name: string; email: string; password: string; role: string }) {
  const res = await fetch(`${API_BASE_URL}api/employee/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  const data = await res.json();
  if (!res.ok || data.status !== '1') throw new Error(data.message || 'Failed to add employee');
  return data;
}

export async function updateEmployee(id: string, employee: { name: string; email: string; role: string; is_active: boolean }) {
  const res = await fetch(`${API_BASE_URL}api/employee/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  const data = await res.json();
  if (!res.ok || data.status !== '1') throw new Error(data.message || 'Failed to update employee');
  return data;
}

export async function deleteEmployee(id: string) {
  const res = await fetch(`${API_BASE_URL}api/employee/delete/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || data.status !== '1') throw new Error(data.message || 'Failed to delete employee');
  return data;
}

// IP CRUD API
export async function getIPs() {
  const res = await fetch(`${API_BASE_URL}api/ip/list`);
  if (!res.ok) throw new Error('Failed to fetch IPs');
  const data = await res.json();
  if (data.status !== '1') throw new Error(data.message || 'Failed to fetch IPs');
  return data.payload;
}

export async function addIP(ip: { ip_address: string; description: string }) {
  const res = await fetch(`${API_BASE_URL}api/ip/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ip),
  });
  const data = await res.json();
  if (!res.ok || data.status !== '1') throw new Error(data.message || 'Failed to add IP');
  return data;
}

export async function deleteIP(id: string) {
  const res = await fetch(`${API_BASE_URL}api/ip/delete/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || data.status !== '1') throw new Error(data.message || 'Failed to delete IP');
  return data;
}

// Backend-compatible AttendanceRecord type
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
};

// Attendance CRUD API
export async function addAttendance(record: AttendanceRecordDB) {
  
  const res = await fetch(`${API_BASE_URL}api/attendance/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  const data = await res.json();
  if (!res.ok || data.status !== '1') throw new Error(data.message || 'Failed to add attendance');
  return data;
}

export async function updateAttendance(id: string, record: Partial<AttendanceRecordDB>) {
  const res = await fetch(`${API_BASE_URL}api/attendance/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  const data = await res.json();
  if (!res.ok || data.status !== '1') throw new Error(data.message || 'Failed to update attendance');
  return data;
}

export async function listAttendance(params: { user_id?: string; date?: string }) {
  const url = new URL(`${API_BASE_URL}api/attendance/list`);
  if (params.user_id) url.searchParams.append('user_id', params.user_id);
  if (params.date) url.searchParams.append('date', params.date);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok || data.status !== '1') throw new Error(data.message || 'Failed to fetch attendance');
  return data.payload;
}

// Get today's attendance for a user
export async function getTodayAttendance(user_id: string) {
  const res = await fetch(`${API_BASE_URL}api/attendance/today/${user_id}`);
  const data = await res.json();
  if (!res.ok || data.status !== '1') throw new Error(data.message || 'Failed to fetch today\'s attendance');
  return data.payload;
}

// Get all attendance records for a specific user
export async function getAttendanceByUserId(user_id: string) {
  const res = await fetch(`${API_BASE_URL}api/attendance/user/${user_id}`);
  const data = await res.json();
  if (!res.ok || data.status !== '1') throw new Error(data.message || 'Failed to fetch user attendance');
  return data.payload;
}

// Trial status API
export async function checkTrialStatus(): Promise<{ status: "active" | "expired"; message?: string }> {
  try {
    // Use API_BASE_URL for consistency and to support different ports
    const res = await fetch(`${API_BASE_URL}api/trial-status`, { credentials: "include" });
    if (res.status === 403) {
      const data = await res.json();
      return { status: "expired", message: data.message || "Trial expired. Please contact support." };
    }
    return { status: "active" };
  } catch {
    return { status: "expired", message: "Unable to verify trial status. Please try again later." };
  }
}

// Device Fingerprint APIs

// Add a new device fingerprint
export async function addDeviceFingerprint(data: { user_id: string; fingerprints: string; created_at: string; status: string }) {
  const res = await fetch(`${API_BASE_URL}api/device-fingerprint/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok || result.status !== '1') throw new Error(result.message || 'Failed to add device fingerprint');
  return result;
}

// Update a device fingerprint by device_id
export async function updateDeviceFingerprint(device_id: string, data: { user_id: string; fingerprints: string; created_at: string; status: string }) {
  const res = await fetch(`${API_BASE_URL}api/device-fingerprint/update/${device_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok || result.status !== '1') throw new Error(result.message || 'Failed to update device fingerprint');
  return result;
}

// Delete a device fingerprint by device_id
export async function deleteDeviceFingerprint(device_id: string) {
  const res = await fetch(`${API_BASE_URL}api/device-fingerprint/delete/${device_id}`, { method: 'DELETE' });
  const result = await res.json();
  if (!res.ok || result.status !== '1') throw new Error(result.message || 'Failed to delete device fingerprint');
  return result;
}

// Get all device fingerprints (optionally filter by user_id)
export async function listDeviceFingerprints(user_id?: string) {
  const url = new URL(`${API_BASE_URL}api/device-fingerprint/list`);
  if (user_id) url.searchParams.append('user_id', user_id);
  const res = await fetch(url.toString());
  const result = await res.json();
  if (!res.ok || result.status !== '1') throw new Error(result.message || 'Failed to fetch device fingerprints');
  return result.payload;
}

// Get all device fingerprints with status 1 (optionally filter by user_id)
export interface DeviceFingerprint {
  device_id: string;
  user_id: string;
  fingerprints: string;
  created_at: string;
  status: string;
}

export async function listActiveDeviceFingerprints(user_id?: string): Promise<DeviceFingerprint[]> {
  const url = new URL(`${API_BASE_URL}api/device-fingerprint/list`);
  if (user_id) url.searchParams.append('user_id', user_id);
  url.searchParams.append('status', '1'); // Always request status 1 from backend
  const res = await fetch(url.toString());
  const result = await res.json();
  if (!res.ok || result.status !== '1') throw new Error(result.message || 'Failed to fetch device fingerprints');
  // If backend does not filter, filter here as well
  return (result.payload as DeviceFingerprint[]).filter(fp => fp.status === '1');
}
