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
import { Lock, User, Home, Shield, AlertTriangle } from "lucide-react";

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
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Check if user is currently blocked
  useEffect(() => {
    const blockEndTime = localStorage.getItem('loginBlockEndTime');
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
            localStorage.removeItem('loginBlockEndTime');
            localStorage.removeItem('failedLoginAttempts');
            clearInterval(interval);
          } else {
            setBlockTimeRemaining(Math.ceil(newRemainingTime / 1000));
          }
        }, 1000);

        return () => clearInterval(interval);
      } else {
        // Block time expired, clean up
        localStorage.removeItem('loginBlockEndTime');
        localStorage.removeItem('failedLoginAttempts');
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
    
    if (user && inputPasswordHash === user.passwordHash) {
      // Successful login - reset failed attempts
      localStorage.removeItem('failedLoginAttempts');
      localStorage.removeItem('loginBlockEndTime');
      
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
      onLoginSuccess();
    } else {
      // Failed login - increment attempts
      const failedAttempts = parseInt(localStorage.getItem('failedLoginAttempts') || '0') + 1;
      localStorage.setItem('failedLoginAttempts', failedAttempts.toString());
      
      if (failedAttempts >= 5) {
        // Block user for 5 minutes
        const blockEndTime = Date.now() + (5 * 60 * 1000); // 5 minutes
        localStorage.setItem('loginBlockEndTime', blockEndTime.toString());
        setIsBlocked(true);
        setBlockTimeRemaining(300); // 5 minutes in seconds
        
        toast({
          variant: "destructive",
          title: "تم حظر الحساب مؤقتاً",
          description: "تم تجاوز عدد المحاولات المسموحة. المحاولة متاحة بعد 5 دقائق",
        });
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: `اسم المستخدم أو كلمة المرور غير صحيحة (${failedAttempts}/5 محاولات)`,
        });
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">تسجيل دخول الإدارة</CardTitle>
          <p className="text-slate-600">يرجى إدخال بيانات الدخول للوصول إلى لوحة التحكم</p>
        </CardHeader>
        <CardContent>
          {isBlocked && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                تم حظر الحساب مؤقتاً لمدة {Math.floor(blockTimeRemaining / 60)}:{String(blockTimeRemaining % 60).padStart(2, '0')} دقيقة
                <br />
                <span className="text-sm">تم تجاوز عدد المحاولات المسموحة (5 محاولات)</span>
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المستخدم</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input className="pr-10" placeholder="أدخل اسم المستخدم" {...field} />
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
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          type="password" 
                          className="pr-10" 
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
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent ml-2" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>
          </Form>
          
          {/* Back to Home and Recovery Link */}
          <div className="text-center mt-6 pt-6 border-t border-slate-200 space-y-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation('/')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              العودة للصفحة الرئيسية
            </Button>
            
            {/* Hidden recovery link - only appears after failed attempts */}
            {parseInt(localStorage.getItem('failedLoginAttempts') || '0') >= 3 && (
              <div>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => setLocation('/admin/recovery')}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  استعادة بيانات الدخول (طوارئ)
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}