import { ApplicationForm } from "@/components/application-form";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12">
        <div className="gradient-primary text-white rounded-2xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">انضمي إلى فريق التميز</h2>
              <p className="text-lg opacity-90 mb-6">
                نبحث عن معلمات متميزات لينضممن إلى أسرة مدارس أنجال النخبة الأهلية
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">بيئة عمل محفزة</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">تطوير مهني مستمر</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">رواتب تنافسية</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                alt="طالبات في البيئة التعليمية" 
                className="rounded-lg shadow-lg object-cover h-32"
              />
              <img 
                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                alt="بيئة تعليمية حديثة" 
                className="rounded-lg shadow-lg object-cover h-32"
              />
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <img 
            src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&h=250" 
            alt="معلمة في الفصل الدراسي" 
            className="rounded-xl shadow-md object-cover h-48 w-full"
          />
          <img 
            src="https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&h=250" 
            alt="بيئة تعليمية تفاعلية" 
            className="rounded-xl shadow-md object-cover h-48 w-full"
          />
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&h=250" 
            alt="معلمات في اجتماع تعليمي" 
            className="rounded-xl shadow-md object-cover h-48 w-full"
          />
          <img 
            src="https://images.unsplash.com/photo-1581726690015-c9861fa5057f?ixlib=rb-4.0.3&auto=format&fit=crop&w=250&h=250" 
            alt="طالبات في النشاط التعليمي" 
            className="rounded-xl shadow-md object-cover h-48 w-full"
          />
        </div>
      </section>

      {/* Application Form */}
      <ApplicationForm />
    </main>
  );
}
