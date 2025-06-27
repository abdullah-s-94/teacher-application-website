import { Button } from "@/components/ui/button";
import logoPath from "@assets/انجال النخبة_1751014663653.jpg";
import { FileText, BarChart3 } from "lucide-react";

interface HeaderProps {
  currentView: "application" | "admin";
  onViewChange: (view: "application" | "admin") => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
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
              onClick={() => onViewChange("application")}
              variant={currentView === "application" ? "default" : "secondary"}
              className="gap-2"
            >
              <FileText className="h-5 w-5" />
              تقديم طلب
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
