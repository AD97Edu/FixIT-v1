import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = "medium", 
  text, 
  className 
}: LoadingSpinnerProps) {
  const { t } = useLanguage();
  
  const sizeMap = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-10 h-10"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-2",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeMap[size]
      )} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
      {!text && <p className="text-sm text-muted-foreground">{t('loading')}...</p>}
    </div>
  );
}
