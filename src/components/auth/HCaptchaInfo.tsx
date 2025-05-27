import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface HCaptchaInfoProps {
  className?: string;
}

const HCaptchaInfo: React.FC<HCaptchaInfoProps> = ({ className }) => {
  return (
    <div className={`text-xs text-gray-500 mt-2 flex items-start gap-1.5 ${className || ''}`}>
      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        Este sitio está protegido por hCaptcha y sus{' '}
        <a 
          href="https://www.hcaptcha.com/privacy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Políticas de Privacidad
        </a>{' '}
        y{' '}
        <a 
          href="https://www.hcaptcha.com/terms" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Términos de Servicio
        </a>{' '}
        aplican.
      </div>
    </div>
  );
};

export default HCaptchaInfo;
