import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function getPositionLabel(position: string): string {
  const labels = {
    teacher: "معلم",
    admin: "إداري", 
    vice_principal: "وكيل",
    principal: "مدير"
  };
  return labels[position as keyof typeof labels] || position;
}

export function getQualificationLabel(qualification: string): string {
  const labels = {
    bachelor: "بكالوريوس",
    master: "ماجستير",
    phd: "دكتوراة"
  };
  return labels[qualification as keyof typeof labels] || qualification;
}

export function getCityLabel(city: string): string {
  const labels = {
    riyadh: "الرياض",
    jeddah: "جدة", 
    dammam: "الدمام",
    mecca: "مكة المكرمة",
    medina: "المدينة المنورة",
    taif: "الطائف",
    other: "أخرى"
  };
  return labels[city as keyof typeof labels] || city;
}

export function getExperienceLabel(experience: string): string {
  const exp = parseInt(experience);
  if (exp === 0) return "بدون خبرة";
  if (exp === 1) return "سنة واحدة";
  if (exp === 2) return "سنتان";
  if (exp >= 10) return "10 سنوات أو أكثر";
  return `${exp} سنوات`;
}

export function calculateAge(birthDate: string | Date | null): number | null {
  if (!birthDate) return null;
  
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export function formatAgeLabel(birthDate: string | Date | null): string {
  const age = calculateAge(birthDate);
  if (age === null) return "غير محدد";
  return `${age} سنة`;
}

export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'under_review': 'تحت الإجراء',
    'accepted': 'مقبول',
    'rejected': 'مرفوض'
  };
  return statusLabels[status] || status;
}

export function getStatusBadgeColor(status: string): string {
  const statusColors: Record<string, string> = {
    'under_review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'accepted': 'bg-green-100 text-green-800 border-green-200',
    'rejected': 'bg-red-100 text-red-800 border-red-200'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getPositionBadgeColor(position: string): string {
  const positionColors: Record<string, string> = {
    'teacher': 'bg-sky-500 text-white border-sky-600 shadow-sm',
    'admin': 'bg-violet-500 text-white border-violet-600 shadow-sm',
    'vice_principal': 'bg-amber-500 text-white border-amber-600 shadow-sm',
    'principal': 'bg-rose-500 text-white border-rose-600 shadow-sm'
  };
  return positionColors[position] || 'bg-gray-500 text-white border-gray-600 shadow-sm';
}

export function getSpecializationLabel(specialization: string, customSpecialization?: string): string {
  // إذا كان التخصص "أخرى" ويوجد تخصص مخصص، أظهر التخصص المخصص
  if (specialization === 'أخرى' && customSpecialization) {
    return customSpecialization;
  }
  
  const specializationLabels: Record<string, string> = {
    // التخصصات الموحدة الجديدة
    'early_childhood': 'طفولة مبكرة',
    'arabic': 'لغة عربية', 
    'english': 'لغة انجليزية',
    'computer_science': 'حاسب الي',
    'mathematics': 'رياضيات',
    'chemistry': 'كيمياء',
    'physics': 'فيزياء',
    'history': 'تاريخ',
    'geography': 'جغرافيا',
    'business_administration': 'ادارة اعمال',
    'biology': 'احياء',
    'home_economics': 'اقتصاد منزلي',
    'islamic_education': 'تربية إسلامية',
    
    // التخصصات الموجودة في قاعدة البيانات (تحويل للتخصصات الموحدة)
    'religion': 'تربية إسلامية',
    'شريعة': 'تربية إسلامية',
    'ادارة اعمال': 'ادارة اعمال',
    'ادارة اعمال ': 'ادارة اعمال',
    'بكالوريوس انجليش': 'لغة انجليزية',
    'بكالوريوس انجليش ': 'لغة انجليزية',
    'طفولة مبكره': 'طفولة مبكرة',
    'معلم': 'طفولة مبكرة',
    'معلم ': 'طفولة مبكرة',
    'دين': 'تربية إسلامية'
  };
  return specializationLabels[specialization] || specialization;
}

// قائمة التخصصات الموحدة للاستخدام في النماذج والفلترة (بالعربية)
export const STANDARD_SPECIALIZATIONS = [
  { value: 'طفولة مبكرة', label: 'طفولة مبكرة' },
  { value: 'لغة عربية', label: 'لغة عربية' },
  { value: 'لغة انجليزية', label: 'لغة انجليزية' },
  { value: 'حاسب الي', label: 'حاسب الي' },
  { value: 'رياضيات', label: 'رياضيات' },
  { value: 'كيمياء', label: 'كيمياء' },
  { value: 'فيزياء', label: 'فيزياء' },
  { value: 'تاريخ', label: 'تاريخ' },
  { value: 'جغرافيا', label: 'جغرافيا' },
  { value: 'ادارة اعمال', label: 'ادارة اعمال' },
  { value: 'احياء', label: 'احياء' },
  { value: 'اقتصاد منزلي', label: 'اقتصاد منزلي' },
  { value: 'تربية إسلامية', label: 'تربية إسلامية' },
  { value: 'تربية بدنية', label: 'تربية بدنية' },
  { value: 'أخرى', label: 'أخرى' }
];
