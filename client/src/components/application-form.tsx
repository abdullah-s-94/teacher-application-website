import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertApplicationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Upload, FileText, CheckCircle, X } from "lucide-react";
import { z } from "zod";
import { STANDARD_SPECIALIZATIONS } from "@/lib/utils";

const formSchema = insertApplicationSchema.extend({
  fullName: z.string()
    .min(2, "الاسم الكامل مطلوب")
    .max(100, "الاسم طويل جداً")
    .regex(/^[\u0600-\u06FF\s]+$/, "الاسم الكامل يجب أن يحتوي على حروف عربية فقط"),
  phone: z.string()
    .length(10, "رقم الجوال يجب أن يكون 10 أرقام بالضبط")
    .regex(/^[0-9]{10}$/, "رقم الجوال يجب أن يحتوي على 10 أرقام إنجليزية فقط"),
  nationalId: z.string()
    .length(10, "رقم الهوية الوطنية يجب أن يكون 10 أرقام بالضبط")
    .regex(/^[0-9]{10}$/, "رقم الهوية يجب أن يحتوي على 10 أرقام إنجليزية فقط"),
  city: z.string()
    .min(1, "يرجى اختيار المدينة"),
  birthDate: z.string()
    .min(1, "تاريخ الميلاد مطلوب"),
  position: z.string()
    .min(1, "يرجى اختيار المنصب المطلوب"),
  qualification: z.string()
    .min(1, "يرجى اختيار المؤهل الدراسي"),
  specialization: z.string()
    .min(1, "يرجى اختيار التخصص"),
  customSpecialization: z.string().optional(),
  experience: z.string()
    .min(1, "يرجى اختيار سنوات الخبرة"),
  gradeType: z.string()
    .min(1, "يرجى اختيار نوع التقدير"),
  grade: z.string()
    .min(1, "التقدير/المعدل مطلوب"),
  hasProfessionalLicense: z.string()
    .min(1, "يرجى الإجابة على سؤال الرخصة المهنية"),
  cv: z.any().refine((file) => file instanceof File, "يرجى رفع السيرة الذاتية"),
  educationCert: z.any().refine((file) => file instanceof File, "يرجى رفع شهادة آخر مؤهل دراسي"),
  workExperience: z.any().optional().refine(
    (files) => !files || (Array.isArray(files) && files.length <= 3 && files.every(file => file instanceof File)), 
    "يمكن رفع حد أقصى 3 ملفات للخبرات العملية"
  ),
}).omit({
  cvFilename: true,
  cvOriginalName: true,
  educationCertFilename: true,
  educationCertOriginalName: true,
  workExperienceFilenames: true,
  workExperienceOriginalNames: true,
}).refine((data) => {
  // إذا تم اختيار "أخرى" في التخصص، يجب كتابة التخصص المخصص
  if (data.specialization === 'أخرى' && (!data.customSpecialization || data.customSpecialization.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "يرجى كتابة التخصص عند اختيار 'أخرى'",
  path: ["customSpecialization"]
});

type FormData = z.infer<typeof formSchema>;

interface ApplicationFormProps {
  gender: 'male' | 'female';
}

export function ApplicationForm({ gender }: ApplicationFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEducationCert, setSelectedEducationCert] = useState<File | null>(null);
  const [selectedWorkExperience, setSelectedWorkExperience] = useState<File[]>([]);
  const [showCustomSpecialization, setShowCustomSpecialization] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      nationalId: "",
      city: "",
      birthDate: "",
      position: "",
      qualification: "",
      specialization: "",
      customSpecialization: "",
      experience: "",
      gradeType: "",
      grade: "",
      hasProfessionalLicense: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'cv' || key === 'educationCert' || key === 'workExperience') {
          // Skip file fields, handle them separately
          return;
        }
        formData.append(key, value as string);
      });
      
      // Add gender
      formData.append('gender', gender);

      // Add CV file
      if (selectedFile) {
        formData.append('cv', selectedFile);
      }

      // Add education certificate file
      if (selectedEducationCert) {
        formData.append('educationCert', selectedEducationCert);
      }

      // Add work experience files
      selectedWorkExperience.forEach((file) => {
        formData.append('workExperience', file);
      });

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في إرسال الطلب');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال طلبك بنجاح!",
        description: "سيتم التواصل معك قريباً",
      });
      form.reset();
      setSelectedFile(null);
      setSelectedEducationCert(null);
      setSelectedWorkExperience([]);
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/stats'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطأ في إرسال الطلب",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "نوع ملف غير مدعوم",
          description: "يرجى رفع ملف PDF فقط",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive", 
          title: "حجم الملف كبير",
          description: "الحد الأقصى لحجم الملف 5 ميجابايت",
        });
        return;
      }
      setSelectedFile(file);
      form.setValue('cv', file);
    }
  };

  const handleEducationCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "نوع ملف غير مدعوم",
          description: "يرجى رفع ملف PDF فقط",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "حجم الملف كبير",
          description: "الحد الأقصى لحجم الملف 5 ميجابايت",
        });
        return;
      }
      setSelectedEducationCert(file);
      form.setValue('educationCert', file);
    }
  };

  const handleWorkExperienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedWorkExperience.length > 3) {
      toast({
        variant: "destructive",
        title: "عدد الملفات كبير",
        description: "يمكن رفع حد أقصى 3 ملفات للخبرات العملية",
      });
      return;
    }

    for (const file of files) {
      if (file.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "نوع ملف غير مدعوم",
          description: "يرجى رفع ملفات PDF فقط",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "حجم الملف كبير",
          description: "الحد الأقصى لحجم الملف 5 ميجابايت",
        });
        return;
      }
    }

    const newFiles = [...selectedWorkExperience, ...files];
    setSelectedWorkExperience(newFiles);
    form.setValue('workExperience', newFiles);
  };

  const removeWorkExperienceFile = (index: number) => {
    const newFiles = selectedWorkExperience.filter((_, i) => i !== index);
    setSelectedWorkExperience(newFiles);
    form.setValue('workExperience', newFiles.length > 0 ? newFiles : undefined);
  };

  const gradeType = form.watch('gradeType');

  const genderTheme = gender === 'male' ? {
    headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    accentColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    focusColor: 'focus:ring-blue-500'
  } : {
    headerBg: 'bg-gradient-to-r from-rose-600 to-rose-700',
    buttonBg: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800',
    accentColor: 'text-rose-600',
    borderColor: 'border-rose-200',
    focusColor: 'focus:ring-rose-500'
  };

  return (
    <div className={gender === 'male' ? 'male-theme' : 'female-theme'}>
      <Card className="w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-xl">
        <CardHeader className={`${genderTheme.headerBg} text-white rounded-t-lg`}>
          <CardTitle className="text-2xl arabic-text">استمارة التقديم</CardTitle>
          <p className="opacity-90 arabic-text">يرجى ملء جميع البيانات المطلوبة بدقة</p>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الكامل *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="أدخل اسمك الكامل" 
                        {...field} 
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^\u0600-\u06FF\s]/g, '');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الجوال *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="05xxxxxxxx" 
                        {...field} 
                        maxLength={10}
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^0-9]/g, '');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الهوية الوطنية *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="1234567890" 
                        {...field} 
                        maxLength={10}
                        pattern="[0-9]{10}"
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^0-9]/g, '');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدينة السكن *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المدينة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="riyadh">الرياض</SelectItem>
                        <SelectItem value="jeddah">جدة</SelectItem>
                        <SelectItem value="dammam">الدمام</SelectItem>
                        <SelectItem value="mecca">مكة المكرمة</SelectItem>
                        <SelectItem value="medina">المدينة المنورة</SelectItem>
                        <SelectItem value="taif">الطائف</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Birth Date */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ الميلاد (ميلادي) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        value={field.value || ""}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div></div> {/* Empty cell for grid layout */}
            </div>

            {/* Position Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوظيفة المطلوبة *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الوظيفة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="teacher">معلم</SelectItem>
                        <SelectItem value="admin">إداري</SelectItem>
                        <SelectItem value="vice_principal">وكيل</SelectItem>
                        <SelectItem value="principal">مدير</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المؤهل الدراسي *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المؤهل" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bachelor">بكالوريوس</SelectItem>
                        <SelectItem value="master">ماجستير</SelectItem>
                        <SelectItem value="phd">دكتوراة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التخصص *</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    setShowCustomSpecialization(value === 'أخرى');
                    if (value !== 'أخرى') {
                      form.setValue('customSpecialization', '');
                    }
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التخصص" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STANDARD_SPECIALIZATIONS.map((spec) => (
                        <SelectItem key={spec.value} value={spec.value}>
                          {spec.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCustomSpecialization && (
              <FormField
                control={form.control}
                name="customSpecialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حدد التخصص *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="اكتب تخصصك"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد سنوات الخبرة *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر سنوات الخبرة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">بدون خبرة</SelectItem>
                        <SelectItem value="1">سنة واحدة</SelectItem>
                        <SelectItem value="2">سنتان</SelectItem>
                        <SelectItem value="3">3 سنوات</SelectItem>
                        <SelectItem value="4">4 سنوات</SelectItem>
                        <SelectItem value="5">5 سنوات</SelectItem>
                        <SelectItem value="6">6 سنوات</SelectItem>
                        <SelectItem value="7">7 سنوات</SelectItem>
                        <SelectItem value="8">8 سنوات</SelectItem>
                        <SelectItem value="9">9 سنوات</SelectItem>
                        <SelectItem value="10">10 سنوات أو أكثر</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gradeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المعدل *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المعدل" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="4">من 4</SelectItem>
                        <SelectItem value="5">من 5</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المعدل *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={gradeType === "4" ? "4" : gradeType === "5" ? "5" : undefined}
                      placeholder={gradeType ? `أدخل المعدل من ${gradeType}` : "أدخل المعدل"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Professional License Question */}
            <FormField
              control={form.control}
              name="hasProfessionalLicense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>هل أنت حاصل على الرخصة المهنية؟ *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الإجابة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes">نعم</SelectItem>
                      <SelectItem value="no">لا</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Uploads */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">المرفقات</h3>
              <p className="text-sm text-gray-600 mb-4">الحقول المطلوبة محددة بعلامة (*)</p>
              
              {/* CV Upload */}
              <div className="space-y-2">
                <FormLabel>رفع السيرة الذاتية * (PDF فقط)</FormLabel>
                <div className="flex flex-col space-y-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${genderTheme.buttonBg} file:text-white hover:file:opacity-90`}
                  />
                  {selectedFile && (
                    <div className={`flex items-center space-x-2 text-sm ${genderTheme.accentColor}`}>
                      <CheckCircle className="h-4 w-4" />
                      <span>{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Education Certificate Upload */}
              <div className="space-y-2">
                <FormLabel>رفع شهادة آخر مؤهل دراسي * (PDF فقط)</FormLabel>
                <div className="flex flex-col space-y-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleEducationCertChange}
                    className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${genderTheme.buttonBg} file:text-white hover:file:opacity-90`}
                  />
                  {selectedEducationCert && (
                    <div className={`flex items-center space-x-2 text-sm ${genderTheme.accentColor}`}>
                      <CheckCircle className="h-4 w-4" />
                      <span>{selectedEducationCert.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Experience Upload */}
              <div className="space-y-2">
                <FormLabel>رفع الخبرات العملية السابقة (اختياري - PDF فقط، حد أقصى 3 ملفات)</FormLabel>
                <div className="flex flex-col space-y-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleWorkExperienceChange}
                    className={`file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${genderTheme.buttonBg} file:text-white hover:file:opacity-90`}
                  />
                  {selectedWorkExperience.length > 0 && (
                    <div className="space-y-2">
                      {selectedWorkExperience.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center space-x-2 text-sm">
                            <FileText className="h-4 w-4" />
                            <span>{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeWorkExperienceFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className={`w-full ${genderTheme.buttonBg} text-white py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl arabic-text`}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="ml-2 h-4 w-4" />
                  إرسال الطلب
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      </Card>
    </div>
  );
}