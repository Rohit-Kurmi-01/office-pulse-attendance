
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AttendanceRecord } from '@/types';

interface AttendanceCardProps {
  userId: string;
  userName: string;
  isIPAllowed: boolean;
  currentIP: string;
  onAttendanceUpdate: (record: AttendanceRecord) => void;
}

const AttendanceCard = ({ userId, userName, isIPAllowed, currentIP, onAttendanceUpdate }: AttendanceCardProps) => {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Load today's attendance record from localStorage
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const todayRec = records.find((r: AttendanceRecord) => 
      r.userId === userId && r.date === today
    );
    setTodayRecord(todayRec || null);
  }, [userId, today]);

  const handleCheckIn = async () => {
    if (!isIPAllowed) {
      toast({
        title: "Access Denied",
        description: "You can only check in from authorized office locations.",
        variant: "destructive"
      });
      return;
    }

    if (todayRecord?.checkIn) {
      toast({
        title: "Already Checked In",
        description: "You have already checked in today.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId,
      userName,
      date: today,
      checkIn: new Date().toLocaleTimeString(),
      status: 'present',
      ipAddress: currentIP
    };

    // Save to localStorage
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const existingIndex = records.findIndex((r: AttendanceRecord) => 
      r.userId === userId && r.date === today
    );

    if (existingIndex >= 0) {
      records[existingIndex] = { ...records[existingIndex], ...newRecord };
    } else {
      records.push(newRecord);
    }

    localStorage.setItem('attendanceRecords', JSON.stringify(records));
    setTodayRecord(newRecord);
    onAttendanceUpdate(newRecord);
    setLoading(false);

    toast({
      title: "Check-in Successful",
      description: `Welcome! You checked in at ${newRecord.checkIn}`,
    });
  };

  const handleCheckOut = async () => {
    if (!todayRecord?.checkIn) {
      toast({
        title: "Cannot Check Out",
        description: "You must check in first before checking out.",
        variant: "destructive"
      });
      return;
    }

    if (todayRecord?.checkOut) {
      toast({
        title: "Already Checked Out",
        description: "You have already checked out today.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedRecord = {
      ...todayRecord,
      checkOut: new Date().toLocaleTimeString()
    };

    // Save to localStorage
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const index = records.findIndex((r: AttendanceRecord) => 
      r.userId === userId && r.date === today
    );

    if (index >= 0) {
      records[index] = updatedRecord;
      localStorage.setItem('attendanceRecords', JSON.stringify(records));
      setTodayRecord(updatedRecord);
      onAttendanceUpdate(updatedRecord);
    }

    setLoading(false);

    toast({
      title: "Check-out Successful",
      description: `See you tomorrow! You checked out at ${updatedRecord.checkOut}`,
    });
  };

  const getStatusColor = () => {
    if (!todayRecord?.checkIn) return 'text-gray-500';
    if (todayRecord.checkOut) return 'text-green-600';
    return 'text-blue-600';
  };

  const getStatusText = () => {
    if (!todayRecord?.checkIn) return 'Not checked in';
    if (todayRecord.checkOut) return 'Checked out';
    return 'Checked in';
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span>Today's Attendance</span>
        </CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-600">Status:</span>
          </div>
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {todayRecord && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Check In</p>
              <p className="font-semibold text-green-700">
                {todayRecord.checkIn || '--:--'}
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Check Out</p>
              <p className="font-semibold text-red-700">
                {todayRecord.checkOut || '--:--'}
              </p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            onClick={handleCheckIn}
            disabled={loading || !!todayRecord?.checkIn || !isIPAllowed}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Check In
          </Button>
          
          <Button
            onClick={handleCheckOut}
            disabled={loading || !todayRecord?.checkIn || !!todayRecord?.checkOut}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Check Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceCard;
