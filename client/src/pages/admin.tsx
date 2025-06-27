import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, Eye, FileDown, User } from "lucide-react";
import { formatDate, getPositionLabel, getQualificationLabel, getCityLabel, getExperienceLabel } from "@/lib/utils";
import type { Application } from "@shared/schema";

export default function Admin() {
  const [filters, setFilters] = useState({
    search: "",
    position: "",
    qualification: "",
    experienceRange: "",
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/applications', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/applications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json() as Application[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/applications/stats'],
    queryFn: async () => {
      const response = await fetch('/api/applications/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const downloadCV = async (id: number, originalName?: string) => {
    try {
      const response = await fetch(`/api/applications/${id}/cv`);
      if (!response.ok) throw new Error('Failed to download CV');
      
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
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
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
            <Button onClick={exportData} className="gap-2">
              <FileDown className="h-5 w-5" />
              تصدير البيانات
            </Button>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-primary mb-1">إجمالي المتقدمين</h3>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <div className="bg-secondary/10 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-secondary mb-1">معلمين</h3>
                <p className="text-2xl font-bold text-secondary">{stats.teachers}</p>
              </div>
              <div className="bg-accent/10 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-accent mb-1">إداريين</h3>
                <p className="text-2xl font-bold text-accent">{stats.admin}</p>
              </div>
              <div className="bg-emerald-100 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-emerald-600 mb-1">مدراء ووكلاء</h3>
                <p className="text-2xl font-bold text-emerald-600">{stats.management}</p>
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
              <Select value={filters.position} onValueChange={(value) => setFilters(prev => ({ ...prev, position: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الوظائف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الوظائف</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="admin">إداري</SelectItem>
                  <SelectItem value="vice_principal">وكيل</SelectItem>
                  <SelectItem value="principal">مدير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">المؤهل</label>
              <Select value={filters.qualification} onValueChange={(value) => setFilters(prev => ({ ...prev, qualification: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المؤهلات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المؤهلات</SelectItem>
                  <SelectItem value="bachelor">بكالوريوس</SelectItem>
                  <SelectItem value="master">ماجستير</SelectItem>
                  <SelectItem value="phd">دكتوراة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">سنوات الخبرة</label>
              <Select value={filters.experienceRange} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceRange: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع المستويات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المستويات</SelectItem>
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
                    <TableRow key={application.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{application.fullName}</p>
                            <p className="text-sm text-slate-500">{application.email}</p>
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
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
