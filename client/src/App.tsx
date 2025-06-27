import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/header";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import logoPath from "@assets/انجال النخبة_1751014663653.jpg";

function App() {
  const [currentView, setCurrentView] = useState<"application" | "admin">("application");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50">
          <Header currentView={currentView} onViewChange={setCurrentView} />
          
          {currentView === "admin" ? <Admin /> : <Home />}
          
          {/* Footer */}
          <footer className="bg-slate-800 text-white py-8 mt-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center gap-4">
                <img 
                  src={logoPath} 
                  alt="شعار مدارس أنجال النخبة" 
                  className="h-12 w-12 object-contain rounded-lg"
                />
                <div className="text-center">
                  <h3 className="text-lg font-bold">مدارس أنجال النخبة الأهلية</h3>
                  <p className="text-slate-300">نحو تعليم متميز وإبداع لا محدود</p>
                </div>
              </div>
              <div className="text-center mt-6 pt-6 border-t border-slate-700">
                <p className="text-slate-400 text-sm">© 2025 مدارس أنجال النخبة الأهلية. جميع الحقوق محفوظة.</p>
              </div>
            </div>
          </footer>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
