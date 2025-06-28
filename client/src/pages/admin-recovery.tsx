import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Key, User, Eye, EyeOff, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminRecovery() {
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [, setLocation] = useLocation();

  // Recovery code - this should be known only by the system administrator
  const RECOVERY_CODE = "ANJAL2025RECOVERY#";

  const handleRecovery = () => {
    if (recoveryCode === RECOVERY_CODE) {
      setShowCredentials(true);
    } else {
      alert("رمز الاستعادة غير صحيح");
    }
  };

  const credentials = [
    {
      username: "Admin",
      password: "Abu0555700769@@",
      role: "مدير المجمع - صلاحيات كاملة",
      description: "يمكنه الوصول لجميع المجمعات والتبديل بينها"
    },
    {
      username: "AdminB",
      password: "Abu0555700769@@B",
      role: "مدير مجمع البنين",
      description: "يمكنه الوصول لمجمع البنين فقط"
    },
    {
      username: "AdminG",
      password: "Abu0555700769@@G",
      role: "مدير مجمع البنات",
      description: "يمكنه الوصول لمجمع البنات فقط"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-amber-100 p-3 rounded-full w-fit mb-4">
            <Shield className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">استعادة بيانات الدخول</CardTitle>
          <p className="text-slate-600">صفحة طوارئ لاستعادة أسماء المستخدمين وكلمات المرور</p>
        </CardHeader>
        <CardContent>
          {!showCredentials ? (
            <div className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50">
                <Key className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  هذه الصفحة مخصصة لحالات الطوارئ فقط. يجب أن يكون لديك رمز الاستعادة الخاص بالنظام.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">رمز الاستعادة</label>
                <Input
                  type="password"
                  placeholder="أدخل رمز الاستعادة"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleRecovery} className="flex-1">
                  <Key className="h-4 w-4 mr-2" />
                  استعادة البيانات
                </Button>
                <Button onClick={() => setLocation('/admin')} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  العودة للتسجيل
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Alert className="border-green-200 bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  تم التحقق من رمز الاستعادة بنجاح. إليك جميع بيانات الدخول:
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {credentials.map((cred, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{cred.role}</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div><strong>اسم المستخدم:</strong> {cred.username}</div>
                            <div><strong>كلمة المرور:</strong> {cred.password}</div>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600">
                          {cred.description}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert className="border-red-200 bg-red-50">
                <Eye className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  <strong>تحذير أمني:</strong> احرص على عدم مشاركة هذه البيانات مع أي شخص غير مخول. 
                  يُنصح بحفظ هذه المعلومات في مكان آمن وإغلاق هذه الصفحة فوراً بعد الانتهاء.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={() => setLocation('/admin')} className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  الذهاب لتسجيل الدخول
                </Button>
                <Button 
                  onClick={() => {
                    setShowCredentials(false);
                    setRecoveryCode("");
                  }} 
                  variant="outline"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  إخفاء البيانات
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}