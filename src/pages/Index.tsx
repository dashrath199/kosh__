import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Settings } from "@/components/Settings";
import Hero from "@/components/Hero";
import AuthSection from "@/components/AuthSection";
import Dashboard from "@/components/Dashboard";
import Navigation from "@/components/Navigation";
import BankLink from "@/components/BankLink";
import Investments from "@/components/Investments";
import GetPayment from "@/components/GetPayment";
import Goals from "@/components/Goals";
import Analytics from "@/components/Analytics";

const queryClient = new QueryClient();

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'dashboard'>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [dashboardView, setDashboardView] = useState('dashboard');

  const handleGetStarted = () => {
    setCurrentView('auth');
  };

  const handleAuthenticated = (u: { name: string; email: string; phone: string }) => {
    setUser(u);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('landing');
    setUser(null);
  };

  if (currentView === 'landing') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen">
            <Hero onGetStarted={handleGetStarted} />
            <div className="fixed bottom-8 right-8">
              <button
                onClick={handleGetStarted}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Get Started →
              </button>
            </div>
          </div>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentView === 'auth') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div>
            <AuthSection onAuthenticated={handleAuthenticated} />
            <div className="fixed bottom-4 left-4">
              <button
                onClick={() => setCurrentView('landing')}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation
            currentView={dashboardView}
            onViewChange={setDashboardView}
            onLogout={handleLogout}
          />
          <main className="container mx-auto px-4 py-8">
            {dashboardView === 'dashboard' && <Dashboard user={user} />}
            {dashboardView === 'bank' && <BankLink />}
            {dashboardView === 'get-payment' && (
              <GetPayment onGoToDashboard={() => setDashboardView('dashboard')} />
            )}
            {dashboardView === 'investments' && <Investments />}
            {dashboardView === 'goals' && <Goals />}
            {dashboardView === 'analytics' && <Analytics />}
            {dashboardView === 'settings' && <Settings />}
          </main>
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default Index;