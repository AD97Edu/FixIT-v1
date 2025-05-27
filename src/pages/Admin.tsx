import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { UserService } from "@/services/users";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, UserPlus, ShieldAlert, Settings, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: "admin" | "agent" | "user";
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [configuring, setConfiguring] = useState(false);
  
  // Estado de conexión a Supabase
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  // Estado para nuevo usuario
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUserForm>({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  useEffect(() => {
    fetchUsers();
    getCurrentUser();
    // Verificar conexión a Supabase al cargar
    checkSupabaseConnection();
  }, []);

  // Función de ayuda para verificar conexión a Supabase
  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      setConnectionStatus('loading');
      setConnectionError(null);
      
      // Primero verificamos si podemos acceder a la API de Supabase
      const { error: pingError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });
      
      if (pingError) {
        console.error("Error de conexión básica con Supabase:", pingError);
        setConnectionError(`Error de conexión con Supabase: ${pingError.message}`);
        setConnectionStatus('error');
        return false;
      }
      
      // Luego verificamos si podemos acceder a la función Edge
      try {
        // Obtenemos la sesión para tener el token
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.error("Error al obtener sesión:", sessionError || "No hay sesión activa");
          setConnectionError("No se pudo obtener una sesión válida. Inicia sesión nuevamente.");
          setConnectionStatus('error');
          return false;
        }
        
        // Hacemos una pequeña petición a la función para verificar si responde
        const { error: functionError } = await supabase.functions.invoke('get-users', {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`
          }
        });
        
        if (functionError) {
          console.error("Error al probar la función Edge:", functionError);
          setConnectionError(`Error con la función Edge: ${functionError.message}`);
          setConnectionStatus('error');
          return false;
        }
      } catch (edgeError: any) {
        console.error("Excepción al probar la función Edge:", edgeError);
        setConnectionError(`Error al conectar con la función Edge: ${edgeError.message}`);
        setConnectionStatus('error');
        return false;
      }
      
      // Si llegamos aquí, la conexión es exitosa
      setConnectionStatus('connected');
      return true;
    } catch (e: any) {
      console.error("Error general verificando conexión:", e);
      setConnectionError(`Error de conexión: ${e.message}`);
      setConnectionStatus('error');
      return false;
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setConnectionError(null);
      
      // Verificar conexión a Supabase primero
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error("No se pudo conectar a Supabase");
      }
      
      // Utilizamos el servicio para obtener los usuarios
      const userList = await UserService.getAllUsers();
      
      setUsers(userList);
      setConnectionStatus('connected');
      console.log("Usuarios cargados correctamente:", userList);
      
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);
      setConnectionStatus('error');
      
      // Guardar el mensaje de error para mostrar información de diagnóstico
      setConnectionError(error.message || "Error desconocido");
      
      // Si es un error de permisos, mostramos un mensaje específico
      if (error.message?.includes('Permiso denegado') || error.status === 403) {
        toast.error("No tienes permisos para ver la lista de usuarios");
      } else if (error.message?.includes('Function not found') || error.status === 404) {
        toast.error("La función Edge 'get-users' no fue encontrada. Verifica que esté desplegada correctamente.");
      } else if (error.message?.includes('CORS')) {
        toast.error("Error de CORS. Verifica la configuración de CORS en Supabase.");
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        toast.error("Error de red. Verifica tu conexión a Internet.");
      } else {
        toast.error("Error al cargar usuarios: " + error.message);
      }
      
      // Intentar obtener usuarios de respaldo
      try {
        const fallbackUsers = await UserService.getFallbackUsers();
        
        if (fallbackUsers.length > 0) {
          setUsers(fallbackUsers);
          toast("Se muestran usuarios con información limitada", { 
            description: "No se pudieron obtener emails y roles reales."
          });
          return;
        }
      } catch (e) {
        console.error("Error en obtener usuarios de respaldo:", e);
      }
      
      // Si todo falla, mostramos datos de demostración
      const demoUsers: User[] = [
        { id: "demo1", name: "Edu Gandía", email: "edugandia1997@gmail.com", role: "admin" },
        { id: "demo2", name: "Derex Gaming", email: "derexgaming2013@gmail.com", role: "agent" },
        { id: "demo3", name: "Usuario Demo", email: "usuario@ejemplo.com", role: "user" }
      ];
      setUsers(demoUsers);
      toast("Cargando datos de demostración", { 
        description: "No se pudo cargar usuarios reales. Mostrando datos de ejemplo."
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
    } catch (error: any) {
      console.error("Error obteniendo usuario actual:", error);
    }
  };
  
  const configureSupabaseRoles = async () => {
    try {
      setConfiguring(true);
      
      // En una implementación real, esto se haría a través de un endpoint de backend seguro
      // Pero para desarrollo, vamos a simular que configuramos los roles
      
      // 1. Establecemos los metadatos del usuario actual como admin
      const { error } = await supabase.functions.invoke('set-admin-role', {
        body: { userId: currentUser?.id }
      });
      
      if (error) throw error;
      
      toast.success("Roles configurados correctamente en Supabase");
      
      // Esperamos un poco para simular el proceso
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error: any) {
      console.error("Error configurando roles:", error);
      toast.error(`No se pudo configurar los roles: ${error.message}. Esto requiere un endpoint de backend apropiado.`);
    } finally {
      setConfiguring(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditedUser({...user});
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedUser) {
      setEditedUser({
        ...editedUser,
        [e.target.name]: e.target.value
      });
    }
  };
  
  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (value: string) => {
    // Si cambia el rol, mostrar confirmación
    if (editedUser && editedUser.role !== value) {
      setPendingRoleChange(value);
      setShowRoleConfirm(true);
    }
  };
  
  const confirmRoleChange = async () => {
    if (editedUser && pendingRoleChange) {
      try {
        // Mostrar mensaje de carga
        const loadingToast = toast.loading("Actualizando rol de usuario...");
        
        // Utilizamos el servicio para actualizar el rol
        const updatedUser = await UserService.updateUserRole(
          editedUser.id, 
          pendingRoleChange as "admin" | "agent" | "user"
        );
        
        // Actualizamos la interfaz con los datos del usuario actualizado
        setEditedUser(updatedUser);
        
        // Actualizamos la lista de usuarios en la interfaz
        setUsers(users.map(u => 
          u.id === updatedUser.id ? updatedUser : u
        ));
        
        // Cerrar diálogo de confirmación y mostrar mensaje de éxito
        setShowRoleConfirm(false);
        setPendingRoleChange(null);
        toast.dismiss(loadingToast);
        toast.success(`Rol de ${updatedUser.name} actualizado a ${updatedUser.role}`);
        
      } catch (error: any) {
        console.error("Error al actualizar rol:", error);
        
        // Mostrar mensaje específico si el error es de autenticación o permisos
        if (error.message?.includes('Permiso denegado') || error.status === 403) {
          toast.error("No tienes permisos para actualizar roles. Se requiere rol de administrador.");
        } else {
          toast.error("Error al actualizar rol: " + error.message);
        }
        
        // Cerrar diálogo de confirmación
        setShowRoleConfirm(false);
        setPendingRoleChange(null);
      }
    }
  };
  
  const cancelRoleChange = () => {
    setShowRoleConfirm(false);
    setPendingRoleChange(null);
  };
  
  const handleNewUserRoleChange = (value: string) => {
    setNewUser({
      ...newUser,
      role: value as "admin" | "agent" | "user"
    });
  };

  const saveChanges = async () => {
    if (!editedUser) return;
    
    try {
      // Utilizamos el servicio para actualizar el usuario
      const updatedUser = await UserService.updateUser(editedUser);
      
      // Actualizamos la lista de usuarios en la interfaz
      setUsers(users.map(u => 
        u.id === updatedUser.id ? updatedUser : u
      ));
      
      setIsDialogOpen(false);
      toast.success("Usuario actualizado correctamente");
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      toast.error("Error al actualizar usuario: " + error.message);
    }
  };
  
  const createNewUser = async () => {
    try {
      // Validar campos
      if (!newUser.name || !newUser.email || !newUser.password) {
        toast.error("Todos los campos son obligatorios");
        return;
      }
      
      // Mostrar mensaje de carga
      const loadingToast = toast.loading("Creando usuario...");
      
      // Usamos el servicio para crear el usuario
      const createdUser = await UserService.createUser(
        newUser.email,
        newUser.password,
        newUser.name,
        newUser.role
      );
      
      // Agregamos el usuario a nuestra lista
      setUsers([...users, createdUser]);
      
      // Cerrar el diálogo y mostrar mensaje de éxito
      setIsNewUserDialogOpen(false);
      toast.dismiss(loadingToast);
      toast.success(`Usuario ${createdUser.name} creado con éxito`);
      
      // Resetear formulario
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user"
      });
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      
      // Mostrar mensaje específico si el error es de autenticación o permisos
      if (error.message?.includes('Permiso denegado') || error.status === 403) {
        toast.error("No tienes permisos para crear usuarios. Se requiere rol de administrador.");
      } else if (error.message?.includes('already exists')) {
        toast.error("El correo electrónico ya está en uso. Intenta con otro.");
      } else {
        toast.error("Error al crear usuario: " + error.message);
      }
    }
  };

  // Función para filtrar usuarios basado en búsqueda y filtro de rol
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Aplicar filtro de búsqueda
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase());
        
      // Aplicar filtro de rol
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  // Función para probar conexión directa a Supabase sin funciones Edge
  const testDirectConnection = async () => {
    try {
      toast.info("Probando conexión directa a Supabase...");
      
      // Verificamos la conexión a la tabla de perfiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
        
      if (error) {
        console.error("Error en conexión directa:", error);
        toast.error(`Error de conexión directa: ${error.message}`);
        return;
      }
      
      if (profiles && profiles.length > 0) {
        toast.success(`Conexión directa exitosa: ${profiles.length} perfiles obtenidos`);
      } else {
        toast.success("Conexión directa exitosa, pero no hay perfiles");
      }
      
      // También probamos la sesión
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError);
        toast.error(`Error de sesión: ${sessionError.message}`);
        return;
      }
      
      if (sessionData.session) {
        console.log("Sesión válida:", sessionData.session.user.email);
        toast.success(`Sesión válida: ${sessionData.session.user.email}`);
      } else {
        console.log("No hay sesión activa");
        toast.warning("No hay sesión activa. Inicia sesión para usar funciones Edge.");
      }
      
    } catch (e: any) {
      console.error("Error en prueba de conexión directa:", e);
      toast.error(`Error: ${e.message}`);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Administración de Usuarios</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsNewUserDialogOpen(true)} 
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
          <Button onClick={fetchUsers} variant="outline">
            Actualizar
          </Button>
        </div>
      </div>

      {/* Indicador de estado de conexión */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center">
          <div className={`h-3 w-3 rounded-full mr-2 ${
            connectionStatus === 'connected' 
              ? 'bg-green-500' 
              : connectionStatus === 'error' 
              ? 'bg-red-500' 
              : 'bg-yellow-500 animate-pulse'
          }`}></div>
          <span className="text-sm mr-4">
            {connectionStatus === 'connected' 
              ? 'Conectado a Supabase' 
              : connectionStatus === 'error' 
              ? 'Error de conexión con Supabase' 
              : 'Verificando conexión...'}
          </span>
          {connectionStatus === 'error' && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={checkSupabaseConnection}
              className="text-xs py-1 h-7"
            >
              Reintentar conexión
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              toast.info("Diagnóstico iniciado", {
                description: "Verificando conexión a funciones Edge..."
              });
              checkSupabaseConnection();
            }}
            className="text-xs py-1 h-7 ml-2"
          >
            Diagnosticar
          </Button>
        </div>
        
        {connectionError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-1">
            <h4 className="text-sm font-medium text-red-800 mb-1">Detalles del error:</h4>
            <p className="text-xs text-red-700 font-mono whitespace-pre-wrap">{connectionError}</p>
            <div className="mt-2 text-xs text-red-600">
              <p>Posibles soluciones:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Verifica que las funciones Edge estén desplegadas correctamente en Supabase</li>
                <li>Comprueba que tienes una sesión activa (intenta cerrar sesión y volver a iniciar)</li>
                <li>Asegúrate de que la URL del proyecto Supabase es correcta</li>
                <li>Revisa la configuración CORS en el proyecto Supabase</li>
              </ul>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={testDirectConnection}
                className="text-xs py-1 h-7"
              >
                Probar conexión directa
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // Volvemos a los datos de fallback sin intentar conectar a Edge
                  UserService.getFallbackUsers().then(users => {
                    setUsers(users);
                    toast.success("Usando datos de respaldo", {
                      description: "Se muestran usuarios con datos limitados mientras se resuelve el problema de conexión"
                    });
                  });
                }}
                className="text-xs py-1 h-7"
              >
                Usar datos de respaldo
              </Button>
              
              <a 
                href="https://app.supabase.com/project/_/functions"
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-xs py-1 h-7 px-3 bg-purple-50 text-purple-700 rounded border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                Abrir Supabase Functions
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Sección de configuración de roles */}
      <Card className="mb-8 bg-amber-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            Configuración de Roles en Supabase
          </CardTitle>
          <CardDescription>
            Durante el desarrollo, puedes usar esta tarjeta para configurar los roles de usuario en Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-2">
            <strong>Usuario actual:</strong> {currentUser?.email || 'No disponible'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Esta función crea/configura roles de usuario en Supabase para permitir el funcionamiento real del control de acceso basado en roles.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={configureSupabaseRoles} 
            disabled={configuring}
            className="flex items-center gap-2"
            variant="default"
          >
            {configuring ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-100 border-t-gray-800"></div>
                Configurando...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                Establecer Roles en Supabase
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Controles de búsqueda y filtrado */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar usuarios por nombre, email o ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={setRoleFilter}
        >
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="agent">Agente</SelectItem>
            <SelectItem value="user">Usuario</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Estadísticas de resultados */}
      <div className="text-sm text-gray-500 mb-2">
        Mostrando {filteredUsers.length} de {users.length} usuarios
        {roleFilter !== 'all' && ` (Filtrando por rol: ${roleFilter})`}
        {searchTerm && ` (Buscando: "${searchTerm}")`}
      </div>

      {loading ? (
        <div className="text-center py-10">Cargando usuarios...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'agent' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.confirmed_at 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {user.confirmed_at ? 'Verificado' : 'Pendiente'}
                      </span>
                      {user.last_sign_in && (
                        <div className="text-xs text-gray-500 mt-1">
                          Último acceso: {new Date(user.last_sign_in).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewUserDetails(user)}
                        >
                          Detalles
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {users.length === 0 ? (
                      <div className="flex flex-col items-center">
                        <p className="text-gray-500 mb-2">No se encontraron usuarios</p>
                        <p className="text-sm text-gray-400">Aún no hay usuarios registrados en el sistema</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <p className="text-gray-500 mb-2">No se encontraron usuarios con los criterios de búsqueda</p>
                        <p className="text-sm text-gray-400">Intenta cambiar los filtros o términos de búsqueda</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog para editar usuario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          
          {editedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  value={editedUser.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={editedUser.email}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select 
                  value={editedUser.role} 
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agente</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveChanges}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para crear usuario */}
      <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa los datos para crear un nuevo usuario en el sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nombre Completo</Label>
              <Input
                id="new-name"
                name="name"
                value={newUser.name}
                onChange={handleNewUserInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                name="email"
                type="email"
                value={newUser.email}
                onChange={handleNewUserInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">Contraseña</Label>
              <Input
                id="new-password"
                name="password"
                type="password"
                value={newUser.password}
                onChange={handleNewUserInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-role">Rol</Label>
              <Select 
                value={newUser.role} 
                onValueChange={handleNewUserRoleChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createNewUser}>
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmación de cambio de rol */}
      <AlertDialog open={showRoleConfirm} onOpenChange={setShowRoleConfirm}>
        <AlertDialogContent>
          <DialogTitle className="text-lg font-semibold">
           ""
          </DialogTitle>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar rol de usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Está a punto de cambiar el rol del usuario a {pendingRoleChange}.
              Este cambio modificará los permisos y acceso del usuario en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelRoleChange}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para ver detalles del usuario */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="text-lg font-semibold">
           ""
          </DialogTitle>
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa del usuario
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-xl font-semibold">
                  {selectedUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">ID de Usuario</h4>
                    <p className="mt-1 text-sm font-mono">{selectedUser.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Rol</h4>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedUser.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : selectedUser.role === 'agent' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.role}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Fecha de Creación</h4>
                    <p className="mt-1 text-sm">
                      {selectedUser.created_at
                        ? new Date(selectedUser.created_at).toLocaleString()
                        : 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Último Acceso</h4>
                    <p className="mt-1 text-sm">
                      {selectedUser.last_sign_in
                        ? new Date(selectedUser.last_sign_in).toLocaleString()
                        : 'No disponible'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Estado de Verificación</h4>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded text-xs ${
                      selectedUser.confirmed_at 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedUser.confirmed_at ? 'Verificado' : 'Pendiente de verificación'}
                    </span>
                    {selectedUser.confirmed_at && (
                      <span className="ml-2 text-xs text-gray-500">
                        {new Date(selectedUser.confirmed_at).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Cerrar
            </Button>
            {selectedUser && (
              <Button onClick={() => {
                setIsDetailsDialogOpen(false);
                handleEditUser(selectedUser);
              }}>
                Editar Usuario
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin; 