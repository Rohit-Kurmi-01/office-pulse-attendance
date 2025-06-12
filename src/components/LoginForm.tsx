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
import { loginApi } from '@/lib/api';
import { useMobileBlock } from '@/hooks/use-mobile';

const LoginForm = () => {
  const isMobile = useMobileBlock();

  // All hooks must be called unconditionally
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-yellow-50">
        <div className="p-8 bg-white rounded shadow text-center">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">Mobile Not Supported</h1>
          <p className="text-gray-700">This website is not accessible on mobile devices. Please use a desktop or laptop browser.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Only send email and password
      const data = await loginApi(email, password);
      toast({
        title: 'Login Successful',
        description: 'Welcome to AttendanceTracker Pro',
      });
      if (data.payload?.auth_token) {
        localStorage.setItem('token', data.payload.auth_token);
        // Defensive: extract user fields from payload, fallback to empty/defaults
        const payload = data.payload as Record<string, unknown>;
        // Accept both id and user_id for compatibility
        const id = typeof payload.id === 'string' ? payload.id : (typeof payload.user_id === 'string' ? payload.user_id : String(payload.user_id ?? ''));
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

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Admin:</strong> admin@company.com / admin123</p>
              <p><strong>Employee:</strong> john.doe@company.com / employee123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
