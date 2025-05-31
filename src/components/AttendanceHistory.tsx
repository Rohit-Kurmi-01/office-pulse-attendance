
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Search, Filter, FileSpreadsheet, Users, Clock } from 'lucide-react';
import { AttendanceRecord } from '@/types';
import * as XLSX from 'xlsx';

interface AttendanceHistoryProps {
  userId?: string;
  isAdmin?: boolean;
}

const AttendanceHistory = ({ userId, isAdmin = false }: AttendanceHistoryProps) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    const savedRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    let recordsToShow = savedRecords;
    
    if (!isAdmin && userId) {
      recordsToShow = savedRecords.filter((r: AttendanceRecord) => r.userId === userId);
    }
    
    setRecords(recordsToShow);
    setFilteredRecords(recordsToShow);
  }, [userId, isAdmin]);

  useEffect(() => {
    let filtered = records;
    
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.userName.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.checkIn && record.checkOut) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Present</Badge>;
    } else if (record.checkIn) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Partial</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Absent</Badge>;
    }
  };

  const calculateWorkingHours = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return '--';
    
    const inTime = new Date(`2000-01-01 ${checkIn}`);
    const outTime = new Date(`2000-01-01 ${checkOut}`);
    const diff = outTime.getTime() - inTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const exportToExcel = () => {
    const exportData = filteredRecords.map(record => ({
      'Date': new Date(record.date).toLocaleDateString(),
      'Employee Name': record.userName,
      'Check In': record.checkIn || 'Not recorded',
      'Check Out': record.checkOut || 'Not recorded',
      'Working Hours': calculateWorkingHours(record.checkIn, record.checkOut),
      'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
      'IP Address': record.ipAddress,
      'Total Hours (Decimal)': record.checkIn && record.checkOut ? 
        ((new Date(`2000-01-01 ${record.checkOut}`).getTime() - new Date(`2000-01-01 ${record.checkIn}`).getTime()) / (1000 * 60 * 60)).toFixed(2) : '0'
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
      {isAdmin && (
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
      )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          </div>

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
                  <TableHead className="font-semibold text-gray-900">Check In</TableHead>
                  <TableHead className="font-semibold text-gray-900">Check Out</TableHead>
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
                      {isAdmin && <TableCell className="font-medium text-gray-900">{record.userName}</TableCell>}
                      <TableCell className="font-mono text-sm">
                        {record.checkIn ? (
                          <span className="text-green-700 bg-green-50 px-2 py-1 rounded">{record.checkIn}</span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.checkOut ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">{record.checkOut}</span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {calculateWorkingHours(record.checkIn, record.checkOut)}
                      </TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                      {isAdmin && (
                        <TableCell className="font-mono text-xs text-gray-600 bg-gray-50">
                          {record.ipAddress}
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
