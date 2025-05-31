
import React, { useState, useEffect } from 'react';
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
import { User, AllowedIP, AttendanceRecord } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [allowedIPs, setAllowedIPs] = useState<AllowedIP[]>([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '' });
  const [newIP, setNewIP] = useState({ address: '', description: '' });
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showIPDialog, setShowIPDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load employees (excluding current admin)
    const mockEmployees: User[] = [
      {
        id: '2',
        email: 'john.doe@company.com',
        name: 'John Doe',
        role: 'employee',
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: '3',
        email: 'jane.smith@company.com',
        name: 'Jane Smith',
        role: 'employee',
        isActive: true,
        createdAt: '2024-01-01'
      }
    ];
    setEmployees(mockEmployees);

    // Load allowed IPs
    const mockIPs: AllowedIP[] = [
      { id: '1', address: '192.168.1.100', description: 'Main Office - Floor 1', addedAt: '2024-01-01' },
      { id: '2', address: '192.168.1.101', description: 'Main Office - Floor 2', addedAt: '2024-01-01' },
      { id: '3', address: '10.0.0.50', description: 'Branch Office', addedAt: '2024-01-01' },
      { id: '4', address: '203.0.113.1', description: 'Remote Office', addedAt: '2024-01-01' }
    ];
    setAllowedIPs(mockIPs);
  }, []);

  const getAttendanceStats = () => {
    const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter((r: AttendanceRecord) => r.date === today);
    
    const totalEmployees = employees.length;
    const presentToday = todayRecords.filter((r: AttendanceRecord) => r.checkIn).length;
    const absentToday = totalEmployees - presentToday;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      totalRecords: records.length
    };
  };

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const employee: User = {
      id: Date.now().toString(),
      email: newEmployee.email,
      name: newEmployee.name,
      role: 'employee',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setEmployees([...employees, employee]);
    setNewEmployee({ name: '', email: '', password: '' });
    setShowEmployeeDialog(false);
    
    toast({
      title: "Employee Added",
      description: `${employee.name} has been added successfully`,
    });
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    toast({
      title: "Employee Removed",
      description: "Employee has been removed from the system",
    });
  };

  const handleAddIP = () => {
    if (!newIP.address || !newIP.description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const ip: AllowedIP = {
      id: Date.now().toString(),
      address: newIP.address,
      description: newIP.description,
      addedAt: new Date().toISOString().split('T')[0]
    };

    setAllowedIPs([...allowedIPs, ip]);
    setNewIP({ address: '', description: '' });
    setShowIPDialog(false);
    
    toast({
      title: "IP Address Added",
      description: `${ip.address} has been added to allowed IPs`,
    });
  };

  const handleDeleteIP = (id: string) => {
    setAllowedIPs(allowedIPs.filter(ip => ip.id !== id));
    toast({
      title: "IP Address Removed",
      description: "IP address has been removed from allowed list",
    });
  };

  const stats = getAttendanceStats();

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
              <p className="text-xs text-muted-foreground">Checked in today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
              <Users className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
              <p className="text-xs text-muted-foreground">Not checked in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecords}</div>
              <p className="text-xs text-muted-foreground">All attendance records</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-gray-600">{employee.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Active</Badge>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
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
    </Layout>
  );
};

export default AdminDashboard;
