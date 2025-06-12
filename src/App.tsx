import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import React, { useEffect, useState } from "react";
import { checkTrialStatus } from "@/lib/api";

const queryClient = new QueryClient();

// Trial check logic
function useTrialStatus() {
  const [trialStatus, setTrialStatus] = useState<"checking" | "active" | "expired">("checking");
  const [trialMessage, setTrialMessage] = useState<string>("");

  useEffect(() => {
    checkTrialStatus().then(({ status, message }) => {
      if (status === "expired") {
        setTrialStatus("expired");
        setTrialMessage(message || "Trial expired. Please contact support.");
      } else {
        setTrialStatus("active");
      }
    });
  }, []);

  return { trialStatus, trialMessage };
}

const App = () => {
  const { trialStatus, trialMessage } = useTrialStatus();

  if (trialStatus === "checking") {
    return <div className="flex items-center justify-center h-screen">Checking trial status...</div>;
  }

  if (trialStatus === "expired") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50">
        <div className="p-8 bg-white rounded shadow text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Trial Expired</h1>
          <p className="text-gray-700">{trialMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
