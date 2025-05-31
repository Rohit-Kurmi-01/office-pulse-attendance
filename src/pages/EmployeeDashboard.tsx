
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import IPVerification from '@/components/IPVerification';
import AttendanceCard from '@/components/AttendanceCard';
import AttendanceHistory from '@/components/AttendanceHistory';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, TrendingUp, User } from 'lucide-react';
import { AttendanceRecord } from '@/types';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [isIPAllowed, setIsIPAllowed] = useState(false);
  const [currentIP, setCurrentIP] = useState('');
  const [, setAttendanceUpdated] = useState(0);

  const handleIPVerification = (allowed: boolean, ip: string) => {
    setIsIPAllowed(allowed);
    setCurrentIP(ip);
  };

  const handleAttendanceUpdate = (record: AttendanceRecord) => {
    setAttendanceUpdated(prev => prev + 1);
  };

  // Get some stats for the dashboard
  const getAttendanceStats = () => {
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const userRecords = records.filter((r: AttendanceRecord) => r.userId === user?.id);
    
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthlyRecords = userRecords.filter((r: AttendanceRecord) => {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear;
    });

    const presentDays = monthlyRecords.filter((r: AttendanceRecord) => r.checkIn).length;
    const totalWorkingDays = new Date(thisYear, thisMonth + 1, 0).getDate();
    const attendanceRate = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;

    return {
      totalRecords: userRecords.length,
      monthlyPresent: presentDays,
      attendanceRate
    };
  };

  const stats = getAttendanceStats();

  if (!user) return null;

  return (
    <Layout title="Employee Dashboard">
      <div className="space-y-6">
        {/* IP Verification */}
        <IPVerification onVerificationChange={handleIPVerification} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyPresent} days</div>
              <p className="text-xs text-muted-foreground">Present this month</p>
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
          userId={user.id}
          userName={user.name}
          isIPAllowed={isIPAllowed}
          currentIP={currentIP}
          onAttendanceUpdate={handleAttendanceUpdate}
        />

        {/* Attendance History */}
        <AttendanceHistory userId={user.id} />
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;
