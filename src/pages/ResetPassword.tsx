import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, HCAPTCHA_SITEKEY } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import HCaptchaInfo from "@/components/auth/HCaptchaInfo";

// Input sanitization function
const sanitizeInput = (input: string): string => {
  return input.trim();
};

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
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
    
    // Sanitize input
    const sanitizedEmail = sanitizeInput(email);
    
    // Validate email
    if (!isValidEmail(sanitizedEmail)) {
      toast.error("Por favor, introduce un correo electrónico válido");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Enviar email de restablecimiento
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: "http://localhost:3000/auth/set-new-password",
        captchaToken
      });

      if (error) throw error;

      toast.success("Se ha enviado un enlace de restablecimiento a tu correo electrónico");
      navigate("/auth");
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
          <CardTitle>Restablecer Contraseña</CardTitle>
          <CardDescription>
            Introduce tu correo electrónico para recibir un enlace de restablecimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex flex-col items-center my-4">
              <HCaptcha
                sitekey={HCAPTCHA_SITEKEY}
                onVerify={handleCaptchaVerify}
                ref={captchaRef}
                theme="dark"
              />
              <HCaptchaInfo className="mt-2 text-center" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
              {isLoading ? "Enviando..." : "Enviar enlace de restablecimiento"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-sm text-primary hover:underline"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword; 