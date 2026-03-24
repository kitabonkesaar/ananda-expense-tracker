import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import TripsPage from "@/pages/TripsPage";
import TripDetailPage from "@/pages/TripDetailPage";
import AddExpensePage from "@/pages/AddExpensePage";
import ReportsPage from "@/pages/ReportsPage";
import AlertsPage from "@/pages/AlertsPage";
import TeamPage from "@/pages/TeamPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import SettingsPage from "@/pages/SettingsPage";
import AdminPanelPage from "@/pages/AdminPanelPage";
import ExpensesPage from "@/pages/ExpensesPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  // Mobile layout wrapper for standard user routes
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Admin Route (Desktop Layout) */}
        <Route path="/admin" element={<AdminPanelPage />} />
        
        {/* All Other Routes (Mobile Layout) */}
        <Route path="*" element={
          <>
            <AppHeader />
            <main className="max-w-lg mx-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/trips/:tripId" element={<TripDetailPage />} />
                <Route path="/add-expense" element={<AddExpensePage />} />
                
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <BottomNav />
          </>
        } />
      </Routes>
    </div>
  );
}

import SplashScreen from "@/components/SplashScreen";

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const wasShown = localStorage.getItem('pwaBannerShown');
      if (!wasShown) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
    localStorage.setItem('pwaBannerShown', 'true');
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {showSplash && <SplashScreen />}
          <Sonner />
          
          {/* One-time PWA Install Banner */}
          {showInstallBanner && (
            <div className="fixed top-4 left-4 right-4 z-[60] bg-[#128c7e] text-white p-4 rounded-2xl shadow-2xl animate-fade-up border border-white/20 flex items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                     <span className="font-black italic text-sm">BG</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-tight">Install Budget Guard</h4>
                    <p className="text-[10px] opacity-80 font-medium">Add to home screen for faster access</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => { setShowInstallBanner(false); localStorage.setItem('pwaBannerShown', 'true'); }}
                    className="text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Not now
                  </button>
                  <button 
                    onClick={handleInstallClick}
                    className="text-[10px] font-black bg-white text-[#128c7e] px-4 py-2 rounded-lg shadow-sm active:scale-95 transition-all"
                  >
                    Install
                  </button>
               </div>
            </div>
          )}

          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
