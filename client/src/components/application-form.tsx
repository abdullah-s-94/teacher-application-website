import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertApplicationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send, Upload, FileText, CheckCircle } from "lucide-react";
import { z } from "zod";

const formSchema = insertApplicationSchema.extend({
  cv: z.any().refine((file) => file instanceof File, "يرجى رفع السيرة الذاتية"),
});

type FormData = z.infer<typeof formSchema>;

export function ApplicationForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      city: "",
      position: "",
      qualification: "",
      specialization: "",
      experience: "",
      gradeType: "",
      grade: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'cv' && value instanceof File) {
          formData.append('cv', value);
        } else {
          formData.append(key, value as string);
        }
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

  const gradeType = form.watch('gradeType');

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-primary text-white rounded-t-lg">
        <CardTitle className="text-2xl">استمارة التقديم</CardTitle>
        <p className="opacity-90">يرجى ملء جميع البيانات المطلوبة بدقة</p>
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
                      <Input placeholder="أدخلي اسمك الكامل" {...field} />
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
                    <FormLabel>رقم الهاتف *</FormLabel>
                    <FormControl>
                      <Input placeholder="05xxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@email.com" {...field} />
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
                          <SelectValue placeholder="اختاري المدينة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="riyadh">الرياض</SelectItem>
                        <SelectItem value="jeddah">جدة</SelectItem>
                        <SelectItem value="dammam">الدمام</SelectItem>
                        <SelectItem value="mecca">مكة المكرمة</SelectItem>
                        <SelectItem value="medina">المدينة المنورة</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                          <SelectValue placeholder="اختاري الوظيفة" />
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
                          <SelectValue placeholder="اختاري المؤهل" />
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
                  <FormControl>
                    <Textarea placeholder="أدخلي تخصصك الدراسي" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          <SelectValue placeholder="اختاري سنوات الخبرة" />
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
                          <SelectValue placeholder="اختاري نوع المعدل" />
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
                      placeholder={
                        gradeType === "4" 
                          ? "أدخلي معدلك من 4" 
                          : gradeType === "5" 
                          ? "أدخلي معدلك من 5" 
                          : "أدخلي معدلك"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <FormField
              control={form.control}
              name="cv"
              render={() => (
                <FormItem>
                  <FormLabel>السيرة الذاتية *</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="cv-upload"
                      />
                      <label htmlFor="cv-upload" className="cursor-pointer">
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="h-8 w-8" />
                            <div>
                              <p className="font-semibold">{selectedFile.name}</p>
                              <p className="text-sm text-slate-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 mb-2">اسحبي ملف السيرة الذاتية هنا أو اضغطي للاختيار</p>
                            <p className="text-sm text-slate-500">ملف PDF فقط، الحد الأقصى 5 ميجابايت</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="pt-6">
              <Button 
                type="submit" 
                className="w-full py-4 text-lg font-semibold gap-2"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    إرسال الطلب
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-slate-500 mt-4">
                بالضغط على "إرسال الطلب" فإنك توافقين على شروط وأحكام التقديم
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
