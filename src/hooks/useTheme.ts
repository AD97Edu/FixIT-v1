import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  // Inicializa el tema desde localStorage o usa las preferencias del sistema
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  // Aplica el tema al elemento HTML cuando cambia
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Elimina la clase dark si existe
    root.classList.remove('dark', 'light');
    // Añade la clase según el tema
    root.classList.add(theme);
    
    // Guarda la preferencia en localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Función para alternar el tema
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}
