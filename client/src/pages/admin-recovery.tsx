import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Key, User, Eye, EyeOff, Home, Sparkles, Lock } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminRecovery() {
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);
  const [, setLocation] = useLocation();

  // Recovery code - this should be known only by the system administrator
  const RECOVERY_CODE = "ANJAL2025RECOVERY#";

  const [credentials, setCredentials] = useState<any[]>([]);

  const handleRecovery = async () => {
    try {
      // Fetch secure credentials from server
      const response = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recoveryCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials);
        setShowCredentials(true);
      } else {
        alert("رمز الاستعادة غير صحيح");
      }
    } catch (error) {
      console.error('Recovery error:', error);
      alert("حدث خطأ أثناء استعادة البيانات");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden" dir="rtl">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-slate-200/30 to-gray-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-slate-200/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-gradient-to-r from-slate-100/40 to-gray-100/40 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-2xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl relative overflow-hidden group">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-slate-50/50 to-orange-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <CardHeader className="text-center relative z-10">
            <div className="mx-auto bg-amber-100/80 backdrop-blur-sm p-4 rounded-full w-fit mb-6 group-hover:bg-amber-200/80 transition-all duration-300">
              <div className="relative">
                <Shield className="h-10 w-10 text-amber-600 group-hover:scale-110 transition-transform duration-300" />
                <Lock className="h-4 w-4 text-amber-500 absolute -bottom-1 -right-1" />
                <Sparkles className="h-3 w-3 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-800 mb-3 arabic-text">استعادة بيانات الدخول</CardTitle>
            <p className="text-lg text-slate-600 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50 arabic-text">
              صفحة طوارئ لاستعادة أسماء المستخدمين وكلمات المرور
            </p>
          </CardHeader>
        <CardContent className="relative z-10">
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
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleRecovery} 
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group arabic-text"
                >
                  <Key className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform duration-300" />
                  استعادة البيانات
                </Button>
                <Button 
                  onClick={() => setLocation('/admin')} 
                  variant="outline"
                  className="bg-white/70 backdrop-blur-sm border-slate-300 hover:bg-white/90 hover:border-slate-400 transition-all duration-300 rounded-xl group arabic-text"
                >
                  <Home className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform duration-300" />
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
    </div>
  );
}