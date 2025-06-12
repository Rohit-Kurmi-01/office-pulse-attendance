import React, { useState } from 'react';
import Layout from '@/components/Layout';
import IPVerification from '@/components/IPVerification';
import AttendanceCard from '@/components/AttendanceCard';
import AttendanceHistory from '@/components/AttendanceHistory';
import { useAuth } from '@/context/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, TrendingUp, User } from 'lucide-react';
import { AttendanceRecordDB as AttendanceRecordDBType } from '@/types';
import { listAttendance, getAttendanceByUserId } from '@/lib/api';

const EmployeeDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [isIPAllowed, setIsIPAllowed] = useState(false);
  const [currentIP, setCurrentIP] = useState('');
  const [, setAttendanceUpdated] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordDBType[]>([]);
  const [loading, setLoading] = useState(true);

  const handleIPVerification = (allowed: boolean, ip: string) => {
    setIsIPAllowed(allowed);
    setCurrentIP(ip);
  };

  const handleAttendanceUpdate = (record: AttendanceRecordDBType) => {
    setAttendanceUpdated(prev => prev + 1);
    // Refetch attendance records after check-in/out
    fetchAttendanceRecords();
  };

  const effectiveUserId = user?.user_id || user?.id;

  React.useEffect(() => {
    if (effectiveUserId) fetchAttendanceRecords();
    // eslint-disable-next-line
  }, [effectiveUserId]);

  if (!isAuthenticated || user?.role !== 'employee') {
    return (
      <div className="text-center mt-10 text-red-600 font-bold">
        Access denied.<br />
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  if (!user || !effectiveUserId) {
    return (
      <div className="text-center mt-10 text-red-600 font-bold">
        User not found or not logged in.<br />
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  const fetchAttendanceRecords = async () => {
    if (!effectiveUserId) return;
    setLoading(true);
    try {
      // Fetch all records for the user (history)
      const response = await getAttendanceByUserId(effectiveUserId);
      const data = Array.isArray(response?.payload) ? response.payload : response;
      setAttendanceRecords(data);
    } catch {
      setAttendanceRecords([]);
    }
    setLoading(false);
  };

  // Get some stats for the dashboard
  const getAttendanceStats = () => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthlyRecords = attendanceRecords.filter((r) => {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear;
    });
    let presentDays = 0;
    let partialDays = 0;
    monthlyRecords.forEach((r) => {
      const hasMorning = !!r.morning_check_in && !!r.morning_check_out;
      const hasEvening = !!r.evening_check_in && !!r.evening_check_out;
      if (hasMorning && hasEvening) {
        presentDays += 1;
      } else if (hasMorning || hasEvening) {
        partialDays += 1;
      }
    });
    const totalWorkingDays = new Date(thisYear, thisMonth + 1, 0).getDate();
    const attendanceRate = totalWorkingDays > 0 ? Math.round(((presentDays + partialDays) / totalWorkingDays) * 100) : 0;
    return {
      totalRecords: attendanceRecords.length,
      monthlyPresent: presentDays,
      monthlyPartial: partialDays,
      monthlyAbsent: totalWorkingDays - (presentDays + partialDays),
      attendanceRate
    };
  };

  const stats = getAttendanceStats();

  return (
    <Layout title="Employee Dashboard">
      <div className="space-y-6">
        {/* IP Verification */}
        <IPVerification onVerificationChange={handleIPVerification} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyPresent} days</div>
              <p className="text-xs text-muted-foreground">Present this month</p>
              <div className="text-xs text-muted-foreground">Partial: {stats.monthlyPartial} | Absent: {stats.monthlyAbsent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">Monthly average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Card */}
        <AttendanceCard
          user_id={effectiveUserId}
          username={user.name}
          isIPAllowed={isIPAllowed}
          currentIP={currentIP}
          onAttendanceUpdate={handleAttendanceUpdate}
          todayRecordFromParent={(() => {
            const rec = attendanceRecords.find(r => r.date === new Date().toISOString().split('T')[0]);
            if (!rec) return undefined;
            // Patch missing required fields for AttendanceCard's AttendanceRecordDB
            return {
              workingHours: '',
              ...rec
            };
          })()}
        />

        {/* Attendance History */}
        <AttendanceHistory userId={effectiveUserId} />
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;
