import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { GraduationCap, School, Sparkles, ArrowRight } from "lucide-react";

export default function GenderSelection() {
  const [, setLocation] = useLocation();

  const handleSelection = (gender: 'male' | 'female') => {
    setLocation(`/application?gender=${gender}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 py-12 px-4 relative overflow-hidden" dir="rtl">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-100/30 to-purple-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-emerald-100/20 to-teal-100/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-amber-100/25 to-orange-100/25 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-8 group">
            <div className="relative">
              <GraduationCap className="h-14 w-14 text-slate-700 group-hover:text-slate-600 transition-all duration-300 group-hover:scale-110" />
              <Sparkles className="h-6 w-6 text-amber-500 absolute -top-2 -right-2 animate-bounce" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-gray-700 to-slate-600 bg-clip-text text-transparent arabic-text">
              مدارس أنجال النخبة الأهلية
            </h1>
          </div>
          <div className="relative inline-block mb-8 animate-float">
            <p className="text-xl text-slate-600 px-6 py-3 bg-white/70 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-lg animate-glow arabic-text">
              نظام التوظيف الإلكتروني الموحد
            </p>
          </div>
          <h2 className="text-2xl font-semibold text-slate-700 mb-6 animate-fade-in arabic-text">
            اختر المجمع التعليمي المراد التقديم له
          </h2>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Boys Complex */}
          <Card className="overflow-hidden border border-slate-200/60 hover:border-slate-300/80 transition-all duration-500 cursor-pointer group bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2">
            <CardContent className="p-8 text-center relative" onClick={() => handleSelection('male')}>
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="mb-6">
                  <div className="relative inline-block">
                    <School className="h-20 w-20 text-slate-600 mx-auto mb-4 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300" />
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-100/50 to-slate-100/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-slate-900 transition-colors arabic-text">
                    المجمع التعليمي - بنين
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed arabic-text">
                    للتقديم على الوظائف التعليمية والإدارية في قسم البنين
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 rounded-xl transition-all duration-300 group-hover:shadow-lg flex items-center justify-center gap-2 arabic-text"
                >
                  التقديم لوظائف البنين
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Girls Complex */}
          <Card className="overflow-hidden border border-slate-200/60 hover:border-slate-300/80 transition-all duration-500 cursor-pointer group bg-white/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-2">
            <CardContent className="p-8 text-center relative" onClick={() => handleSelection('female')}>
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-rose-50/30 to-pink-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="mb-6">
                  <div className="relative inline-block">
                    <School className="h-20 w-20 text-slate-600 mx-auto mb-4 group-hover:text-rose-600 group-hover:scale-110 transition-all duration-300" />
                    <div className="absolute -inset-4 bg-gradient-to-r from-rose-100/50 to-slate-100/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-slate-900 transition-colors arabic-text">
                    المجمع التعليمي - بنات
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed arabic-text">
                    للتقديم على الوظائف التعليمية والإدارية في قسم البنات
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 rounded-xl transition-all duration-300 group-hover:shadow-lg flex items-center justify-center gap-2 arabic-text"
                >
                  التقديم لوظائف البنات
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Access */}
        <div className="text-center mt-16">
          <div className="inline-block group">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/admin')}
              className="text-slate-600 hover:text-slate-800 border-slate-300 hover:border-slate-400 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 rounded-full px-6 py-2 group-hover:shadow-lg"
            >
              <div className="flex items-center gap-2 arabic-text">
                <div className="w-2 h-2 bg-slate-400 rounded-full group-hover:bg-slate-600 transition-colors"></div>
                دخول الإدارة
              </div>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-20">
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