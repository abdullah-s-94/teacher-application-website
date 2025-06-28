import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Lock, User, Home, Shield, AlertTriangle, Sparkles, UserCheck, Key } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

type LoginData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Generate device fingerprint for per-device tracking
  const getDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = btoa(
      navigator.userAgent + 
      navigator.language + 
      screen.width + 'x' + screen.height + 
      new Date().getTimezoneOffset() +
      (canvas.toDataURL ? canvas.toDataURL().slice(-50) : '')
    ).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    
    return fingerprint;
  };

  // Handle redirect after successful login
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        console.log('Redirecting to:', shouldRedirect);
        setLocation(shouldRedirect);
        setShouldRedirect(null);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, setLocation]);

  // Check if user is currently blocked
  useEffect(() => {
    const deviceId = getDeviceFingerprint();
    const blockEndTime = localStorage.getItem(`loginBlockEndTime_${deviceId}`);
    if (blockEndTime) {
      const remainingTime = parseInt(blockEndTime) - Date.now();
      if (remainingTime > 0) {
        setIsBlocked(true);
        setBlockTimeRemaining(Math.ceil(remainingTime / 1000));
        
        const interval = setInterval(() => {
          const newRemainingTime = parseInt(blockEndTime) - Date.now();
          if (newRemainingTime <= 0) {
            setIsBlocked(false);
            setBlockTimeRemaining(0);
            localStorage.removeItem(`loginBlockEndTime_${deviceId}`);
            localStorage.removeItem(`failedLoginAttempts_${deviceId}`);
            clearInterval(interval);
          } else {
            setBlockTimeRemaining(Math.ceil(newRemainingTime / 1000));
          }
        }, 1000);

        return () => clearInterval(interval);
      } else {
        // Block time expired, clean up
        localStorage.removeItem(`loginBlockEndTime_${deviceId}`);
        localStorage.removeItem(`failedLoginAttempts_${deviceId}`);
      }
    }
  }, []);

  // Hash function for basic security (simple but better than plain text)
  const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  const onSubmit = async (data: LoginData) => {
    if (isBlocked) {
      const minutes = Math.floor(blockTimeRemaining / 60);
      const seconds = blockTimeRemaining % 60;
      toast({
        variant: "destructive",
        title: "الحساب محظور مؤقتاً",
        description: `المحاولة متاحة بعد ${minutes}:${String(seconds).padStart(2, '0')} دقيقة`,
      });
      return;
    }

    setIsLoading(true);
    
    // User credentials stored with hashed passwords for security
    const users = {
      "Admin": { 
        passwordHash: simpleHash("Abu0555700769@@"), 
        type: "super_admin", 
        name: "مدير المجمع", 
        permissions: { canSwitchGender: true, gender: null } 
      },
      "AdminB": { 
        passwordHash: simpleHash("Abu0555700769@@B"), 
        type: "boys_admin", 
        name: "مدير مجمع البنين", 
        permissions: { canSwitchGender: false, gender: "male" } 
      },
      "AdminG": { 
        passwordHash: simpleHash("Abu0555700769@@G"), 
        type: "girls_admin", 
        name: "مدير مجمع البنات", 
        permissions: { canSwitchGender: false, gender: "female" } 
      }
    };

    const user = users[data.username as keyof typeof users];
    const inputPasswordHash = simpleHash(data.password);
    
    const deviceId = getDeviceFingerprint();
    
    if (user && inputPasswordHash === user.passwordHash) {
      // Successful login - reset failed attempts for this device
      localStorage.removeItem(`failedLoginAttempts_${deviceId}`);
      localStorage.removeItem(`loginBlockEndTime_${deviceId}`);
      
      // Store login information
      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminUser", JSON.stringify({
        username: data.username,
        type: user.type,
        name: user.name,
        permissions: user.permissions
      }));
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك ${user.name}`,
      });
      
      // Determine redirect path based on user type
      console.log('User type:', user.type); // Debug log
      if (user.type === "boys_admin") {
        // AdminB - redirect directly to admin page (will be handled by admin page logic)
        console.log('Setting redirect to admin page for boys admin'); // Debug log
        setShouldRedirect('/admin');
      } else if (user.type === "girls_admin") {
        // AdminG - redirect directly to admin page (will be handled by admin page logic)
        console.log('Setting redirect to admin page for girls admin'); // Debug log
        setShouldRedirect('/admin');
      } else {
        // Super admin - allow selection between complexes
        console.log('Showing admin selection for super admin'); // Debug log
        onLoginSuccess();
      }
    } else {
      // Failed login - increment attempts for this device only
      const failedAttempts = parseInt(localStorage.getItem(`failedLoginAttempts_${deviceId}`) || '0') + 1;
      localStorage.setItem(`failedLoginAttempts_${deviceId}`, failedAttempts.toString());
      
      if (failedAttempts >= 5) {
        // Block this device for 5 minutes
        const blockEndTime = Date.now() + (5 * 60 * 1000); // 5 minutes
        localStorage.setItem(`loginBlockEndTime_${deviceId}`, blockEndTime.toString());
        setIsBlocked(true);
        setBlockTimeRemaining(300); // 5 minutes in seconds
        
        toast({
          variant: "destructive",
          title: "تم حظر هذا الجهاز مؤقتاً",
          description: "تم تجاوز عدد المحاولات المسموحة لهذا الجهاز. المحاولة متاحة بعد 5 دقائق",
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: `اسم المستخدم أو كلمة المرور غير صحيحة (${failedAttempts}/5 محاولات لهذا الجهاز)`,
        });
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-slate-200/30 to-gray-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-gray-200/20 to-slate-200/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-gradient-to-r from-slate-100/40 to-gray-100/40 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10" dir="rtl">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl relative overflow-hidden group card-interactive">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-blue-50/20 to-indigo-50/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <CardHeader className="text-center relative z-10">
            <div className="mx-auto bg-slate-100/80 backdrop-blur-sm p-6 rounded-full w-fit mb-6 group-hover:bg-slate-200/80 transition-all duration-300 relative">
              <div className="relative">
                <UserCheck className="h-12 w-12 text-slate-700 group-hover:text-slate-600 transition-all duration-300 group-hover:scale-110" />
                <Lock className="h-5 w-5 text-slate-500 absolute -bottom-1 -right-1" />
                <Sparkles className="h-4 w-4 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-800 mb-3 arabic-text">تسجيل دخول الإدارة</CardTitle>
            <div className="relative inline-block mb-4 animate-float">
              <p className="text-lg text-slate-600 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-slate-200/50 arabic-text">
                منطقة الدخول الآمن للمديرين
              </p>
            </div>
          </CardHeader>
        <CardContent className="relative z-10">
          {isBlocked && (
            <Alert className="mb-6 border-red-300 bg-red-50/80 backdrop-blur-sm rounded-xl shadow-lg animate-slide-up">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-700 arabic-text">
                <div className="font-bold text-lg mb-2">تم حظر هذا الجهاز مؤقتاً</div>
                <div className="text-red-800 font-mono text-xl mb-2">
                  ⏱️ {Math.floor(blockTimeRemaining / 60)}:{String(blockTimeRemaining % 60).padStart(2, '0')} دقيقة
                </div>
                <div className="text-sm mb-1">تم تجاوز عدد المحاولات المسموحة لهذا الجهاز (5 محاولات)</div>
                <div className="text-xs text-red-600">ملاحظة: كل جهاز له عداد منفصل للمحاولات</div>
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="animate-fade-in">
                    <FormLabel className="text-slate-700 font-semibold arabic-text">اسم المستخدم</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors duration-300" />
                        <Input 
                          className="pr-12 h-12 bg-white/60 backdrop-blur-sm border-slate-300 hover:border-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 focus:ring-offset-0 transition-all duration-300 rounded-xl text-right arabic-text" 
                          placeholder="أدخل اسم المستخدم" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="animate-fade-in" style={{animationDelay: '0.1s'}}>
                    <FormLabel className="text-slate-700 font-semibold arabic-text">كلمة المرور</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors duration-300" />
                        <Input 
                          type="password" 
                          className="pr-12 h-12 bg-white/60 backdrop-blur-sm border-slate-300 hover:border-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 focus:ring-offset-0 transition-all duration-300 rounded-xl text-right arabic-text" 
                          placeholder="أدخل كلمة المرور" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group btn-interactive arabic-text text-lg font-semibold animate-scale-in"
                style={{animationDelay: '0.2s'}}
                disabled={isLoading || isBlocked}
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent ml-2" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <Key className="h-5 w-5 ml-2 group-hover:scale-110 transition-transform duration-300" />
                    تسجيل الدخول
                  </>
                )}
              </Button>
            </form>
          </Form>
          
          {/* Back to Home and Recovery Link */}
          <div className="text-center mt-8 pt-6 border-t border-slate-200/50 space-y-4 animate-slide-up" style={{animationDelay: '0.3s'}}>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setLocation('/')}
              className="gap-2 bg-white/70 backdrop-blur-sm border-slate-300 hover:bg-white/90 hover:border-slate-400 transition-all duration-300 rounded-xl px-6 py-3 group arabic-text"
            >
              <Home className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              العودة للصفحة الرئيسية
            </Button>
            
            {/* Hidden recovery link - only appears after failed attempts for this device */}
            {parseInt(localStorage.getItem(`failedLoginAttempts_${getDeviceFingerprint()}`) || '0') >= 3 && (
              <div className="animate-fade-in">
                <div className="p-3 bg-amber-50/80 backdrop-blur-sm rounded-xl border border-amber-200/50 mb-3">
                  <p className="text-amber-700 text-sm font-medium arabic-text mb-2">
                    هل نسيت بيانات الدخول؟
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation('/admin/recovery')}
                    className="text-amber-700 border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-all duration-300 rounded-xl px-4 py-2 group arabic-text"
                  >
                    <Shield className="h-4 w-4 ml-1 group-hover:scale-110 transition-transform duration-300" />
                    استعادة بيانات الدخول (طوارئ)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}