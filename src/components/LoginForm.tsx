import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Lock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { loginApi, addDeviceFingerprint, listActiveDeviceFingerprints } from '@/lib/api';
import { useMobileBlock } from '@/hooks/use-mobile';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const LoginForm = () => {
  // const isMobile = useMobileBlock();

  // All hooks must be called unconditionally
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [activeFingerprints, setActiveFingerprints] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // If auth token is present, redirect to dashboard
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    const currentPath = window.location.pathname;
    // Only redirect if not already on a dashboard route
    if (token && userData && currentPath === '/') {
      try {
        const user = JSON.parse(userData);
        if (user.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/employee-dashboard');
        }
      } catch {
        // fallback: just go to employee dashboard
        navigate('/employee-dashboard');
      }
    }
  }, [navigate]);

  // if (isMobile) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-screen bg-yellow-50">
  //       <div className="p-8 bg-white rounded shadow text-center">
  //         <h1 className="text-2xl font-bold text-yellow-600 mb-4">Mobile Not Supported</h1>
  //         <p className="text-gray-700">This website is not accessible on mobile devices. Please use a desktop or laptop browser.</p>
  //       </div>
  //     </div>
  //   );
  // }

  useEffect(() => {
    FingerprintJS.load().then(fp => fp.get()).then(result => {
      setDeviceFingerprint(result.visitorId);
    });
  }, []);

  // Fetch active fingerprints for the entered email/user
  useEffect(() => {
    const fetchActiveFingerprints = async () => {
      if (!email) {
        setActiveFingerprints([]);
        return;
      }
      try {
        // Try to get user id by email from employees (if available)
        // For now, try both id and email as id for demo/debug
        // In production, you should map email to user_id via an API
        const userId = email; // fallback if you don't have userId
        const fps = await listActiveDeviceFingerprints(userId);
        setActiveFingerprints(fps.map(fp => fp.fingerprints));
      } catch {
        setActiveFingerprints([]);
      }
    };
    fetchActiveFingerprints();
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Only send email and password
      const data = await loginApi(email, password);
      // Defensive: extract user fields from payload, fallback to empty/defaults
      const payload = data.payload as Record<string, unknown>;
      const id = typeof payload.id === 'string' ? payload.id : (typeof payload.user_id === 'string' ? payload.user_id : String(payload.user_id ?? ''));
      const role = payload.role === 'admin' || payload.role === 'employee' ? payload.role : 'employee';
      // Admins skip device fingerprint check
      if (role !== 'admin') {
        try {
          const fp = await FingerprintJS.load();
          const result = await fp.get();
          const visitorId = result.visitorId;
          // Debug: log visitorId and active fingerprints
          console.log('Device visitorId:', visitorId);
          const activeFingerprints = await listActiveDeviceFingerprints(id);
          console.log('Active fingerprints for user:', activeFingerprints.map(fp => fp.fingerprints));
          const match = activeFingerprints.find(fp => fp.fingerprints === visitorId);
          if (!match) {
            // Register this device fingerprint with status 0 for admin approval
            try {
              await addDeviceFingerprint({
                user_id: id,
                fingerprints: visitorId,
                created_at: new Date().toISOString(),
                status: '0',
              });
              setError('Device not matched. Your device has been sent for admin approval.');
            } catch (addErr) {
              setError('Device not matched and failed to register device for approval.');
            }
            setLoading(false);
            return;
          }
          // If matched, skip generating/sending new fingerprint
          localStorage.setItem('deviceFingerprint', visitorId);
        } catch (fpErr) {
          setError('Device fingerprint check failed. Please try again.');
          setLoading(false);
          return;
        }
      }
      // If fingerprint matches or admin, continue login
      toast({
        title: 'Login Successful',
        description: 'Welcome to AttendanceTracker Pro',
      });
      if (data.payload?.auth_token) {
        localStorage.setItem('token', data.payload.auth_token);
        const name = typeof payload.name === 'string' ? payload.name : '';
        let role: 'admin' | 'employee' = 'employee';
        if (payload.role === 'admin' || payload.role === 'employee') role = payload.role;
        const isActive = payload.is_active === '1' || payload.is_active === 1 || payload.is_active === true;
        const createdAt = typeof payload.created_at === 'string' ? payload.created_at : new Date().toISOString().split('T')[0];
        const currentUser = {
          id,
          name,
          email: typeof payload.email === 'string' ? payload.email : '',
          role,
          isActive,
          createdAt
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (setUser) setUser(currentUser);
        localStorage.setItem('userData', JSON.stringify(currentUser));
      }
      // Redirect based on user role from backend
      if (data.payload && 'role' in data.payload) {
        const userRole = (data.payload as { role?: string }).role;
        if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/employee-dashboard');
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'An error occurred during login');
      } else {
        setError('An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">AttendanceTracker Pro</CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to access your attendance dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Password</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

         
        </CardContent>
        {deviceFingerprint && (
          <div className="mt-4 text-center text-xs text-gray-500 select-all break-all">
            <span className="font-semibold text-gray-700">Device Fingerprint:</span><br />
            <span>{deviceFingerprint}</span>
            {activeFingerprints.length > 0 && (
              <div className="mt-2">
                <span className="font-semibold text-gray-700">Active Fingerprints for this user:</span>
                <ul className="mt-1 text-xs text-gray-500">
                  {activeFingerprints.map((fp, idx) => (
                    <li key={idx} className="break-all">{fp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default LoginForm;
