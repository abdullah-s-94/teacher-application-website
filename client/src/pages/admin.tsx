import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Download, Eye, FileDown, User, LogOut, Phone, Mail, MapPin, GraduationCap, Award, Calendar, FileText } from "lucide-react";
import { formatDate, getPositionLabel, getQualificationLabel, getCityLabel, getExperienceLabel } from "@/lib/utils";
import { LoginForm } from "@/components/login-form";
import type { Application } from "@shared/schema";

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    position: "",
    qualification: "",
    experienceRange: "",
  });

  useEffect(() => {
    const loggedIn = localStorage.getItem("adminLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/applications', filters],
    queryFn: async (): Promise<Application[]> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/applications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return await response.json();
    },
    enabled: isLoggedIn, // Only fetch when logged in
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/applications/stats'],
    queryFn: async () => {
      const response = await fetch('/api/applications/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: isLoggedIn, // Only fetch when logged in
  });

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // Helper function to clean and display file names properly
  const getDisplayFileName = (originalName?: string, applicantName?: string, id?: number) => {
    if (!originalName) return 'السيرة الذاتية.pdf';
    
    // Check if the original name contains corrupted characters (encoding issues)
    const hasCorruptedChars = /Ã|Ø|Ù|â|©|¨/.test(originalName);
    
    if (hasCorruptedChars || originalName.length > 100) {
      return applicantName ? `سيرة_ذاتية_${applicantName}.pdf` : `سيرة_ذاتية_${id}.pdf`;
    }
    
    return originalName;
  };

  const downloadCV = async (id: number, originalName?: string) => {
    try {
      const response = await fetch(`/api/applications/${id}/cv`);
      if (!response.ok) {
        throw new Error('Failed to download CV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName || `cv-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CV:', error);
      // Show user-friendly error message
      alert('فشل في تحميل الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  const exportData = () => {
    const csvContent = [
      ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'المدينة', 'الوظيفة', 'المؤهل', 'التخصص', 'الخبرة', 'المعدل', 'تاريخ التقديم'],
      ...applications.map(app => [
        app.fullName,
        app.email,
        app.phone,
        getCityLabel(app.city),
        getPositionLabel(app.position),
        getQualificationLabel(app.qualification),
        app.specialization,
        getExperienceLabel(app.experience),
        `${app.grade}/${app.gradeType}`,
        formatDate(app.submittedAt)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case 'teacher': return 'bg-primary/10 text-primary hover:bg-primary/20';
      case 'admin': return 'bg-accent/10 text-accent hover:bg-accent/20';
      case 'vice_principal': return 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200';
      case 'principal': return 'bg-purple-100 text-purple-600 hover:bg-purple-200';
      default: return 'bg-slate-100 text-slate-600 hover:bg-slate-200';
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between mb-6">
              <CardTitle className="text-2xl">لوحة تحكم المتقدمين</CardTitle>
              <div className="flex gap-2">
                <Button disabled className="gap-2">
                  <FileDown className="h-5 w-5" />
                  تصدير البيانات
                </Button>
                <Button onClick={handleLogout} variant="outline" className="gap-2">
                  <LogOut className="h-5 w-5" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
            
            {/* Loading skeleton for stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-slate-100 p-4 rounded-lg animate-pulse">
                  <div className="h-4 bg-slate-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-slate-300 rounded w-16 animate-pulse"></div>
                  <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardContent className="p-0">
            <div className="p-8 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-slate-600">جاري تحميل بيانات المتقدمين...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between mb-6">
            <CardTitle className="text-2xl">لوحة تحكم المتقدمين</CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportData} className="gap-2">
                <FileDown className="h-5 w-5" />
                تصدير البيانات
              </Button>
              <Button onClick={handleLogout} variant="outline" className="gap-2">
                <LogOut className="h-5 w-5" />
                تسجيل الخروج
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-primary mb-1">إجمالي المتقدمين</h3>
                    <p className="text-2xl font-bold text-primary">{stats.total}</p>
                  </div>
                  <User className="h-8 w-8 text-primary/50" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-600 mb-1">معلمين</h3>
                    <p className="text-2xl font-bold text-blue-600">{stats.teachers}</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-4 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-orange-600 mb-1">إداريين</h3>
                    <p className="text-2xl font-bold text-orange-600">{stats.admin}</p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-400" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 p-4 rounded-lg border border-emerald-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-600 mb-1">مدراء ووكلاء</h3>
                    <p className="text-2xl font-bold text-emerald-600">{stats.management}</p>
                  </div>
                  <Award className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">البحث</label>
              <Input
                placeholder="ابحث بالاسم أو البريد الإلكتروني"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">الوظيفة</label>
              <Select value={filters.position} onValueChange={(value) => setFilters(prev => ({ ...prev, position: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الوظائف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الوظائف</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="admin">إداري</SelectItem>
                  <SelectItem value="vice_principal">وكيل</SelectItem>
                  <SelectItem value="principal">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">المؤهل</label>
              <Select value={filters.qualification} onValueChange={(value) => setFilters(prev => ({ ...prev, qualification: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المؤهلات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المؤهلات</SelectItem>
                  <SelectItem value="bachelor">بكالوريوس</SelectItem>
                  <SelectItem value="master">ماجستير</SelectItem>
                  <SelectItem value="phd">دكتوراة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">سنوات الخبرة</label>
              <Select value={filters.experienceRange} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceRange: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المستويات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المستويات</SelectItem>
                  <SelectItem value="0-2">0-2 سنوات</SelectItem>
                  <SelectItem value="3-5">3-5 سنوات</SelectItem>
                  <SelectItem value="6-10">6-10 سنوات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الوظيفة</TableHead>
                  <TableHead className="text-right">المؤهل</TableHead>
                  <TableHead className="text-right">التخصص</TableHead>
                  <TableHead className="text-right">الخبرة</TableHead>
                  <TableHead className="text-right">المعدل</TableHead>
                  <TableHead className="text-right">تاريخ التقديم</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      لا توجد طلبات تقديم متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((application) => (
                    <TableRow key={application.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-slate-200">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                              {application.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate">{application.fullName}</p>
                            <p className="text-sm text-slate-500 truncate">{application.email}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <span className="text-xs text-slate-600">{application.phone}</span>
                              </div>
                              <span className="text-xs text-slate-400">•</span>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span className="text-xs text-slate-600">{getCityLabel(application.city)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPositionBadgeColor(application.position)}>
                          {getPositionLabel(application.position)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {getQualificationLabel(application.qualification)}
                      </TableCell>
                      <TableCell className="text-sm max-w-32 truncate">
                        {application.specialization}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getExperienceLabel(application.experience)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {application.grade}/{application.gradeType}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(application.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="عرض التفاصيل"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl" dir="rtl">
                              <DialogHeader>
                                <DialogTitle className="text-xl">تفاصيل المتقدم</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Personal Information */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    المعلومات الشخصية
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">الاسم:</span>
                                      <span>{application.fullName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">البريد الإلكتروني:</span>
                                      <span>{application.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">الهاتف:</span>
                                      <span>{application.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">المدينة:</span>
                                      <span>{getCityLabel(application.city)}</span>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Professional Information */}
                                <div>
                                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    المعلومات المهنية
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Badge className={getPositionBadgeColor(application.position)}>
                                        {getPositionLabel(application.position)}
                                      </Badge>
                                      <span className="font-medium">الوظيفة المطلوبة</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Award className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">المؤهل:</span>
                                      <span>{getQualificationLabel(application.qualification)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">التخصص:</span>
                                      <span>{application.specialization}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">سنوات الخبرة:</span>
                                      <span>{getExperienceLabel(application.experience)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Award className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">المعدل:</span>
                                      <span>{application.grade} من {application.gradeType}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">تاريخ التقديم:</span>
                                      <span>{formatDate(application.submittedAt)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* CV Section */}
                                {application.cvFilename && (
                                  <>
                                    <Separator />
                                    <div>
                                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        السيرة الذاتية
                                      </h3>
                                      <div className="bg-slate-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-slate-600" />
                                            <span>{getDisplayFileName(application.cvOriginalName || undefined, application.fullName, application.id)}</span>
                                          </div>
                                          <Button
                                            onClick={() => downloadCV(application.id, application.cvOriginalName || undefined)}
                                            className="gap-2"
                                          >
                                            <Download className="h-4 w-4" />
                                            تحميل السيرة الذاتية
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          {application.cvFilename && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="تحميل السيرة الذاتية"
                              onClick={() => downloadCV(application.id, application.cvOriginalName || undefined)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
