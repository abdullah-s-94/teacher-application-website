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
