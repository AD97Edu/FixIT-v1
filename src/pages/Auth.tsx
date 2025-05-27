import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, HCAPTCHA_SITEKEY } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import HCaptchaInfo from "@/components/auth/HCaptchaInfo";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha | null>(null);

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const resetCaptcha = () => {
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
    setCaptchaToken(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar que el captcha ha sido completado
    if (!captchaToken) {
      toast.error("Por favor, completa la verificación de captcha");
      return;
    }
    
    setIsLoading(true);    
    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken
          }
        });
        if (error) throw error;
        
        // Obtener rol del usuario desde la tabla usuario_rol
        const { data: roleData } = await supabase
          .from('usuario_rol')
          .select('rol')
          .eq('user_id', data.user.id)
          .single();
          
        const userRole = roleData?.rol || 'user';
        
        toast.success("Sesión iniciada correctamente!");
        // Usar getHomeRouteForRole para redirigir según el rol
        const homeRoute = userRole === 'admin' ? '/' : '/how-it-works';
        navigate(homeRoute);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            captchaToken
          }
        });
        if (error) throw error;
        toast.success("¡Registro completado! Por favor, verifica tu correo electrónico.");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
      toast.error(errorMessage);
      resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative" style={{ backgroundImage: 'url(/render-background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/40 z-0" />
      <Card className="w-full max-w-md z-10">
        <div className="flex justify-center pt-6">
          <img src="https://i.postimg.cc/Rhzr3Jb3/Fix-IT-LOGO-png.png" alt="Fixit Logo" className="h-20" />
        </div>
        <CardHeader>
          <CardTitle>{isLogin ? "Inicio de sesión" : "Registro de cuenta"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Bienvenido! Por favor, inicia sesión en tu cuenta"
              : "Crea una nueva cuenta para comenzar a usar Fixit."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  placeholder="Ingresa tu nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Introduce tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
              {isLoading ? "Cargando..." : isLogin ? "Entrar" : "Registrarse"}
            </Button>
            <div className="flex flex-col items-center my-4">
              <HCaptcha
                sitekey={HCAPTCHA_SITEKEY}
                onVerify={handleCaptchaVerify}
                ref={captchaRef}
                theme="dark"
              />
              <HCaptchaInfo className="mt-2 text-center" />
            </div>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                resetCaptcha();
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? "No tienes una cuenta? Regístrate"
                : "Ya tienes una cuenta? Inicia sesión"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
