import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { getIPs } from '@/lib/api';
import { AllowedIP } from '@/types';
import { useAuth } from '@/context/useAuth';

// Simulate getting user's IP
const getCurrentIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const ipAddress: string = data.ip;
    console.log('IP Address:', ipAddress);
    return ipAddress;
  } catch (error) {
    console.error('Error fetching IP:', error);
    // Fallback: return empty string if fetching fails
    return '';
  }
};

interface IPVerificationProps {
  onVerificationChange: (isAllowed: boolean, ip: string) => void;
}

const IPVerification = ({ onVerificationChange }: IPVerificationProps) => {
  const [currentIP, setCurrentIP] = useState<string>('');
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [allowedIPs, setAllowedIPs] = useState<string[]>([]);
  const [ipsLoaded, setIPsLoaded] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setUser, logout } = useAuth();

  useEffect(() => {
    // Fetch allowed IPs from API
    getIPs()
      .then((ips: AllowedIP[]) => {
        // Normalize all IPs to string and trim whitespace
        const normalized = ips.map(ip =>
          ('address' in ip ? String(ip.address).trim() : String((ip as { ip_address: string }).ip_address).trim())
        );
        setAllowedIPs(normalized);
        setIPsLoaded(true);
        console.log('Allowed IPs from backend:', normalized);
      })
      .catch(() => {
        setAllowedIPs([]);
        setIPsLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!ipsLoaded) return;
    const checkIP = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const ip = (await getCurrentIP()).trim();
      // Debug log
      console.log('Current IP:', ip, 'Allowed IPs:', allowedIPs);
      // If no allowed IPs are set, allow all employees
      const allowed = allowedIPs.length === 0 ? true : allowedIPs.includes(ip);
      setCurrentIP(ip);
      setIsAllowed(allowed);
      setLoading(false);
      onVerificationChange(allowed, ip);
    };

    checkIP();
  }, [ipsLoaded, allowedIPs, onVerificationChange]);

  // Redirect to login if not allowed and not loading
  useEffect(() => {
    let logoutTimeout: ReturnType<typeof setTimeout> | undefined;
    if (!loading && !isAllowed) {
      // Only redirect if not already on login page
      if (window.location.pathname !== '/') {
        const timeout = setTimeout(() => {
          // Clear all auth/cache and context and redirect to login
          if (setUser) setUser(null);
          if (typeof logout === 'function') logout();
          localStorage.removeItem('currentUser');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          window.location.href = '/';
        }, 2000);
        return () => {
          clearTimeout(timeout);
          if (logoutTimeout) clearTimeout(logoutTimeout);
        };
      } else {
        // If already on login page, just clear auth/cache and context
        if (setUser) setUser(null);
        if (typeof logout === 'function') logout();
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
    }
  }, [isAllowed, loading, navigate, setUser, logout]);

  if (loading) {
    return (
      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Verifying your location and IP address...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`mb-6 ${isAllowed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      {isAllowed ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
      <AlertDescription className={isAllowed ? 'text-green-800' : 'text-red-800'}>
        <strong>IP Address:</strong> {currentIP}
        <br />
        <strong>Status:</strong> {isAllowed ? 'Authorized office location' : 'Unauthorized location - attendance not allowed'}
        {!isAllowed && (
          <div className="mt-2 text-sm">
            Please ensure you are connected to the office network to mark attendance.
            Redirecting to the login page.
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default IPVerification;