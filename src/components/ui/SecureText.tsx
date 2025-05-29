import React from 'react';
import { sanitizeInput } from '@/utils/security';

interface SecureTextProps {
  text: string;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

export const SecureText: React.FC<SecureTextProps> = ({
  text,
  className = '',
  as: Component = 'p'
}) => {
  const sanitizedText = sanitizeInput(text);
  
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedText }}
    />
  );
};

export default SecureText; 