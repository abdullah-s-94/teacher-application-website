import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  BookOpen, 
  Building, 
  Clock, 
  Eye, 
  Download, 
  LogOut,
  User,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Award,
  FileText,
  Trash2,
  FileDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getPositionLabel, 
  getQualificationLabel, 
  getCityLabel, 
  getExperienceLabel, 
  formatAgeLabel, 
  getStatusLabel, 
  getStatusBadgeColor, 
  getPositionBadgeColor,
  getSpecializationLabel
} from "@/lib/utils";
import type { Application } from "@shared/schema";

interface User {
  username: string;
  name: string;
  canSwitchGender: boolean;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication and determine user type
  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (!user) {
      setLocation('/admin/selection');
      return;
    }

    try {
      const userData = JSON.parse(user);
      setCurrentUser(userData);
      
      // Set gender based on user type
      if (userData.username === 'AdminB') {
        setSelectedGender('male');
      } else if (userData.username === 'AdminG') {
        setSelectedGender('female');
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      setLocation('/admin/selection');
    }
  }, [setLocation]);

  // Fetch applications with gender filter
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/applications', selectedGender],
    queryFn: async () => {
      const response = await fetch(`/api/applications?gender=${selectedGender}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/applications/stats', selectedGender],
    queryFn: async () => {
      const response = await fetch(`/api/applications/stats?gender=${selectedGender}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!currentUser,
  });

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    setLocation('/admin/selection');
  };

  const downloadCV = (applicationId: number, originalName?: string) => {
    const url = `/api/applications/${applicationId}/cv?download=true`;
    window.open(url, '_blank');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-slate-200/30 to-gray-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-slate-200/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between mb-6">
              <div>
                <CardTitle className="text-2xl">لوحة تحكم المتقدمين</CardTitle>
                <p className="text-muted-foreground mt-1">
                  المجمع التعليمي - {selectedGender === 'male' ? 'بنين' : 'بنات'}
                </p>
                {currentUser && (
                  <div className="flex items-center gap-2 mt-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      {currentUser.name} ({currentUser.username})
                    </span>
                  </div>
                )}
              </div>
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
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">إجمالي الطلبات</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                  </div>
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">المعلمون</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.teachers}</p>
                  </div>
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">الإداريون</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.admin}</p>
                  </div>
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">قيد المراجعة</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.pending || 0}</p>
                  </div>
                  <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Applications Table */}
        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200/50">
                    <TableHead className="text-right font-semibold">الاسم الكامل</TableHead>
                    <TableHead className="text-right font-semibold">المنصب</TableHead>
                    <TableHead className="text-right font-semibold">المؤهل</TableHead>
                    <TableHead className="text-right font-semibold">الخبرة</TableHead>
                    <TableHead className="text-right font-semibold">التخصص</TableHead>
                    <TableHead className="text-right font-semibold">الحالة</TableHead>
                    <TableHead className="text-right font-semibold">العمليات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div></TableCell>
                        <TableCell><div className="h-4 bg-slate-200 rounded w-20 animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        لا توجد طلبات توظيف حالياً
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((application: Application) => (
                      <TableRow key={application.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-medium">{application.fullName}</TableCell>
                        <TableCell>
                          <Badge className={getPositionBadgeColor(application.position)}>
                            {getPositionLabel(application.position)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getQualificationLabel(application.qualification)}</TableCell>
                        <TableCell>{getExperienceLabel(application.experience)}</TableCell>
                        <TableCell>{getSpecializationLabel(application.specialization, application.customSpecialization || undefined)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(application.status)}>
                            {getStatusLabel(application.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* View Details */}
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
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                                <DialogHeader>
                                  <DialogTitle>تفاصيل المتقدم: {application.fullName}</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Personal Information */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        المعلومات الشخصية
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-slate-500" />
                                        <span className="font-medium">الاسم:</span>
                                        <span>{application.fullName}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-slate-500" />
                                        <span className="font-medium">الهاتف:</span>
                                        <span>{application.phone}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">الهوية الوطنية:</span>
                                        <span>{application.nationalId}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-slate-500" />
                                        <span className="font-medium">المدينة:</span>
                                        <span>{getCityLabel(application.city)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-500" />
                                        <span className="font-medium">العمر:</span>
                                        <span>{formatAgeLabel(application.birthDate)}</span>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Professional Information */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5" />
                                        المعلومات المهنية
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-slate-500" />
                                        <span className="font-medium">المنصب:</span>
                                        <Badge className={getPositionBadgeColor(application.position)}>
                                          {getPositionLabel(application.position)}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-slate-500" />
                                        <span className="font-medium">المؤهل:</span>
                                        <span>{getQualificationLabel(application.qualification)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">التخصص:</span>
                                        <span>{getSpecializationLabel(application.specialization, application.customSpecialization || undefined)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-slate-500" />
                                        <span className="font-medium">الخبرة:</span>
                                        <span>{getExperienceLabel(application.experience)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">رخصة مهنية:</span>
                                        <Badge variant={application.hasProfessionalLicense === 'yes' ? 'default' : 'secondary'}>
                                          {application.hasProfessionalLicense === 'yes' ? 'نعم' : 'لا'}
                                        </Badge>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Files Section */}
                                <div className="mt-6">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        الملفات المرفقة
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 gap-4">
                                        {/* CV File */}
                                        {application.cvFilename && (
                                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                              <FileText className="h-8 w-8 text-red-600" />
                                              <div>
                                                <p className="font-medium text-slate-800">السيرة الذاتية</p>
                                                <p className="text-sm text-slate-500">{application.cvOriginalName || 'CV.pdf'}</p>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(`/api/applications/${application.id}/cv?preview=true`, '_blank')}
                                              >
                                                <Eye className="h-4 w-4 ml-1" />
                                                معاينة
                                              </Button>
                                              <Button
                                                size="sm"
                                                onClick={() => downloadCV(application.id, application.cvOriginalName || undefined)}
                                              >
                                                <Download className="h-4 w-4 ml-1" />
                                                تحميل
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Download CV */}
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
    </div>
  );
}