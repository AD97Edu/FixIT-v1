import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Set the initial theme before rendering the app
const setInitialTheme = () => {
  const theme = localStorage.getItem('theme') || 'dark';
  
  document.documentElement.classList.add(theme);
};

// Run before the app renders
setInitialTheme();

createRoot(document.getElementById("root")!).render(<App />);
