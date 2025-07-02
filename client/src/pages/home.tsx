import { ApplicationForm } from "@/components/application-form";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Home as HomeIcon, GraduationCap, Sparkles, School } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [gender, setGender] = useState<'male' | 'female' | null>(null);

  useEffect(() => {
    // Get gender from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const genderParam = urlParams.get('gender') as 'male' | 'female';
    
    if (!genderParam || (genderParam !== 'male' && genderParam !== 'female')) {
      // Redirect to gender selection if no valid gender specified
      setLocation('/');
      return;
    }
    
    setGender(genderParam);
  }, [setLocation]);

  if (!gender) {
    return <div className="min-h-screen flex items-center justify-center arabic-text">جاري التحميل...</div>;
  }

  const genderColor = gender === 'male' ? 'blue' : 'rose';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden">

      
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-slate-200/30 to-gray-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-slate-200/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-gradient-to-r from-slate-100/40 to-gray-100/40 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-8">
          <Button 
            onClick={() => setLocation('/')}
            variant="outline" 
            className="gap-2 bg-white/70 backdrop-blur-sm border-slate-300 hover:bg-white/90 hover:border-slate-400 transition-all duration-300 rounded-full px-6 arabic-text"
          >
            <HomeIcon className="h-4 w-4" />
            العودة للصفحة الرئيسية
          </Button>
          <div className="px-6 py-3 bg-white/70 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-lg">
            <h1 className="text-xl font-bold text-slate-800 arabic-text">
              التقديم لوظائف المجمع التعليمي - {gender === 'male' ? 'بنين' : 'بنات'}
            </h1>
          </div>
        </div>

        {/* Hero Section */}
        <section className="mb-12">
          <div className={`bg-gradient-to-r ${gender === 'male' ? 'from-blue-600 to-blue-700' : 'from-rose-600 to-rose-700'} text-white rounded-2xl p-8 mb-8 backdrop-blur-sm shadow-xl`}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <GraduationCap className="h-12 w-12 text-white" />
                    <Sparkles className="h-5 w-5 text-amber-300 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <h2 className="text-3xl font-bold arabic-text">انضم إلى فريق التميز</h2>
                </div>
                <p className="text-lg opacity-90 mb-6 arabic-text">
                  نبحث عن معلمين متميزين لينضموا إلى أسرة مدارس أنجال النخبة الأهلية
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur-sm arabic-text">بيئة عمل محفزة</span>
                  <span className="bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur-sm arabic-text">تطوير مهني مستمر</span>
                  <span className="bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur-sm arabic-text">رواتب تنافسية</span>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <School className={`h-32 w-32 ${gender === 'male' ? 'text-blue-200' : 'text-rose-200'} opacity-80`} />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-full blur-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Application Form */}
        <ApplicationForm gender={gender} />
      </main>
    </div>
  );
}