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

export function getSpecializationLabel(specialization: string): string {
  const specializationLabels: Record<string, string> = {
    'early_childhood': 'رياض الأطفال',
    'arabic': 'اللغة العربية',
    'english': 'اللغة الإنجليزية',
    'computer_science': 'علوم الحاسب',
    'mathematics': 'الرياضيات',
    'chemistry': 'الكيمياء',
    'physics': 'الفيزياء',
    'history': 'التاريخ',
    'geography': 'الجغرافيا',
    'business_administration': 'إدارة الأعمال',
    'biology': 'الأحياء',
    'home_economics': 'الاقتصاد المنزلي',
    'religion': 'التربية الإسلامية'
  };
  return specializationLabels[specialization] || specialization;
}
