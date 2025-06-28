import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Users, UserCheck, Shield, Home, LogOut } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function AdminSelection() {
  const [, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("adminLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  const handleSelection = (gender: 'male' | 'female') => {
    console.log("Admin selection:", gender);
    setLocation(`/admin?gender=${gender}`);
  };

  const handleLogout = () => {
    // Clear all admin-related data
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUser");
    console.log("Admin logged out successfully");
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden" dir="rtl">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-slate-200/30 to-gray-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-slate-200/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-gradient-to-r from-slate-100/40 to-gray-100/40 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-6 animate-fade-in">
            <div className="relative">
              <Shield className="h-14 w-14 text-slate-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-200/20 to-gray-200/20 rounded-full blur-lg"></div>
            </div>
            <h1 className="text-5xl font-bold text-slate-800 arabic-text">
              لوحة التحكم الإدارية
            </h1>
          </div>
          <div className="relative inline-block mb-8 animate-float">
            <p className="text-xl text-slate-600 px-6 py-3 bg-white/70 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-lg animate-glow arabic-text">
              مدارس أنجال النخبة الأهلية
            </p>
          </div>
          <h2 className="text-2xl font-semibold text-slate-700 mb-6 animate-fade-in arabic-text">
            اختر المجمع التعليمي المراد إدارته
          </h2>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Boys Complex Admin */}
          <Card className="group cursor-pointer bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center" onClick={() => handleSelection('male')}>
              <div className="mb-6">
                <div className="relative inline-block">
                  <UserCheck className="h-20 w-20 text-slate-600 mx-auto mb-4 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300" />
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-100/50 to-slate-100/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-slate-900 transition-colors arabic-text">
                  إدارة المجمع التعليمي - بنين
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed arabic-text">
                  عرض وإدارة طلبات التوظيف المقدمة لقسم البنين
                </p>
              </div>
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 rounded-xl transition-all duration-300 group-hover:shadow-lg flex items-center justify-center gap-2 arabic-text"
              >
                عرض ملفات البنين
                <Users className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </CardContent>
          </Card>

          {/* Girls Complex Admin */}
          <Card className="group cursor-pointer bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden">
            <CardContent className="p-8 text-center" onClick={() => handleSelection('female')}>
              <div className="mb-6">
                <div className="relative inline-block">
                  <UserCheck className="h-20 w-20 text-slate-600 mx-auto mb-4 group-hover:text-rose-600 group-hover:scale-110 transition-all duration-300" />
                  <div className="absolute -inset-4 bg-gradient-to-r from-rose-100/50 to-slate-100/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-slate-900 transition-colors arabic-text">
                  إدارة المجمع التعليمي - بنات
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed arabic-text">
                  عرض وإدارة طلبات التوظيف المقدمة لقسم البنات
                </p>
              </div>
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 rounded-xl transition-all duration-300 group-hover:shadow-lg flex items-center justify-center gap-2 arabic-text"
              >
                عرض ملفات البنات
                <Users className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-12">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/')}
            className="bg-white/70 backdrop-blur-sm border-slate-300 hover:bg-white/90 hover:border-slate-400 transition-all duration-300 rounded-full px-6 arabic-text"
          >
            <Home className="h-4 w-4 mr-2" />
            العودة للصفحة الرئيسية
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="bg-white/70 backdrop-blur-sm border-slate-300 hover:bg-white/90 hover:border-red-400 text-red-600 hover:text-red-800 transition-all duration-300 rounded-full px-6 arabic-text"
          >
            <LogOut className="h-4 w-4 mr-2" />
            تسجيل الخروج
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="inline-block">
            <p className="text-slate-500 text-sm px-6 py-2 bg-white/40 backdrop-blur-sm rounded-full border border-slate-200/30 arabic-text">
              © 2025 مدارس أنجال النخبة الأهلية - جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}