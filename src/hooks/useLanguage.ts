import { Console } from 'console';
import { useState, useEffect } from 'react';

// Objeto con las traducciones
const translations = {
  en: {
    // Navegación y menú lateral (existentes)
    "navigation": "Navigation",
    "dashboard": "Dashboard",
    "tickets": "Tickets",
    "newTicket": "New Ticket",
    "search": "Search",
    "profile": "Profile",
    "logout": "Logout",
    "language": "Language",
    "en": "English",
    "es": "Spanish",
    "quickIssueResolution": "Quick Issue Resolution",
    "version": "FixIT v1.0",
    
    // Títulos y subtítulos generales
    "welcome": "Welcome",
    "overview": "Overview",
    "statistics": "Statistics",
    "recentActivity": "Recent Activity",
    "viewAll": "View All",
    "details": "Details",
    "noData": "No data available",
    
    // Dashboard
    "openTickets": "Open Tickets",
    "inProgressTickets": "In Progress",
    "resolvedTickets": "Resolved",
    "closedTickets": "Closed",
    "highPriorityTickets": "High Priority",
    "ticketsThisWeek": "Tickets This Week",
    "resolutionTime": "Resolution Time",
    "ticketsByCategory": "Tickets by Category",
    "statusDistribution": "Status Distribution",
    "ticketTrends": "Ticket Trends",
    
    // Status y Categorías
    "status_open": "Open",
    "status_in_progress": "In Progress",
    "status_resolved": "Resolved",
    "status_closed": "Closed",
    "category_technical": "Technical",
    "category_billing": "Billing",
    "category_account": "Account",
    "category_other": "Other",
    
    // Prioridades
    "priority": "Priority",
    "priority_high": "High",
    "priority_medium": "Medium",
    "priority_low": "Low",
    "priority_info": "Information",
    
    // Tiempo
    "today": "Today",
    "yesterday": "Yesterday",
    "thisWeek": "This Week",
    "lastWeek": "Last Week",
    "dateCreated": "Date Created",
    "dateUpdated": "Date Updated",
    "lessThanHour": "Less than 1 hour ago",
    "hoursAgo": "hours ago",
    "daysAgo": "days ago",
    
    // Tickets
    "createTicket": "Create Ticket",
    "editTicket": "Edit Ticket",
    "deleteTicket": "Delete Ticket",
    "ticketDetails": "Ticket Details",
    "ticketNumber": "Ticket #",
    "title": "Title",
    "description": "Description",
    "category": "Category",
    "status": "Status",
    "assignedTo": "Assigned To",
    "created": "Created",
    "updated": "Updated",
    "comments": "Comments",
    "addComment": "Add Comment",
    "saveChanges": "Save Changes",
    "cancel": "Cancel",
    "submit": "Submit",
    
    // Perfil
    "profileSettings": "Profile Settings",
    "personalInfo": "Personal Information",
    "accountSettings": "Account Settings",
    "name": "Name",
    "email": "Email",
    "role": "Role",
    "changePassword": "Change Password",
    "currentPassword": "Current Password",
    "newPassword": "New Password",
    "confirmPassword": "Confirm Password",
    "saveProfile": "Save Profile",
    
    // Autenticación
    "signIn": "Sign In",
    "signUp": "Sign Up",
    "forgotPassword": "Forgot Password?",
    "resetPassword": "Reset Password",
    "enterEmail": "Enter your email",
    "enterPassword": "Enter your password",
    "confirmEmail": "Please confirm your email",
    "rememberMe": "Remember me",
    
    // Errores y notificaciones
    "error": "Error",
    "success": "Success",
    "warning": "Warning",
    "notification_info": "Information",
    "required": "Required",
    "invalid": "Invalid",
    "passwordMismatch": "Passwords do not match",
    "invalidCredentials": "Invalid email or password",
    "pleaseTryAgain": "Please try again",
    "ticketCreated": "Ticket created successfully",
    "ticketUpdated": "Ticket updated successfully",
    "ticketDeleted": "Ticket deleted successfully",
    "loginSuccess": "Logged in successfully",
    "logoutSuccess": "Logged out successfully",
    "profileUpdated": "Profile updated successfully",
    
    // Listas y filtros
    "loading": "Loading tickets",
    "sortBy": "Sort by",
    "newestFirst": "Newest first",
    "oldestFirst": "Oldest first",
    "showing": "Showing",
    "ticket": "ticket",
    "withStatus": "with status",
    "andPriority": "and priority",
    "noTicketsFound": "No tickets found",
    "adjustFilters": "Try adjusting your search or filters, or create a new ticket",
    "all": "All",
    "dateUnknown": "Date unknown",
    "vs": "vs",
    "days": "days",
    
    // NewTicket
    "errorCreatingTicket": "There was a problem creating your ticket. You can try:",
    "refreshPage": "Refreshing the page and trying again",
    "tryLogout": "Logging out and logging back in",
    "checkConsole": "Checking your browser console for more details",
    "briefSummary": "Brief summary of the issue",
    "keepItShort": "Keep it short and descriptive",
    "selectCategory": "Select category",
    "whatTypeOfIssue": "What type of issue is this?",
    "detailedDescription": "Detailed description of the issue...",
    "provideInformation": "Provide information about the issue you're experiencing",
    "provideRelevantInfo": "Please provide as much relevant information as possible",
    "submitting": "Submitting...",

    // ProjectStats keys
    "projectStatistics": "Project Statistics",
    "averageResolutionTime": "Average Resolution Time",
    "unresolvedTickets": "Unresolved Tickets",
    "resolvedLastWeek": "Resolved Last Week",
    "oldestOpenTicket": "Oldest Open Ticket",
    "categoryDistribution": "Category Distribution",
    // For categories, already present: category_technical, category_billing, category_account, category_other
  },
  es: {
    // Navegación y menú lateral (existentes)
    "navigation": "Navegación",
    "dashboard": "Panel",
    "tickets": "Tickets",
    "newTicket": "Nuevo Ticket",
    "search": "Buscar",
    "profile": "Perfil",
    "logout": "Cerrar Sesión",
    "language": "Idioma",
    "en": "Inglés",
    "es": "Español",
    "quickIssueResolution": "Resolución Rápida de Incidencias",
    "version": "FixIT v1.0",
    
    // Títulos y subtítulos generales
    "welcome": "Bienvenido",
    "overview": "Resumen",
    "statistics": "Estadísticas",
    "recentActivity": "Actividad Reciente",
    "viewAll": "Ver Todo",
    "details": "Detalles",
    "noData": "No hay datos disponibles",
    
    // Dashboard
    "openTickets": "Tickets Abiertos",
    "inProgressTickets": "En Progreso",
    "resolvedTickets": "Resueltos",
    "closedTickets": "Cerrados",
    "highPriorityTickets": "Alta Prioridad",
    "ticketsThisWeek": "Tickets Esta Semana",
    "resolutionTime": "Tiempo de Resolución",
    "ticketsByCategory": "Tickets por Categoría",
    "statusDistribution": "Distribución por Estado",
    "ticketTrends": "Tendencias de Tickets",
    
    // Status y Categorías
    "status_open": "Abierto",
    "status_in_progress": "En Progreso",
    "status_resolved": "Resuelto",
    "status_closed": "Cerrado",
    "category_technical": "Técnico",
    "category_billing": "Facturación",
    "category_account": "Cuenta",
    "category_other": "Otro",
    
    // Prioridades
    "priority": "Prioridad",
    "priority_high": "Alta",
    "priority_medium": "Media",
    "priority_low": "Baja",
    "priority_info": "Información",
    
    // Tiempo
    "today": "Hoy",
    "yesterday": "Ayer",
    "thisWeek": "Esta Semana",
    "lastWeek": "Semana Pasada",
    "dateCreated": "Fecha de Creación",
    "dateUpdated": "Fecha de Actualización",
    "lessThanHour": "Hace menos de 1 hora",
    "hoursAgo": "horas atrás",
    "daysAgo": "días atrás",
    
    // Tickets
    "createTicket": "Crear Ticket",
    "editTicket": "Editar Ticket",
    "deleteTicket": "Eliminar Ticket",
    "ticketDetails": "Detalles del Ticket",
    "ticketNumber": "Ticket #",
    "title": "Título",
    "description": "Descripción",
    "category": "Categoría",
    "status": "Estado",
    "assignedTo": "Asignado a",
    "created": "Creado",
    "updated": "Actualizado",
    "comments": "Comentarios",
    "addComment": "Añadir Comentario",
    "saveChanges": "Guardar Cambios",
    "cancel": "Cancelar",
    "submit": "Enviar",
    
    // Perfil
    "profileSettings": "Configuración de Perfil",
    "personalInfo": "Información Personal",
    "accountSettings": "Configuración de Cuenta",
    "name": "Nombre",
    "email": "Correo Electrónico",
    "role": "Rol",
    "changePassword": "Cambiar Contraseña",
    "currentPassword": "Contraseña Actual",
    "newPassword": "Nueva Contraseña",
    "confirmPassword": "Confirmar Contraseña",
    "saveProfile": "Guardar Perfil",
    
    // Autenticación
    "signIn": "Iniciar Sesión",
    "signUp": "Registrarse",
    "forgotPassword": "¿Olvidó su contraseña?",
    "resetPassword": "Restablecer Contraseña",
    "enterEmail": "Ingrese su correo electrónico",
    "enterPassword": "Ingrese su contraseña",
    "confirmEmail": "Por favor confirme su correo electrónico",
    "rememberMe": "Recordarme",
    
    // Errores y notificaciones
    "error": "Error",
    "success": "Éxito",
    "warning": "Advertencia",
    "notification_info": "Información",
    "required": "Requerido",
    "invalid": "Inválido",
    "passwordMismatch": "Las contraseñas no coinciden",
    "invalidCredentials": "Correo electrónico o contraseña inválidos",
    "pleaseTryAgain": "Por favor intente de nuevo",
    "ticketCreated": "Ticket creado con éxito",
    "ticketUpdated": "Ticket actualizado con éxito",
    "ticketDeleted": "Ticket eliminado con éxito",
    "loginSuccess": "Inicio de sesión exitoso",
    "logoutSuccess": "Sesión cerrada con éxito",
    "profileUpdated": "Perfil actualizado con éxito",
    
    // Listas y filtros
    "loading": "Cargando tickets",
    "sortBy": "Ordenar por",
    "newestFirst": "Más recientes primero",
    "oldestFirst": "Más antiguos primero",
    "showing": "Mostrando",
    "ticket": "ticket",
    "withStatus": "con estado",
    "andPriority": "y prioridad",
    "noTicketsFound": "No se encontraron tickets",
    "adjustFilters": "Intente ajustar su búsqueda o filtros, o cree un nuevo ticket",
    "all": "Todos",
    "dateUnknown": "Fecha desconocida",
    "vs": "vs",
    "days": "días",
    
    // NewTicket
    "errorCreatingTicket": "Hubo un problema al crear su ticket. Puede intentar:",
    "refreshPage": "Actualizar la página e intentar nuevamente",
    "tryLogout": "Cerrar sesión y volver a iniciar sesión",
    "checkConsole": "Revisar la consola del navegador para más detalles",
    "briefSummary": "Breve resumen del problema",
    "keepItShort": "Manténgalo corto y descriptivo",
    "selectCategory": "Seleccionar categoría",
    "whatTypeOfIssue": "¿Qué tipo de problema es este?",
    "detailedDescription": "Descripción detallada del problema...",
    "provideInformation": "Proporcione información sobre el problema que está experimentando",
    "provideRelevantInfo": "Por favor proporcione toda la información relevante posible",
    "submitting": "Enviando...",

    // ProjectStats keys
    "projectStatistics": "Estadísticas del Proyecto",
    "averageResolutionTime": "Tiempo Medio de Resolución",
    "unresolvedTickets": "Tickets Sin Resolver",
    "resolvedLastWeek": "Resueltos la Última Semana",
    "oldestOpenTicket": "Ticket Abierto Más Antiguo",
    "categoryDistribution": "Distribución por Categoría",
    // For categories, already present: category_technical, category_billing, category_account, category_other
  }
};

export function useLanguage() {
  // Detectar el idioma guardado o usar el del navegador
  const getInitialLanguage = () => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
      return savedLanguage;
    }
    // Si no hay idioma guardado, intentar detectar el del navegador
    const browserLang = navigator.language.split('-')[0];
    console.log("El idioma del navegador es:")
    console.log(browserLang);
    return browserLang === 'es' ? 'es' : 'en'; // Valores por defecto
  };

  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage());

  // Función para cambiar el idioma
  const changeLanguage = (lng: string) => {
    if (lng === 'en' || lng === 'es') {
      setCurrentLanguage(lng);
      localStorage.setItem('language', lng);
    }
  };

  // Función para traducir un texto
  const t = (key: string) => {
    return translations[currentLanguage as keyof typeof translations]?.[key] || key;
  };

  // Efecto para guardar el idioma cuando cambia
  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
  }, [currentLanguage]);

  return {
    t,
    changeLanguage,
    currentLanguage
  };
}