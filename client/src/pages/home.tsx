import { ApplicationForm } from "@/components/application-form";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

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
    return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  }
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="gradient-primary text-white rounded-2xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">انضم إلى فريق التميز</h2>
              <p className="text-lg opacity-90 mb-6">
                نبحث عن معلمين متميزين لينضموا إلى أسرة مدارس أنجال النخبة الأهلية
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">بيئة عمل محفزة</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">تطوير مهني مستمر</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">رواتب تنافسية</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg shadow-lg h-32 flex items-center justify-center">
                <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg shadow-lg h-32 flex items-center justify-center">
                <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl shadow-md h-48 w-full flex flex-col items-center justify-center p-4">
            <svg className="w-12 h-12 text-purple-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-sm font-semibold text-purple-700 text-center">مكتبة حديثة</h3>
            <p className="text-xs text-purple-600 text-center mt-1">مصادر تعليمية متنوعة</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl shadow-md h-48 w-full flex flex-col items-center justify-center p-4">
            <svg className="w-12 h-12 text-blue-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-sm font-semibold text-blue-700 text-center">فصول ذكية</h3>
            <p className="text-xs text-blue-600 text-center mt-1">تقنيات تعليمية متطورة</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl shadow-md h-48 w-full flex flex-col items-center justify-center p-4">
            <svg className="w-12 h-12 text-green-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h3 className="text-sm font-semibold text-green-700 text-center">مختبرات علوم</h3>
            <p className="text-xs text-green-600 text-center mt-1">تجارب عملية متقدمة</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl shadow-md h-48 w-full flex flex-col items-center justify-center p-4">
            <svg className="w-12 h-12 text-orange-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-semibold text-orange-700 text-center">بيئة آمنة</h3>
            <p className="text-xs text-orange-600 text-center mt-1">مرافق متكاملة ومريحة</p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <ApplicationForm gender={gender} />
    </main>
  );
}
