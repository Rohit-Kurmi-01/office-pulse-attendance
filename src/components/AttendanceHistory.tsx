import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Search, Filter, FileSpreadsheet, Users, Clock } from 'lucide-react';
import { listAttendance, AttendanceRecordDB, getEmployees, getAttendanceByUserId, updateAttendance } from '@/lib/api';
import * as XLSX from 'xlsx';
import { AttendanceRecordDB as AttendanceRecordDBType } from '@/types';
import { calculateSessionDuration } from './helper/timeHelper';

interface AttendanceHistoryProps {
  userId?: string;
  isAdmin?: boolean;

}



const AttendanceHistory = ({ userId, isAdmin = false }: AttendanceHistoryProps) => {
  // Only use the userId prop, do not fallback to localStorage
  const [records, setRecords] = useState<AttendanceRecordDBType[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecordDBType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [pendingEveningCheckIn, setPendingEveningCheckIn] = useState<{ [id: string]: string | null }>({});
  const [pendingEveningCheckOut, setPendingEveningCheckOut] = useState<{ [id: string]: string | null }>({});

  useEffect(() => {
    async function fetchRecords() {
      try {
        let data: AttendanceRecordDB[];
        if (userId) {
          data = await getAttendanceByUserId(userId);
        } else {
          data = await listAttendance({});
        }
        setRecords(data);
        setFilteredRecords(data);
      } catch (err) {
        setRecords([]);
        setFilteredRecords([]);
      }
    }
    fetchRecords();
  }, [userId, isAdmin]);

  useEffect(() => {
    let filtered = records;
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (dateFilter) {
      filtered = filtered.filter(record => record.date === dateFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }
    if (dateRange !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      switch (dateRange) {
        case 'today':
          filterDate.setDate(today.getDate());
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          break;
      }
      if (dateRange !== 'all') {
        filtered = filtered.filter(record => 
          new Date(record.date) >= filterDate
        );
      }
    }
    setFilteredRecords(filtered);
  }, [records, searchTerm, dateFilter, statusFilter, dateRange]);

  // Helper to format seconds as HH:mm
  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return '--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Helper to format seconds as HH:mm, but only if both times are present
  const formatSession = (inTime: string | null | undefined, outTime: string | null | undefined) => {
    if (!inTime || !outTime) return '--';
    // Parse as Date objects using today's date
    const today = new Date().toISOString().split('T')[0];
    const inDate = new Date(`${today} ${inTime}`);
    const outDate = new Date(`${today} ${outTime}`);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return '--';
    const seconds = Math.max((outDate.getTime() - inDate.getTime()) / 1000, 0);
    if (seconds === 0) return '--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getSessionDurations = React.useCallback((record: AttendanceRecordDBType) => {
    const morningSeconds = (() => {
      if (!record.morning_check_in || !record.morning_check_out) return 0;
      const today = new Date().toISOString().split('T')[0];
      const inDate = new Date(`${today} ${record.morning_check_in}`);
      const outDate = new Date(`${today} ${record.morning_check_out}`);
      if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return 0;
      return Math.max((outDate.getTime() - inDate.getTime()) / 1000, 0);
    })();
    const eveningSeconds = (() => {
      if (!record.evening_check_in || !record.evening_check_out) return 0;
      const today = new Date().toISOString().split('T')[0];
      const inDate = new Date(`${today} ${record.evening_check_in}`);
      const outDate = new Date(`${today} ${record.evening_check_out}`);
      if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return 0;
      return Math.max((outDate.getTime() - inDate.getTime()) / 1000, 0);
    })();
    // Calculate lunch break: time between morning_check_out and evening_check_in
    const lunchSeconds = (() => {
      if (!record.morning_check_out || !record.evening_check_in) return 0;
      const today = new Date().toISOString().split('T')[0];
      const outDate = new Date(`${today} ${record.morning_check_out}`);
      const inDate = new Date(`${today} ${record.evening_check_in}`);
      if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return 0;
      return Math.max((inDate.getTime() - outDate.getTime()) / 1000, 0);
    })();
    const totalSeconds = morningSeconds + eveningSeconds;
    const total = totalSeconds > 0
      ? `${Math.floor(totalSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')}`
      : '--';
    const lunch = lunchSeconds > 0
      ? `${Math.floor(lunchSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((lunchSeconds % 3600) / 60).toString().padStart(2, '0')}`
      : '--';
    return {
      morning: formatSession(record.morning_check_in, record.morning_check_out),
      evening: formatSession(record.evening_check_in, record.evening_check_out),
      lunch,
      total
    };
  }, []);

  useEffect(() => {
    async function updateMissingWorkingHours() {
      // Only run for records that have check-outs but missing workingHours
      const updates = filteredRecords.filter(r =>
        (r.morning_check_out || r.evening_check_out) && (!r.workingHours || r.workingHours === '')
      );
      for (const rec of updates) {
        const working = getSessionDurations(rec).total;
        if (working && working !== '--') {
          // Update the record in the backend with all required fields in snake_case
          await updateAttendance(rec.id, {
            user_id: rec.user_id,
            username: rec.username,
            date: rec.date,
            status: rec.status,
            ip_address: rec.ip_address,
            morning_check_in: rec.morning_check_in,
            morning_check_out: rec.morning_check_out,
            evening_check_in: rec.evening_check_in,
            evening_check_out: rec.evening_check_out,
            working_hours: working
          } as Partial<AttendanceRecordDB> // Use Partial<AttendanceRecordDB> to specify the type for snake_case fields
   ) }
      }
    }
    if (filteredRecords.length > 0) {
      updateMissingWorkingHours();
    }
  }, [filteredRecords, getSessionDurations]);

  const getStatusBadge = (record: AttendanceRecordDBType) => {
    if (record.morning_check_in && record.morning_check_out && record.evening_check_in && record.evening_check_out) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Present</Badge>;
    } else if (record.morning_check_in || record.evening_check_in) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Partial</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Absent</Badge>;
    }
  };

  const exportToExcel = () => {
    const exportData = filteredRecords.map(record => ({
      'Date': new Date(record.date).toLocaleDateString(),
      'Employee Name': record.username,
      'Check In': record.morning_check_in || 'Not recorded',
      'Morning Check Out': record.morning_check_out || 'Not recorded',
      'Evening Check In': record.evening_check_in || 'Not recorded',
      'Evening Check Out': record.evening_check_out || 'Not recorded',
      'Working Hours': record.workingHours || getSessionDurations(record).total,
      'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
      'IP Address': record.ip_address,
      'Total Hours (Decimal)': (() => {
        const today = new Date().toISOString().split('T')[0];
        let totalMs = 0;
        if (record.morning_check_in && record.morning_check_out) {
          const inDate = new Date(`${today}T${record.morning_check_in}`);
          const outDate = new Date(`${today}T${record.morning_check_out}`);
          totalMs += outDate.getTime() - inDate.getTime();
        }
        if (record.evening_check_in && record.evening_check_out) {
          const inDate = new Date(`${today}T${record.evening_check_in}`);
          const outDate = new Date(`${today}T${record.evening_check_out}`);
          totalMs += outDate.getTime() - inDate.getTime();
        }
        return totalMs > 0 ? (totalMs / (1000 * 60 * 60)).toFixed(2) : '0';
      })()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 20 }, // Employee Name
      { wch: 12 }, // Check In
      { wch: 12 }, // Check Out
      { wch: 15 }, // Working Hours
      { wch: 10 }, // Status
      { wch: 18 }, // IP Address
      { wch: 18 }  // Total Hours
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
    
    const fileName = `attendance-records-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getStats = () => {
    const totalRecords = filteredRecords.length;
    const presentCount = filteredRecords.filter(r => r.status === 'present').length;
    const partialCount = filteredRecords.filter(r => r.status === 'partial').length;
    const absentCount = filteredRecords.filter(r => r.status === 'absent').length;

    return { totalRecords, presentCount, partialCount, absentCount };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {/* {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Records</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalRecords}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Present</p>
                  <p className="text-2xl font-bold text-green-900">{stats.presentCount}</p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Partial</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.partialCount}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Absent</p>
                  <p className="text-2xl font-bold text-red-900">{stats.absentCount}</p>
                </div>
                <Clock className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Main Table Card */}
      <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2 text-xl">
                <Calendar className="h-6 w-6" />
                <span>Attendance Records</span>
              </CardTitle>
              <CardDescription className="text-blue-100">
                {isAdmin ? 'Complete employee attendance overview' : 'Your personal attendance history'}
              </CardDescription>
            </div>
            <Button 
              onClick={exportToExcel} 
              variant="secondary" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Enhanced Filters */}
          
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {isAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search Employee</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Specific Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div> */}

          {/* Results Summary */}
          {filteredRecords.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <Filter className="inline h-4 w-4 mr-1" />
                Showing {filteredRecords.length} of {records.length} records
              </p>
            </div>
          )}

          {/* Enhanced Table */}
          <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-900">Date</TableHead>
                  {isAdmin && <TableHead className="font-semibold text-gray-900">Employee</TableHead>}
                  <TableHead className="font-semibold text-gray-900">Morning log In</TableHead>
                  <TableHead className="font-semibold text-gray-900">Morning log Out</TableHead>
                  <TableHead className="font-semibold text-gray-900">Evening log In</TableHead>
                  <TableHead className="font-semibold text-gray-900">Evening log Out</TableHead>
                  <TableHead className="font-semibold text-gray-900">Working Hours</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  {isAdmin && <TableHead className="font-semibold text-gray-900">IP Address</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 5} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <Calendar className="h-12 w-12 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No attendance records found</p>
                        <p className="text-sm text-gray-400">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record, index) => (
                    <TableRow key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <TableCell className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      {isAdmin && <TableCell className="font-medium text-gray-900">{record.username}</TableCell>}
                      <TableCell className="font-mono text-sm">
                        {record.morning_check_in ? (
                          <span className="text-green-700 bg-green-50 px-2 py-1 rounded">{record.morning_check_in}</span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.morning_check_out ? (
                          <span className="text-green-700 bg-green-50 px-2 py-1 rounded">{record.morning_check_out}</span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.evening_check_in ? (
                          <span
                            className="text-blue-700 bg-blue-50 px-2 py-1 rounded cursor-pointer"
                            onClick={() => setPendingEveningCheckIn(prev => ({ ...prev, [record.id]: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }))}
                          >
                            {record.evening_check_in}
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.evening_check_out ? (
                          <span
                            className="text-blue-700 bg-blue-50 px-2 py-1 rounded cursor-pointer"
                            onClick={() => setPendingEveningCheckOut(prev => ({ ...prev, [record.id]: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }))}
                          >
                            {record.evening_check_out}
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {(() => {
                          // Use pending values if set, otherwise use record values
                          const eveningCheckIn = pendingEveningCheckIn[record.id] || record.evening_check_in;
                          const eveningCheckOut = pendingEveningCheckOut[record.id] || record.evening_check_out;
                          const morning = formatSession(record.morning_check_in, record.morning_check_out);
                          const evening = formatSession(eveningCheckIn, eveningCheckOut);
                          // Lunch is time between morning_check_out and eveningCheckIn
                          let lunch = '--';
                          if (record.morning_check_out && eveningCheckIn) {
                            const today = new Date().toISOString().split('T')[0];
                            const outDate = new Date(`${today} ${record.morning_check_out}`);
                            const inDate = new Date(`${today} ${eveningCheckIn}`);
                            const lunchSeconds = Math.max((inDate.getTime() - outDate.getTime()) / 1000, 0);
                            if (lunchSeconds > 0) {
                              const hours = Math.floor(lunchSeconds / 3600);
                              const minutes = Math.floor((lunchSeconds % 3600) / 60);
                              lunch = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                            }
                          }
                          // Total is sum of both sessions
                          let total = '--';
                          if (morning !== '--' && evening !== '--') {
                            const [mh, mm] = morning.split(':').map(Number);
                            const [eh, em] = evening.split(':').map(Number);
                            if (!isNaN(mh) && !isNaN(mm) && !isNaN(eh) && !isNaN(em)) {
                              const totalMinutes = mh * 60 + mm + eh * 60 + em;
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;
                              total = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                            }
                          }
                          return (
                            <span>
                              <span className="block">Morning: {morning}</span>
                              <span className="block">Evening: {evening}</span>
                              <span className="block">Lunch: {lunch}</span>
                              <span className="block font-semibold p-2 bg-green-300 border-2 rounded-2xl">Total: {total}</span>
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                      {isAdmin && (
                        <TableCell className="font-mono text-xs text-gray-600 bg-gray-50">
                          {record.ip_address}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceHistory;
