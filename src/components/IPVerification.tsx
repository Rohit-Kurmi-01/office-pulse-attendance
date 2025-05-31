
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

// Mock allowed IPs for demonstration
const allowedIPs = [
  '192.168.1.100',
  '192.168.1.101',
  '10.0.0.50',
  '203.0.113.1'
];

// Simulate getting user's IP
const getCurrentIP = (): string => {
  // In a real application, this would be fetched from the backend
  const mockIPs = [...allowedIPs, '192.168.1.200', '10.0.0.75'];
  return mockIPs[Math.floor(Math.random() * mockIPs.length)];
};

interface IPVerificationProps {
  onVerificationChange: (isAllowed: boolean, ip: string) => void;
}

const IPVerification = ({ onVerificationChange }: IPVerificationProps) => {
  const [currentIP, setCurrentIP] = useState<string>('');
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkIP = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const ip = getCurrentIP();
      const allowed = allowedIPs.includes(ip);
      
      setCurrentIP(ip);
      setIsAllowed(allowed);
      setLoading(false);
      
      onVerificationChange(allowed, ip);
    };

    checkIP();
  }, [onVerificationChange]);

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
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default IPVerification;
