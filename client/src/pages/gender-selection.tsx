import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { GraduationCap, School } from "lucide-react";

export default function GenderSelection() {
  const [, setLocation] = useLocation();

  const handleSelection = (gender: 'male' | 'female') => {
    setLocation(`/application?gender=${gender}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-6">
            <GraduationCap className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              مدارس أنجال النخبة الأهلية
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8">
            نظام التوظيف الإلكتروني الموحد
          </p>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            اختر المجمع التعليمي المراد التقديم له
          </h2>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Boys Complex */}
          <Card className="overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer group">
            <CardContent className="p-8 text-center" onClick={() => handleSelection('male')}>
              <div className="mb-6">
                <School className="h-16 w-16 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  المجمع التعليمي - بنين
                </h3>
                <p className="text-gray-600 mb-6">
                  للتقديم على الوظائف التعليمية والإدارية في قسم البنين
                </p>
              </div>
              <Button 
                size="lg" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                التقديم لوظائف البنين
              </Button>
            </CardContent>
          </Card>

          {/* Girls Complex */}
          <Card className="overflow-hidden border-2 border-pink-200 hover:border-pink-400 transition-colors cursor-pointer group">
            <CardContent className="p-8 text-center" onClick={() => handleSelection('female')}>
              <div className="mb-6">
                <School className="h-16 w-16 text-pink-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  المجمع التعليمي - بنات
                </h3>
                <p className="text-gray-600 mb-6">
                  للتقديم على الوظائف التعليمية والإدارية في قسم البنات
                </p>
              </div>
              <Button 
                size="lg" 
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3"
              >
                التقديم لوظائف البنات
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Access */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/admin')}
            className="text-gray-600 hover:text-gray-800"
          >
            دخول الإدارة
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