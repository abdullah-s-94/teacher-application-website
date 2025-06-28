import { Button } from "@/components/ui/button";
import logoPath from "@assets/انجال النخبة_1751014663653.jpg";
import { BarChart3, FileText, Home } from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  currentView: "application" | "admin";
  onViewChange: (view: "application" | "admin") => void;
  gender: 'male' | 'female';
}

export function Header({ currentView, onViewChange, gender }: HeaderProps) {
  const [, setLocation] = useLocation();
  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={logoPath} 
              alt="شعار مدارس أنجال النخبة" 
              className="h-16 w-16 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-primary">مدارس أنجال النخبة الأهلية</h1>
              <p className="text-slate-600">نظام التوظيف الإلكتروني</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="gap-2"
            >
              <Home className="h-5 w-5" />
              الصفحة الرئيسية
            </Button>
            <Button
              onClick={() => onViewChange("admin")}
              variant={currentView === "admin" ? "default" : "secondary"}
              className="gap-2"
            >
              <BarChart3 className="h-5 w-5" />
              لوحة التحكم
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
