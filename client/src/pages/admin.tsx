import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Download, Eye, FileDown, User, LogOut, Phone, Mail, MapPin, GraduationCap, Award, Calendar, FileText, Trash2, CheckCircle, XCircle, AlertCircle, MoreHorizontal, UserCheck, UserX, TrendingUp, Building, Users, BookOpen, Clock, Star, Home, School, Settings, X, Check, MessageSquare } from "lucide-react";
import { formatDate, getPositionLabel, getQualificationLabel, getCityLabel, getExperienceLabel, formatAgeLabel, getStatusLabel, getStatusBadgeColor, getSpecializationLabel, getPositionBadgeColor, STANDARD_SPECIALIZATIONS } from "@/lib/utils";
import { LoginForm } from "@/components/login-form";
import { useLocation } from "wouter";
import type { Application } from "@shared/schema";

export default function Admin() {
  const [, setLocation] = useLocation();
  
  // Initialize state from localStorage immediately
  const storedUser = localStorage.getItem("adminUser");
  console.log("Raw stored user:", storedUser);
  const userData = storedUser ? JSON.parse(storedUser) : null;
  console.log("Parsed user data:", userData);
  const storedGender = localStorage.getItem("selectedGender") as 'male' | 'female' | null;
  const initialGender = userData?.permissions?.gender || storedGender || null;
  console.log("Initial gender extracted:", initialGender);
  
  const [isLoggedIn, setIsLoggedIn] = useState(!!userData && localStorage.getItem("adminLoggedIn") === "true");
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(initialGender);
  const [currentUser, setCurrentUser] = useState<any>(userData);

  // Update selectedGender when user data changes or on initial load
  useEffect(() => {
    if (userData && userData.permissions && userData.permissions.gender) {
      setSelectedGender(userData.permissions.gender);
      localStorage.setItem('selectedGender', userData.permissions.gender);
    }
  }, [userData]);
  const [filters, setFilters] = useState({
    search: "",
    position: "",
    qualification: "",
    experienceRange: "",
    specialization: "",
    hasProfessionalLicense: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only handle super admin URL parameter checking
    if (!isLoggedIn || !currentUser) return;
    
    // For super admin, check URL parameter
    if (currentUser.type === "super_admin") {
      const urlParams = new URLSearchParams(window.location.search);
      const genderParam = urlParams.get('gender') as 'male' | 'female';
      
      if (!genderParam || (genderParam !== 'male' && genderParam !== 'female')) {
        // Immediately redirect to admin selection if no valid gender specified
        setLocation('/admin/selection');
        return;
      }
      
      setSelectedGender(genderParam);
      localStorage.setItem('selectedGender', genderParam);
    }
  }, [isLoggedIn, currentUser, setLocation]);



  // Handle search submission
  const handleSearchSubmit = () => {
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  // Handle search input change - only trigger search if input is empty
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    if (value === "") {
      // Immediately clear search when input is empty
      setFilters(prev => ({ ...prev, search: "" }));
    }
  };

  // Handle Enter key press for search
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/applications', filters, selectedGender],
    queryFn: async (): Promise<Application[]> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      // Add gender filter
      if (selectedGender) {
        params.append('gender', selectedGender);
      }
      
      const response = await fetch(`/api/applications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return await response.json();
    },
    enabled: isLoggedIn && !!selectedGender, // Only fetch when properly configured
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/applications/stats', selectedGender],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedGender) {
        params.append('gender', selectedGender);
      }
      const response = await fetch(`/api/applications/stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: isLoggedIn && !!selectedGender, // Only fetch when properly configured
  });

  // Query for application settings (only for super admin)
  const { data: applicationSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['/api/application-settings', selectedGender],
    queryFn: async () => {
      if (!selectedGender) return null;
      const response = await fetch(`/api/application-settings/${selectedGender}`);
      if (!response.ok) throw new Error('Failed to fetch application settings');
      return response.json();
    },
    enabled: isLoggedIn && !!selectedGender && currentUser?.type === 'super_admin',
  });

  // Query for SMS service status (only for super admin)
  const { data: smsStatus } = useQuery({
    queryKey: ['/api/sms/status'],
    queryFn: async () => {
      const response = await fetch('/api/sms/status');
      if (!response.ok) throw new Error('Failed to fetch SMS status');
      return response.json();
    },
    enabled: isLoggedIn && currentUser?.type === 'super_admin',
  });

  // Mutation to update application settings
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ gender, isOpen }: { gender: string; isOpen: string }) => {
      const response = await fetch(`/api/application-settings/${gender}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOpen }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchSettings();
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث إعدادات استقبال الطلبات",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإعدادات",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    // Clear all admin-related data
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUser");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedGender(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden" dir="rtl">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-slate-200/30 to-gray-200/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-slate-200/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-gradient-to-r from-slate-100/40 to-gray-100/40 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="min-h-screen py-12 px-4 relative z-10">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center items-center gap-4 mb-6 group">
                <div className="relative">
                  <div className="relative">
                    <UserCheck className="h-12 w-12 text-slate-700 group-hover:text-slate-600 transition-all duration-300 group-hover:scale-110" />
                    <UserX className="h-5 w-5 text-slate-500 absolute -bottom-1 -right-1" />
                  </div>
                  <Star className="h-4 w-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 arabic-text">
                    لوحة تحكم الإدارة
                  </h1>
                  <p className="text-slate-600 text-sm arabic-text">نظام إدارة التوظيف</p>
                </div>
              </div>
              
              <div className="relative inline-block mb-6 animate-float">
                <p className="text-lg text-slate-600 px-6 py-3 bg-white/70 backdrop-blur-sm rounded-full border border-slate-200/50 shadow-lg arabic-text">
                  منطقة الدخول الآمن للمديرين
                </p>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 relative overflow-hidden group">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/20 to-indigo-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 bg-slate-100/80 rounded-full group-hover:bg-slate-200/80 transition-all duration-300">
                    <GraduationCap className="h-8 w-8 text-slate-600 group-hover:text-slate-700 transition-colors duration-300" />
                  </div>
                </div>
                
                <LoginForm onLoginSuccess={() => setIsLoggedIn(true)} />
              </div>
            </div>



            {/* Footer */}
            <div className="text-center mt-12">
              <div className="inline-block">
                <p className="text-slate-500 text-sm px-6 py-2 bg-white/40 backdrop-blur-sm rounded-full border border-slate-200/30 arabic-text">
                  نظام آمن ومحمي للإدارة
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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







  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      toast({
        title: "تم التحديث",
        description: `تم تحديث حالة الطلب إلى ${getStatusLabel(status)}`,
        variant: "default",
      });
      
      // Refetch data without page reload
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/stats'] });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الحالة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteApplication = async (id: number) => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete application');
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الطلب بنجاح",
        variant: "default",
      });
      
      // Refetch data without reloading the page
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/stats'] });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الطلب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllApplications = async () => {
    try {
      const response = await fetch(`/api/applications`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete all applications');
      
      toast({
        title: "تم الحذف",
        description: "تم حذف جميع الطلبات بنجاح",
        variant: "default",
      });
      
      // Refetch data without reloading the page
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/stats'] });
    } catch (error) {
      console.error('Error deleting all applications:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف جميع الطلبات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(applications.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedApplications(prev => [...prev, id]);
    } else {
      setSelectedApplications(prev => prev.filter(appId => appId !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedApplications.length === 0) return;
    
    try {
      // Delete each selected application
      await Promise.all(
        selectedApplications.map(id => 
          fetch(`/api/applications/${id}`, { method: 'DELETE' })
        )
      );
      
      toast({
        title: "تم الحذف",
        description: `تم حذف ${selectedApplications.length} طلب بنجاح`,
        variant: "default",
      });
      
      // Clear selection and refetch data
      setSelectedApplications([]);
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/stats'] });
    } catch (error) {
      console.error('Error deleting selected applications:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الطلبات المحددة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleFilePreview = async (url: string, filename: string) => {
    try {
      // Get the file URL from our API first
      const previewUrl = url.includes('?') ? `${url}&preview=true` : `${url}?preview=true`;
      
      const response = await fetch(previewUrl);
      
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
        // API returns JSON with file URL
        const fileInfo = await response.json();
        
        if (fileInfo.url) {
          // Use Google Docs Viewer for PDF preview
          const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileInfo.url)}&embedded=true`;
          window.open(googleDocsUrl, '_blank');
          
          toast({
            title: "تم فتح المعاينة",
            description: `جار فتح ${filename} في تبويب جديد`,
            variant: "default",
          });
        } else {
          throw new Error('No file URL in response');
        }
      } else {
        // Fallback: open the preview URL directly
        window.open(previewUrl, '_blank');
      }
    } catch (error) {
      console.error('Error accessing file:', error);
      toast({
        title: "خطأ في المعاينة",
        description: "لا يمكن الوصول إلى الملف. تحقق من اتصال الإنترنت.",
        variant: "destructive",
      });
    }
  };

  const handleFileDownload = async (url: string, filename: string) => {
    try {
      // Remove any existing query parameters and add download=true
      const baseUrl = url.split('?')[0];
      const downloadUrl = `${baseUrl}?download=true`;
      
      console.log('Downloading from:', downloadUrl);
      
      // Fetch the file and create a blob
      const response = await fetch(downloadUrl);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Blob size:', blob.size);
      console.log('Blob type:', blob.type);
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast({
        title: "تم التحميل بنجاح",
        description: `تم تحميل ${filename}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "خطأ في التحميل",
        description: error instanceof Error ? error.message : "لا يمكن تحميل الملف. تحقق من اتصال الإنترنت.",
        variant: "destructive",
      });
    }
  };

  const exportData = () => {
    const csvContent = [
      ['الاسم', 'الهوية الوطنية', 'رقم الجوال', 'المدينة', 'الوظيفة', 'المؤهل', 'التخصص', 'الخبرة', 'المعدل', 'تاريخ التقديم'],
      ...applications.map(app => [
        app.fullName,
        app.nationalId,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 relative overflow-hidden">

      
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-slate-200/30 to-gray-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-slate-200/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-gradient-to-r from-slate-100/40 to-gray-100/40 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <main className="container mx-auto px-4 py-8 relative z-10">
      {/* Dashboard Header */}
      <Card className="mb-8 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
        {/* Animated background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${selectedGender === 'male' ? 'from-blue-50/30 via-slate-50/50 to-indigo-50/20' : 'from-rose-50/30 via-slate-50/50 to-pink-50/20'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-4 mb-2 group">
                <div className="relative">
                  <Building className={`h-8 w-8 ${selectedGender === 'male' ? 'text-blue-600' : 'text-rose-600'} group-hover:scale-110 transition-all duration-300`} />
                  <TrendingUp className="h-4 w-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
                </div>
                <CardTitle className="text-3xl font-bold text-red-800 arabic-text">⚙️ لوحة تحكم المتقدمين</CardTitle>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <School className={`h-5 w-5 ${selectedGender === 'male' ? 'text-blue-500' : 'text-rose-500'}`} />
                <p className="text-slate-600 font-medium arabic-text">
                  المجمع التعليمي - {selectedGender === 'male' ? 'بنين' : 'بنات'}
                </p>
              </div>
              {currentUser && (
                <div className="flex items-center gap-2 mt-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50">
                  <User className={`h-4 w-4 ${selectedGender === 'male' ? 'text-blue-600' : 'text-rose-600'}`} />
                  <span className={`text-sm font-medium ${selectedGender === 'male' ? 'text-blue-700' : 'text-rose-700'} arabic-text`}>
                    {currentUser.name} ({currentUser.username})
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button 
                onClick={exportData} 
                className={`gap-2 bg-gradient-to-r ${selectedGender === 'male' ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : 'from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800'} text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group arabic-text`}
              >
                <FileDown className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                تصدير البيانات
              </Button>
              {selectedApplications.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group arabic-text"
                    >
                      <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      حذف المحدد ({selectedApplications.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف الطلبات المحددة</AlertDialogTitle>
                      <AlertDialogDescription>
                        سيتم حذف {selectedApplications.length} طلب نهائياً. هل أنت متأكد؟
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteSelected}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        حذف المحدد
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group arabic-text"
                  >
                    <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    حذف جميع الطلبات
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>تحذير: حذف جميع الطلبات</AlertDialogTitle>
                    <AlertDialogDescription>
                      هذا الإجراء خطير ولا يمكن التراجع عنه. سيتم حذف جميع طلبات التوظيف نهائياً. هل أنت متأكد؟
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllApplications}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      حذف الكل
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {currentUser?.permissions.canSwitchGender ? (
                <Button onClick={() => setLocation('/admin/selection')} variant="outline" className="gap-2 bg-white/70 backdrop-blur-sm border-slate-300 hover:bg-white/90 hover:border-slate-400 transition-all duration-300">
                  <Building className="h-5 w-5" />
                  تغيير المجمع
                </Button>
              ) : (
                <Button 
                  onClick={() => toast({
                    variant: "destructive",
                    title: "غير مسموح",
                    description: "ليس لديك صلاحيات للتغيير بين المجمعات"
                  })} 
                  variant="outline" 
                  className="gap-2 bg-white/70 backdrop-blur-sm border-slate-300 hover:bg-white/90 hover:border-slate-400 transition-all duration-300"
                >
                  <Building className="h-5 w-5" />
                  تغيير المجمع
                </Button>
              )}
              <Button onClick={handleLogout} variant="outline" className="gap-2">
                <LogOut className="h-5 w-5" />
                تسجيل الخروج
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <>
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

              {/* Status Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 p-4 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-600 mb-1">تحت الإجراء</h3>
                      <p className="text-2xl font-bold text-yellow-600">{stats.status?.under_review || 0}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-green-600 mb-1">مقبولين</h3>
                      <p className="text-2xl font-bold text-green-600">{stats.status?.accepted || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-100 to-red-50 p-4 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-red-600 mb-1">مرفوضين</h3>
                      <p className="text-2xl font-bold text-red-600">{stats.status?.rejected || 0}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-400" />
                  </div>
                </div>
              </div>

              {/* Specialization Statistics */}
              {stats.specializations && Object.keys(stats.specializations).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    إحصائيات التخصصات
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Object.entries(stats.specializations).map(([specialization, count]) => (
                      <div key={specialization} className="bg-slate-50 p-3 rounded-lg border hover:shadow-sm transition-shadow">
                        <div className="text-center">
                          <p className="text-sm font-medium text-slate-600 mb-1">{getSpecializationLabel(specialization)}</p>
                          <p className="text-xl font-bold text-primary">{count as number}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Settings Control - Only for Super Admin */}
              {currentUser?.type === 'super_admin' && applicationSettings && (
                <div className="mb-6">
                  <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings className="h-5 w-5 text-amber-600" />
                          <h3 className="text-lg font-semibold text-amber-800">إعدادات استقبال الطلبات</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${applicationSettings.isOpen === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {applicationSettings.isOpen === 'yes' ? 'مفتوح' : 'مغلق'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-amber-700 mb-2">
                            حالة استقبال الطلبات لـ{selectedGender === 'male' ? 'مجمع البنين' : 'مجمع البنات'}:
                          </p>
                          <p className="text-sm text-amber-600">
                            {applicationSettings.isOpen === 'yes' 
                              ? 'يمكن للمتقدمين حالياً تقديم طلباتهم.' 
                              : 'تم إغلاق استقبال الطلبات الجديدة.'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {applicationSettings.isOpen === 'yes' ? (
                            <Button
                              onClick={() => updateSettingsMutation.mutate({ gender: selectedGender!, isOpen: 'no' })}
                              disabled={updateSettingsMutation.isPending}
                              variant="destructive"
                              className="gap-2"
                            >
                              <X className="h-4 w-4" />
                              إغلاق التطبيق
                            </Button>
                          ) : (
                            <Button
                              onClick={() => updateSettingsMutation.mutate({ gender: selectedGender!, isOpen: 'yes' })}
                              disabled={updateSettingsMutation.isPending}
                              className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4" />
                              فتح التطبيق
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* SMS Status Display - Only for Super Admin */}
              {currentUser?.type === 'super_admin' && smsStatus && (
                <div className="mb-6">
                  <Card className={`${smsStatus.enabled ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200'}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className={`h-5 w-5 ${smsStatus.enabled ? 'text-green-600' : 'text-gray-500'}`} />
                          <h3 className={`text-lg font-semibold ${smsStatus.enabled ? 'text-green-800' : 'text-gray-600'}`}>حالة الرسائل النصية</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${smsStatus.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {smsStatus.enabled ? 'مفعلة' : 'معطلة'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex-1">
                        <p className={`mb-2 ${smsStatus.enabled ? 'text-green-700' : 'text-gray-600'}`}>
                          {smsStatus.message}
                        </p>
                        <p className="text-sm text-gray-500">
                          {smsStatus.enabled 
                            ? 'سيتم إرسال رسائل نصية تلقائياً عند قبول أو رفض الطلبات.' 
                            : 'لن يتم إرسال رسائل نصية حتى يتم تفعيل الخدمة.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">البحث</label>
              <div className="flex gap-2">
                <Input
                  placeholder="ابحث بالاسم أو الهوية الوطنية"
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearchSubmit}
                  variant="outline"
                  size="default"
                  className="whitespace-nowrap"
                >
                  بحث
                </Button>
              </div>
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
            <div>
              <label className="block text-sm font-semibold mb-2">التخصص</label>
              <Select value={filters.specialization} onValueChange={(value) => setFilters(prev => ({ ...prev, specialization: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع التخصصات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التخصصات</SelectItem>
                  {STANDARD_SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec.value} value={spec.value}>
                      {spec.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">الرخصة المهنية</label>
              <Select value={filters.hasProfessionalLicense} onValueChange={(value) => setFilters(prev => ({ ...prev, hasProfessionalLicense: value === "all" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="yes">نعم</SelectItem>
                  <SelectItem value="no">لا</SelectItem>
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
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedApplications.length === applications.length && applications.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </TableHead>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الوظيفة</TableHead>
                  <TableHead className="text-right">المؤهل</TableHead>
                  <TableHead className="text-right">التخصص</TableHead>
                  <TableHead className="text-right">الخبرة</TableHead>
                  <TableHead className="text-right">العمر</TableHead>
                  <TableHead className="text-right">المعدل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ التقديم</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                      لا توجد طلبات تقديم متاحة
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((application) => (
                    <TableRow key={application.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(application.id)}
                          onChange={(e) => handleSelectApplication(application.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-slate-200">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                              {application.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate">{application.fullName}</p>
                            <p className="text-sm text-slate-500 truncate">{application.nationalId}</p>
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
                        {getSpecializationLabel(application.specialization, application.customSpecialization ?? undefined)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getExperienceLabel(application.experience)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatAgeLabel(application.birthDate)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {application.grade}/{application.gradeType}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge className={getStatusBadgeColor(application.status || 'under_review')}>
                          {getStatusLabel(application.status || 'under_review')}
                        </Badge>
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
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                              <DialogHeader>
                                <DialogTitle className="text-xl">تفاصيل المتقدم</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6 pb-4">
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
                                      <span className="font-medium">الهوية الوطنية:</span>
                                      <span>{application.nationalId}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">رقم الجوال:</span>
                                      <span>{application.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">المدينة:</span>
                                      <span>{getCityLabel(application.city)}</span>
                                    </div>
                                    {application.birthDate && (
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-600" />
                                        <span className="font-medium">تاريخ الميلاد:</span>
                                        <span>{formatDate(application.birthDate)}</span>
                                      </div>
                                    )}
                                    {application.birthDate && (
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-slate-600" />
                                        <span className="font-medium">العمر:</span>
                                        <span>{formatAgeLabel(application.birthDate)}</span>
                                      </div>
                                    )}
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
                                      <span>{getSpecializationLabel(application.specialization, application.customSpecialization ?? undefined)}</span>
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
                                    <div className="flex items-center gap-2">
                                      <Award className="h-4 w-4 text-slate-600" />
                                      <span className="font-medium">الرخصة المهنية:</span>
                                      <Badge variant={application.hasProfessionalLicense === 'yes' ? 'default' : 'secondary'}>
                                        {application.hasProfessionalLicense === 'yes' ? 'يمتلك رخصة مهنية' : 'لا يمتلك رخصة مهنية'}
                                      </Badge>
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
                                      {/* Files Download Section */}
                                      <div className="space-y-4">
                                        {/* CV File */}
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                          <div className="flex items-start gap-4">
                                            {/* Thumbnail */}
                                            <div className="flex-shrink-0">
                                              <div className="w-16 h-20 bg-red-100 border-2 border-red-200 rounded-lg flex items-center justify-center relative">
                                                <FileText className="h-8 w-8 text-red-600" />
                                                <div className="absolute bottom-0 right-0 bg-red-600 text-white text-xs px-1 rounded-tl">PDF</div>
                                              </div>
                                            </div>
                                            {/* File Info */}
                                            <div className="flex-1">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <FileText className="h-4 w-4 text-slate-600" />
                                                  <span className="font-medium">السيرة الذاتية</span>
                                                </div>
                                                <div className="flex gap-2">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                      const previewUrl = `/api/applications/${application.id}/cv`;
                                                      handleFilePreview(previewUrl, 'CV');
                                                    }}
                                                    className="gap-1"
                                                  >
                                                    <Eye className="h-3 w-3" />
                                                    معاينة
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    onClick={() => {
                                                      const downloadUrl = `/api/applications/${application.id}/cv?download=true`;
                                                      handleFileDownload(downloadUrl, 'CV');
                                                    }}
                                                    className="gap-1"
                                                  >
                                                    <Download className="h-3 w-3" />
                                                    تحميل
                                                  </Button>
                                                </div>
                                              </div>
                                              <div className="text-sm text-slate-600 mt-2">
                                                {getDisplayFileName(application.cvOriginalName || undefined, application.fullName, application.id)}
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Education Certificate */}
                                        {application.educationCertFilename && (
                                          <div className="bg-slate-50 p-4 rounded-lg">
                                            <div className="flex items-start gap-4">
                                              {/* Thumbnail */}
                                              <div className="flex-shrink-0">
                                                <div className="w-16 h-20 bg-blue-100 border-2 border-blue-200 rounded-lg flex items-center justify-center relative">
                                                  <FileText className="h-8 w-8 text-blue-600" />
                                                  <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-1 rounded-tl">PDF</div>
                                                </div>
                                              </div>
                                              {/* File Info */}
                                              <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-slate-600" />
                                                    <span className="font-medium">شهادة آخر مؤهل دراسي</span>
                                                  </div>
                                                  <div className="flex gap-2">
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => {
                                                        const previewUrl = `/api/applications/${application.id}/education-cert`;
                                                        handleFilePreview(previewUrl, 'Education Certificate');
                                                      }}
                                                      className="gap-1"
                                                    >
                                                      <Eye className="h-3 w-3" />
                                                      معاينة
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      onClick={() => {
                                                        const downloadUrl = `/api/applications/${application.id}/education-cert?download=true`;
                                                        window.open(downloadUrl, '_blank');
                                                      }}
                                                      className="gap-1"
                                                    >
                                                      <Download className="h-3 w-3" />
                                                      تحميل
                                                    </Button>
                                                  </div>
                                                </div>
                                                <div className="text-sm text-slate-600 mt-2">
                                                  {application.educationCertOriginalName || 'Education_Certificate.pdf'}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Work Experience Files */}
                                        {application.workExperienceFilenames && application.workExperienceFilenames.trim() && (
                                          <div className="bg-slate-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-3">
                                              <FileText className="h-4 w-4 text-slate-600" />
                                              <span className="font-medium">ملفات الخبرات العملية</span>
                                            </div>
                                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                              {application.workExperienceFilenames?.split(',').filter(filename => filename.trim()).map((filename, index) => {
                                                const originalNames = application.workExperienceOriginalNames?.split(',') || [];
                                                const originalName = originalNames[index]?.trim() || `Work_Experience_${index + 1}.pdf`;
                                                return (
                                                  <div key={index} className="flex items-start gap-4 p-3 bg-white rounded border">
                                                    {/* Thumbnail */}
                                                    <div className="flex-shrink-0">
                                                      <div className="w-12 h-16 bg-green-100 border-2 border-green-200 rounded-lg flex items-center justify-center relative">
                                                        <FileText className="h-6 w-6 text-green-600" />
                                                        <div className="absolute bottom-0 right-0 bg-green-600 text-white text-xs px-1 rounded-tl">PDF</div>
                                                      </div>
                                                    </div>
                                                    {/* File Info */}
                                                    <div className="flex-1">
                                                      <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">{originalName}</span>
                                                        <div className="flex gap-2">
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                              const previewUrl = `/api/applications/${application.id}/work-experience/${index}`;
                                                              handleFilePreview(previewUrl, `Work Experience ${index + 1}`);
                                                            }}
                                                            className="gap-1"
                                                          >
                                                            <Eye className="h-3 w-3" />
                                                            معاينة
                                                          </Button>
                                                          <Button
                                                            size="sm"
                                                            onClick={() => {
                                                              const downloadUrl = `/api/applications/${application.id}/work-experience/${index}?download=true`;
                                                              handleFileDownload(downloadUrl, `Work Experience ${index + 1}`);
                                                            }}
                                                            className="gap-1"
                                                          >
                                                            <Download className="h-3 w-3" />
                                                            تحميل
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
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
                              onClick={() => {
                                const downloadUrl = `/api/applications/${application.id}/cv`;
                                handleFileDownload(downloadUrl, application.cvOriginalName || 'CV.pdf');
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Status Update Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="تحديث الحالة"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(application.id, 'accepted')}
                                className="gap-2 text-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                                قبول
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(application.id, 'rejected')}
                                className="gap-2 text-red-600"
                              >
                                <XCircle className="h-4 w-4" />
                                رفض
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(application.id, 'under_review')}
                                className="gap-2 text-yellow-600"
                              >
                                <AlertCircle className="h-4 w-4" />
                                تحت الإجراء
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Delete Button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                title="حذف الطلب"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هذا الإجراء لا يمكن التراجع عنه. سيتم حذف طلب {application.fullName} نهائياً.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteApplication(application.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
