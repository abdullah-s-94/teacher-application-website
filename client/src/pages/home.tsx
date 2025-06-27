import { ApplicationForm } from "@/components/application-form";
import { Card, CardContent } from "@/components/ui/card";
import saudiSchoolChildren from "@assets/saudi_school_children.svg";
import saudiTeachers from "@assets/saudi_teachers.svg";

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
                src={saudiSchoolChildren}
                alt="طالبات سعوديات في البيئة التعليمية" 
                className="rounded-lg shadow-lg object-cover h-32"
              />
              <img 
                src={saudiTeachers}
                alt="معلمات سعوديات محجبات في الفصل" 
                className="rounded-lg shadow-lg object-cover h-32"
              />
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <img 
            src={saudiTeachers}
            alt="معلمات سعوديات محجبات في الفصل الدراسي" 
            className="rounded-xl shadow-md object-cover h-48 w-full"
          />
          <img 
            src={saudiSchoolChildren}
            alt="طالبات سعوديات في البيئة التعليمية التفاعلية" 
            className="rounded-xl shadow-md object-cover h-48 w-full"
          />
          <img 
            src={saudiTeachers}
            alt="معلمات سعوديات في اجتماع تعليمي" 
            className="rounded-xl shadow-md object-cover h-48 w-full"
          />
          <img 
            src={saudiSchoolChildren}
            alt="طالبات سعوديات في النشاط التعليمي" 
            className="rounded-xl shadow-md object-cover h-48 w-full"
          />
        </div>
      </section>

      {/* Application Form */}
      <ApplicationForm />
    </main>
  );
}
