import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router, Route } from "wouter";
import GenderSelection from "@/pages/gender-selection";
import AdminSelection from "@/pages/admin-selection";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import AdminRecovery from "@/pages/admin-recovery";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <div className="min-h-screen bg-slate-50">
            <Route path="/" component={GenderSelection} />
            <Route path="/application" component={Home} />
            <Route path="/admin" component={AdminSelection} />
            <Route path="/admin/dashboard" component={Admin} />
            <Route path="/admin/recovery" component={AdminRecovery} />
          </div>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
