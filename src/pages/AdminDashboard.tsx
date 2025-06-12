import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import AttendanceHistory from '@/components/AttendanceHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, UserPlus, Trash2, Plus, Settings } from 'lucide-react';
import { User, AllowedIP, AttendanceRecordDB } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, listAttendance, getTodayAttendance } from '@/lib/api';
import { getIPs, addIP, deleteIP } from '@/lib/api';
import { useAuth } from '@/context/useAuth';

function getWorkingDays(year: number, month: number, holidays: string[] = []) {
  let workingDays = 0;
  const date = new Date(year, month - 1, 1);
  const totalDays = new Date(year, month, 0).getDate();
  for (let day = 1; day <= totalDays; day++) {
    const currentDate = new Date(year, month - 1, day);
    const isSunday = currentDate.getDay() === 0;
    const formatted = currentDate.toISOString().split('T')[0];
    const isHoliday = holidays.includes(formatted);
    if (!isSunday && !isHoliday) {
      workingDays++;
    }
  }
  return workingDays;
}

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [allowedIPs, setAllowedIPs] = useState<AllowedIP[]>([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '' });
  const [newIP, setNewIP] = useState({ address: '', description: '' });
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showIPDialog, setShowIPDialog] = useState(false);
  const { toast } = useToast();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordDB[]>([]);
  const [loading, setLoading] = useState(true);

  // Add state for editing
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'employee', is_active: true });
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Add state for employee detail popup
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [showEmployeeDetailDialog, setShowEmployeeDetailDialog] = useState(false);

  // --- Add state for holidays ---
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState('');

  useEffect(() => {
    getEmployees()
      .then(setEmployees)
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load employees',
          variant: 'destructive',
        });
      });
    getIPs()
      .then(setAllowedIPs)
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load allowed IPs',
          variant: 'destructive',
        });
      });
    fetchAttendanceRecords();
  }, [toast]);

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      // Fetch all records for all users (history)
      const data = await listAttendance({});
      setAttendanceRecords(data);
      // Optionally, fetch today's record for a specific user:
      // const todayData = await getTodayAttendance(someUserId);
    } catch {
      setAttendanceRecords([]);
    }
    setLoading(false);
  };

  const getAttendanceStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter((r) => r.date === today);
    const totalEmployees = employees.length;
    // Consider present if check_in OR morning_check_in is set
    const presentToday = todayRecords.filter((r) => r.check_in || r.morning_check_in).length;
    const absentToday = totalEmployees - presentToday;
    return {
      totalEmployees,
      presentToday,
      absentToday,
      totalRecords: attendanceRecords.length
    };
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    try {
      const res = await addEmployee({ ...newEmployee, role: 'employee' });
      setEmployees([...employees, { ...newEmployee, id: res.id, role: 'employee', isActive: true, createdAt: new Date().toISOString().split('T')[0] }]);
      setNewEmployee({ name: '', email: '', password: '' });
      setShowEmployeeDialog(false);
      toast({
        title: "Employee Added",
        description: `${newEmployee.name} has been added successfully`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add employee';
      toast({
        title: "Error",
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await deleteEmployee(id);
      setEmployees(employees.filter(emp => emp.id !== id));
      toast({
        title: "Employee Removed",
        description: "Employee has been removed from the system",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete employee';
      toast({
        title: "Error",
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleAddIP = async () => {
    if (!newIP.address || !newIP.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }
    try {
      const res = await addIP({ ip_address: newIP.address, description: newIP.description });
      setAllowedIPs([
        ...allowedIPs,
        { id: res.id, address: newIP.address, description: newIP.description, addedAt: new Date().toISOString() }
      ]);
      setNewIP({ address: '', description: '' });
      setShowIPDialog(false);
      toast({
        title: 'IP Address Added',
        description: `${newIP.address} has been added to allowed IPs`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add IP';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteIP = async (id: string) => {
    try {
      await deleteIP(id);
      setAllowedIPs(allowedIPs.filter(ip => ip.id !== id));
      toast({
        title: 'IP Address Removed',
        description: 'IP address has been removed from allowed list',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove IP address';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (employee: User) => {
    setEditingEmployee(employee);
    setEditForm({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      is_active: employee.isActive,
    });
    setShowEditDialog(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;
    try {
      await updateEmployee(editingEmployee.id, editForm);
      setEmployees(employees.map(emp =>
      emp.id === editingEmployee.id
        ? {
            ...emp,
            name: editForm.name,
            email: editForm.email,
            role: editForm.role as 'employee' | 'admin',
            isActive: editForm.is_active,
          }
        : emp
    ));
      setShowEditDialog(false);
      setEditingEmployee(null);
      toast({
        title: 'Employee Updated',
        description: `${editForm.name} has been updated successfully`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update employee';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  // Helper to get stats for a specific employee for this month
  const getEmployeeMonthStats = (employeeId: string) => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const monthlyRecords = attendanceRecords.filter((r) => {
      const recordDate = new Date(r.date);
      return r.user_id === employeeId && recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear;
    });
    // Count days with both morning and evening sessions completed
    const presentDays = monthlyRecords.filter((r) => r.morning_check_in && r.morning_check_out && r.evening_check_in && r.evening_check_out).length;
    // Count days with only one session (partial)
    const partialDays = monthlyRecords.filter((r) =>
      (r.morning_check_in && r.morning_check_out && (!r.evening_check_in || !r.evening_check_out)) ||
      (r.evening_check_in && r.evening_check_out && (!r.morning_check_in || !r.morning_check_out))
    ).length;
    // Count days with no sessions (absent)
    const absentDays = monthlyRecords.length - presentDays - partialDays;
    const totalWorkingDays = new Date(thisYear, thisMonth + 1, 0).getDate();
    const attendanceRate = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;
    return { presentDays, partialDays, absentDays, attendanceRate, totalWorkingDays };
  };

  const stats = getAttendanceStats();

  if (!isAuthenticated || user?.role !== 'admin') {
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

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Cards - Show Total Employees, Present Today, Absent Today, and Total Records */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-md">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Users className="h-10 w-10 text-blue-500 mb-2" />
              <p className="text-lg font-semibold text-blue-700">Total Employees</p>
              <p className="text-3xl font-extrabold text-blue-900 mt-1">{stats.totalEmployees}</p>
              <p className="text-xs text-muted-foreground mt-1">Active employees</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-md">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Users className="h-10 w-10 text-green-500 mb-2" />
              <p className="text-lg font-semibold text-green-700">Present Today</p>
              <p className="text-3xl font-extrabold text-green-900 mt-1">{stats.presentToday}</p>
              <p className="text-xs text-muted-foreground mt-1">Checked in today</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-md">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Users className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-lg font-semibold text-red-700">Absent Today</p>
              <p className="text-3xl font-extrabold text-red-900 mt-1">{stats.absentToday}</p>
              <p className="text-xs text-muted-foreground mt-1">Not checked in</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 shadow-md">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Users className="h-10 w-10 text-purple-500 mb-2" />
              <p className="text-lg font-semibold text-purple-700">Total Records</p>
              <p className="text-3xl font-extrabold text-purple-900 mt-1">{stats.totalRecords}</p>
              <p className="text-xs text-muted-foreground mt-1">All attendance records</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Employee Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Employee Management</span>
                  </CardTitle>
                  <CardDescription>Manage employee accounts</CardDescription>
                </div>
                <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                      <DialogDescription>Create a new employee account</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newEmployee.name}
                          onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmployee.email}
                          onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                          placeholder="john.doe@company.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newEmployee.password}
                          onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                          placeholder="employee123"
                        />
                      </div>
                      <Button onClick={handleAddEmployee} className="w-full">
                        Add Employee
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-blue-700 hover:underline cursor-pointer" onClick={() => { setSelectedEmployee(employee); setShowEmployeeDetailDialog(true); console.log('Selected Employee:', employee); }}>
                        {employee.name}
                      </p>
                      <p className="text-sm text-gray-600">{employee.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{employee.isActive ? 'Active' : 'Inactive'}</Badge>
                      <Button size="sm" variant="outline" onClick={() => handleEditClick(employee)}>
                        Update
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteEmployee(employee.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* IP Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Allowed IP Addresses</span>
                  </CardTitle>
                  <CardDescription>Manage authorized office locations</CardDescription>
                </div>
                <Dialog open={showIPDialog} onOpenChange={setShowIPDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add IP
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Allowed IP Address</DialogTitle>
                      <DialogDescription>Add a new authorized office IP address</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ip-address">IP Address</Label>
                        <Input
                          id="ip-address"
                          value={newIP.address}
                          onChange={(e) => setNewIP({...newIP, address: e.target.value})}
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ip-description">Description</Label>
                        <Input
                          id="ip-description"
                          value={newIP.description}
                          onChange={(e) => setNewIP({...newIP, description: e.target.value})}
                          placeholder="Main Office - Floor 1"
                        />
                      </div>
                      <Button onClick={handleAddIP} className="w-full">
                        Add IP Address
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allowedIPs.map((ip) => (
                  <div key={ip.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-mono font-medium">{ip.address}</p>
                      <p className="text-sm text-gray-600">{ip.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteIP(ip.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance History */}
        <AttendanceHistory isAdmin={true} />
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="john.doe@company.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                className="w-full border rounded p-2"
                value={editForm.role}
                onChange={e => setEditForm({ ...editForm, role: e.target.value as 'employee' | 'admin' })}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <Label htmlFor="edit-active">Active</Label>
              <select
                id="edit-active"
                className="w-full border rounded p-2"
                value={editForm.is_active ? '1' : '0'}
                onChange={e => setEditForm({ ...editForm, is_active: e.target.value === '1' })}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <Button onClick={handleUpdateEmployee} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Detail Dialog */}
      <Dialog open={showEmployeeDetailDialog} onOpenChange={setShowEmployeeDetailDialog}>
        <DialogContent className="max-w-6xl w-full p-0 overflow-visible">
          <div className="bg-gray-50 p-6 flex flex-col gap-4 border-b">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
              <DialogDescription>
                {selectedEmployee && (
                  <span className="font-semibold text-lg">{selectedEmployee.name} ({selectedEmployee.email})</span>
                )}
              </DialogDescription>
              {selectedEmployee && (
                <div className="mb-2">
                  {(() => {
                    const thisMonth = new Date().getMonth() + 1;
                    const thisYear = new Date().getFullYear();
                    const stats = getEmployeeMonthStats(selectedEmployee.user_id);
                    const totalWorkingDays = getWorkingDays(thisYear, thisMonth, holidays);
                    return (
                      <>
                        <div><b>This Month Present:</b> {stats.presentDays} days</div>
                        <div><b>Attendance Rate:</b> {stats.attendanceRate}%</div>
                        <div><b>Total Working Days:</b> {totalWorkingDays}</div>
                        <div className="mt-2">
                          <b>Holidays:</b>
                          <ul className="list-disc ml-6 text-sm text-gray-700">
                            {holidays.length === 0 && <li className="text-gray-400">No holidays set</li>}
                            {holidays.map(date => (
                              <li key={date} className="flex items-center justify-between">
                                <span>{date}</span>
                                <button
                                  className="ml-2 text-xs text-red-500 hover:underline"
                                  onClick={() => setHolidays(holidays.filter(h => h !== date))}
                                >Remove</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </DialogHeader>
          </div>
          <div className="p-0">
            {selectedEmployee && (
              <AttendanceHistory userId={selectedEmployee.user_id} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminDashboard;
