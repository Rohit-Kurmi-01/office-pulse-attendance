import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addAttendance, updateAttendance, getTodayAttendance } from '@/lib/api';
import { useAuth } from '@/context/useAuth';


import { calculateSessionDuration } from '@/components/helper/timeHelper';

export type AttendanceRecordDB = {
  id: string;
  user_id: string;
  username: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'present' | 'absent' | 'partial' | 'half-day';
  ip_address: string;
  workingHours: string;
  // Add morning/evening fields
  morning_check_in?: string;
  morning_check_out?: string;
  evening_check_in?: string;
  evening_check_out?: string;
};

interface AttendanceCardProps {
  user_id: string;
  username: string;
  isIPAllowed: boolean;
  currentIP: string;
  onAttendanceUpdate: (record: AttendanceRecordDB) => void;
  todayRecordFromParent?: AttendanceRecordDB;
}

const AttendanceCard = (props: AttendanceCardProps) => {
  const { user } = useAuth();
  const user_id = user?.id || props.user_id;
  const username = user?.name || props.username;
  const [todayRecord, setTodayRecord] = useState<AttendanceRecordDB | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const showMissingUser = !user_id;

  const fetchTodayRecord = async () => {
    try {
      const records = await getTodayAttendance(user_id);
      setTodayRecord(records?.[0] || null);
    } catch {
      setTodayRecord(null);
    }
  };

  useEffect(() => {
    if (!showMissingUser && user_id && today) {
      fetchTodayRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMissingUser, user_id, today]);

  // If todayRecordFromParent is provided, always use it
  useEffect(() => {
    if (props.todayRecordFromParent) {
      setTodayRecord(props.todayRecordFromParent);
    }
  }, [props.todayRecordFromParent]);

  const handleMorningCheckIn = async () => {
    if (!props.isIPAllowed) {
      toast({
        title: "Access Denied",
        description: "You can only check in from authorized office locations.",
        variant: "destructive"
      });
      return;
    }
    if (todayRecord?.morning_check_in) {
      toast({
        title: "Already Checked In (Morning)",
        description: "You have already checked in for morning today.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    const now = new Date();
    const checkInTime = now.toLocaleTimeString();
    let updatedRecord: AttendanceRecordDB;
    if (!todayRecord) {
      updatedRecord = {
        id: '',
        user_id,
        username,
        date: today,
        check_in: checkInTime, // always set
        check_out: '',
        status: 'present',
        ip_address: props.currentIP,
        workingHours: '',
        morning_check_in: checkInTime,
        morning_check_out: '',
        evening_check_in: '',
        evening_check_out: ''
      };
      try {
        await addAttendance(updatedRecord);
        await fetchTodayRecord();
        props.onAttendanceUpdate(updatedRecord);
        toast({
          title: "Check-in Successful",
          description: `Welcome! You checked in at ${checkInTime}`,
        });
      } catch (err: unknown) {
        toast({
          title: "Check-in Failed",
          description: err instanceof Error ? err.message : 'Could not check in.',
          variant: 'destructive'
        });
        setTodayRecord(null);
      }
    } else {
      updatedRecord = { ...todayRecord, morning_check_in: checkInTime, check_in: checkInTime };
      try {
        await updateAttendance(todayRecord.id, updatedRecord);
        setTodayRecord(updatedRecord);
        toast({
          title: "Check-in Successful",
          description: `Welcome! You checked in at ${checkInTime}`,
        });
      } catch (err: unknown) {
        toast({
          title: "Check-in Failed",
          description: err instanceof Error ? err.message : 'Could not check in.',
          variant: 'destructive'
        });
      }
    }
    setLoading(false);
  };

  // Morning Check Out handler
  const handleMorningCheckOut = async () => {
    if (!todayRecord?.morning_check_in) {
      toast({
        title: "Cannot Check Out (Morning)",
        description: "You must check in for morning before morning check out.",
        variant: "destructive"
      });
      return;
    }
    if (todayRecord?.morning_check_out) {
      toast({
        title: "Already Checked Out (Morning)",
        description: `You have already checked out for morning at ${todayRecord.morning_check_out}`,
        variant: "destructive"
      });
      return;
    }
    const now = new Date().toLocaleTimeString();
    try {
      // Calculate working hours after this check out
      const updatedRecord = { ...todayRecord, morning_check_out: now };
      const working = calculateWorkingHours(updatedRecord);
      updatedRecord.workingHours = working.readable !== '--' ? working.readable : '';
      await updateAttendance(todayRecord.id, updatedRecord);
      setTodayRecord(updatedRecord);
      toast({
        title: "Morning Check Out Successful",
        description: `Checked out for morning at ${now}`,
      });
    } catch (err) {
      toast({
        title: "Morning Check Out Failed",
        description: err instanceof Error ? err.message : 'Could not check out for morning.',
        variant: 'destructive'
      });
    }
  };
  

  // Evening Check In handler
  const handleEveningCheckIn = async () => {
    if (!todayRecord?.morning_check_out) {
      toast({
        title: "Cannot Check In (Evening)",
        description: "You must check out for morning before evening check in.",
        variant: "destructive"
      });
      return;
    }
    if (todayRecord?.evening_check_in) {
      toast({
        title: "Already Checked In (Evening)",
        description: `You have already checked in for evening at ${todayRecord.evening_check_in}`,
        variant: "destructive"
      });
      return;
    }
    const now = new Date().toLocaleTimeString();
    try {
      const updatedRecord = { ...todayRecord, evening_check_in: now };
      await updateAttendance(todayRecord.id, updatedRecord);
      setTodayRecord(updatedRecord);
      toast({
        title: "Evening Check In Successful",
        description: `Checked in for evening at ${now}`,
      });
    } catch (err) {
      toast({
        title: "Evening Check In Failed",
        description: err instanceof Error ? err.message : 'Could not check in for evening.',
        variant: 'destructive'
      });
    }
  };

  // Evening Check Out handler
  const handleEveningCheckOut = async () => {
    if (!todayRecord?.evening_check_in) {
      toast({
        title: "Cannot Check Out (Evening)",
        description: "You must check in for evening before evening check out.",
        variant: "destructive"
      });
      return;
    }
    if (todayRecord?.evening_check_out) {
      toast({
        title: "Already Checked Out (Evening)",
        description: `You have already checked out for evening at ${todayRecord.evening_check_out}`,
        variant: "destructive"
      });
      return;
    }
    const now = new Date().toLocaleTimeString();
    try {
      // Calculate working hours after this check out
      const updatedRecord = { ...todayRecord, evening_check_out: now };
      const working = calculateWorkingHours(updatedRecord);
      updatedRecord.workingHours = working.readable !== '--' ? working.readable : '';
      await updateAttendance(todayRecord.id, updatedRecord);
      setTodayRecord(updatedRecord);
      toast({
        title: "Evening Check Out Successful",
        description: `Checked out for evening at ${now}`,
      });
    } catch (err) {
      toast({
        title: "Evening Check Out Failed",
        description: err instanceof Error ? err.message : 'Could not check out for evening.',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = () => {
    if (!todayRecord?.check_in) return 'text-gray-500';
    if (todayRecord.check_out) return 'text-green-600';
    return 'text-blue-600';
  };

  const getStatusText = () => {
    if (!todayRecord?.check_in) return 'Not checked in';
    if (todayRecord.check_out) return 'Checked out';
    return 'Checked in';
  };

  

   // Robust working hours calculation (matches AttendanceHistory.tsx)
   const calculateWorkingHours = (record: AttendanceRecordDB) => {
     const today = new Date().toISOString().split('T')[0];
     // Helper to get seconds between two time strings
     const getSessionSeconds = (inTime?: string, outTime?: string) => {
       if (!inTime || !outTime) return 0;
       const inDate = new Date(`${today} ${inTime}`);
       const outDate = new Date(`${today} ${outTime}`);
       if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) return 0;
       return Math.max((outDate.getTime() - inDate.getTime()) / 1000, 0);
     };
     // Format seconds as HH:mm
     const formatDuration = (seconds: number) => {
       if (seconds <= 0) return '--';
       const hours = Math.floor(seconds / 3600);
       const minutes = Math.floor((seconds % 3600) / 60);
       return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
     };
     const morningSeconds = getSessionSeconds(record.morning_check_in, record.morning_check_out);
     const eveningSeconds = getSessionSeconds(record.evening_check_in, record.evening_check_out);
     const totalSeconds = morningSeconds + eveningSeconds;
     const totalReadable = formatDuration(totalSeconds);
     return { readable: totalReadable, seconds: totalSeconds };
   }

  if (showMissingUser) {
    return (
      <div className="text-center mt-10 text-red-600 font-bold">
        User ID is missing. Please log in again.<br />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Morning log In</p>
              <p className="font-semibold text-green-700">
                {todayRecord.morning_check_in || '--:--'}
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Morning log Out</p>
              <p className="font-semibold text-green-700">
                {todayRecord.morning_check_out || '--:--'}
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Evening log In</p>
              <p className="font-semibold text-blue-700">
                {todayRecord.evening_check_in || '--:--'}
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Evening log Out</p>
              <p className="font-semibold text-blue-700">
                {todayRecord.evening_check_out || '--:--'}
              </p>
            </div>
          </div>
        )}

        {/* Working Hours Section - Always aligned and clear */}
        <div className="flex flex-col items-center justify-center mt-2">
          <span className="font-bold text-gray-700">Working Hours:</span>
          <span className="inline-block mt-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-lg tracking-wide min-w-[120px] text-center">
            {todayRecord ? calculateWorkingHours(todayRecord).readable : '--'} <span className="font-normal text-xs">hours</span>
          </span>
        </div>

        <div className="flex space-x-3 mt-4">
          <Button
            onClick={handleMorningCheckIn}
            disabled={
              loading ||
              !!todayRecord?.morning_check_in ||
              !props.isIPAllowed
            }
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Morning log In
          </Button>
          <Button
            onClick={handleMorningCheckOut}
            disabled={
              loading ||
              !todayRecord?.morning_check_in ||
              !!todayRecord?.morning_check_out ||
              !props.isIPAllowed
            }
            variant="outline"
            className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Morning log Out
          </Button>
        </div>
        <div className="flex space-x-3 mt-2">
          <Button
            onClick={handleEveningCheckIn}
            disabled={
              loading ||
              !todayRecord?.morning_check_out ||
              !!todayRecord?.evening_check_in ||
              !props.isIPAllowed
            }
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Evening log In
          </Button>
          <Button
            onClick={handleEveningCheckOut}
            disabled={
              loading ||
              !todayRecord?.evening_check_in ||
              !!todayRecord?.evening_check_out ||
              !props.isIPAllowed
            }
            variant="outline"
            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Evening log Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceCard;




