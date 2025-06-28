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
    setLocation(`/admin/dashboard?gender=${gender}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-6">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              لوحة التحكم الإدارية
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            مدارس أنجال النخبة الأهلية
          </p>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            اختر المجمع التعليمي المراد إدارته
          </h2>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Boys Complex Admin */}
          <Card className="overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer group">
            <CardContent className="p-8 text-center" onClick={() => handleSelection('male')}>
              <div className="mb-6">
                <UserCheck className="h-16 w-16 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  إدارة المجمع التعليمي - بنين
                </h3>
                <p className="text-gray-600 mb-6">
                  عرض وإدارة طلبات التوظيف المقدمة لقسم البنين
                </p>
              </div>
              <Button 
                size="lg" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                <Users className="h-5 w-5 mr-2" />
                عرض ملفات البنين
              </Button>
            </CardContent>
          </Card>

          {/* Girls Complex Admin */}
          <Card className="overflow-hidden border-2 border-pink-200 hover:border-pink-400 transition-colors cursor-pointer group">
            <CardContent className="p-8 text-center" onClick={() => handleSelection('female')}>
              <div className="mb-6">
                <UserCheck className="h-16 w-16 text-pink-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  إدارة المجمع التعليمي - بنات
                </h3>
                <p className="text-gray-600 mb-6">
                  عرض وإدارة طلبات التوظيف المقدمة لقسم البنات
                </p>
              </div>
              <Button 
                size="lg" 
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3"
              >
                <Users className="h-5 w-5 mr-2" />
                عرض ملفات البنات
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
            className="text-gray-600 hover:text-gray-800"
          >
            <Home className="h-4 w-4 mr-2" />
            العودة للصفحة الرئيسية
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 border-red-200 hover:border-red-300"
          >
            <LogOut className="h-4 w-4 mr-2" />
            تسجيل الخروج
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>© 2025 مدارس أنجال النخبة الأهلية - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}