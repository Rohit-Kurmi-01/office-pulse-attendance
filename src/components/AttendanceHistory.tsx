
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Search } from 'lucide-react';
import { AttendanceRecord } from '@/types';

interface AttendanceHistoryProps {
  userId?: string;
  isAdmin?: boolean;
}

const AttendanceHistory = ({ userId, isAdmin = false }: AttendanceHistoryProps) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

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
    
    setFilteredRecords(filtered);
  }, [records, searchTerm, dateFilter]);

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.checkIn && record.checkOut) {
      return <Badge className="bg-green-100 text-green-800">Present</Badge>;
    } else if (record.checkIn) {
      return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
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

  const exportToCSV = () => {
    const headers = ['Date', 'Employee', 'Check In', 'Check Out', 'Working Hours', 'Status', 'IP Address'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.date,
        record.userName,
        record.checkIn || '',
        record.checkOut || '',
        calculateWorkingHours(record.checkIn, record.checkOut),
        record.status,
        record.ipAddress
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Attendance History</span>
            </CardTitle>
            <CardDescription>
              {isAdmin ? 'All employee attendance records' : 'Your attendance history'}
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex space-x-4 mb-6">
          {isAdmin && (
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by employee name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}
          <div className="flex-1">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {isAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>IP Address</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 5} className="text-center py-8 text-gray-500">
                    No attendance records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    {isAdmin && <TableCell>{record.userName}</TableCell>}
                    <TableCell>{record.checkIn || '--'}</TableCell>
                    <TableCell>{record.checkOut || '--'}</TableCell>
                    <TableCell>{calculateWorkingHours(record.checkIn, record.checkOut)}</TableCell>
                    <TableCell>{getStatusBadge(record)}</TableCell>
                    {isAdmin && <TableCell className="font-mono text-xs">{record.ipAddress}</TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceHistory;
