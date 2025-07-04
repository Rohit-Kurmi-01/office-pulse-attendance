import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data for demonstration
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    email: 'admin@company.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    email: 'john.doe@company.com',
    password: 'employee123',
    name: 'John Doe',
    role: 'employee',
    isActive: true,
    createdAt: '2024-01-01'
  },
  {
    id: '3',
    email: 'jane.smith@company.com',
    password: 'employee123',
    name: 'Jane Smith',
    role: 'employee',
    isActive: true,
    createdAt: '2024-01-01'
  },
   {
    id: '4',
    email: 'rohit@gmail.com',
    password: '123',
    name: 'Rohit Kurmi',
    role: 'employee',
    isActive: true,
    createdAt: '2024-01-01'
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = '/'; // Force redirect to login
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      setUser, // Provide setUser in context
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
