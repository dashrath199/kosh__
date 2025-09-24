import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Hero from "@/components/Hero";
import AuthSection from "@/components/AuthSection";
import Dashboard from "@/components/Dashboard";
import Navigation from "@/components/Navigation";
import BankLink from "@/components/BankLink";
import Transactions from "@/components/Transactions";
import Investments from "@/components/Investments";

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
            {/* Add action handlers to Hero buttons */}
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
            {dashboardView === 'dashboard' && <Dashboard />}
            {dashboardView === 'bank' && <BankLink />}
            {dashboardView === 'transactions' && <Transactions />}
            {dashboardView === 'investments' && <Investments />}
            {dashboardView === 'goals' && (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Goals Management</h2>
                <p className="text-muted-foreground">Coming soon - Advanced goal tracking and management</p>
              </div>
            )}
            {dashboardView === 'analytics' && (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Analytics & Reports</h2>
                <p className="text-muted-foreground">Coming soon - Detailed financial analytics</p>
              </div>
            )}
            {dashboardView === 'settings' && (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <p className="text-muted-foreground">Coming soon - Account and app settings</p>
              </div>
            )}
          </main>
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default Index;
