import { useState, useEffect } from 'react';
import { useSuggestions } from '@/hooks/useSuggestions';
import { Suggestion } from '@/types';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function AdminSuggestions() {
  const { t } = useLanguage();
  const { getAllSuggestions, deleteSuggestion, loading } = useSuggestions();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState<Suggestion | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const allSuggestions = await getAllSuggestions();
      if (allSuggestions) {
        setSuggestions(allSuggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Error al cargar las sugerencias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (suggestion: Suggestion) => {
    setSuggestionToDelete(suggestion);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!suggestionToDelete) return;
    
    try {
      const success = await deleteSuggestion(suggestionToDelete.id);
      if (success) {
        // Actualizar la lista de sugerencias
        setSuggestions(suggestions.filter(s => s.id !== suggestionToDelete.id));
        toast.success('Sugerencia eliminada correctamente');
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      toast.error('Error al eliminar la sugerencia');
    } finally {
      setDeleteDialogOpen(false);
      setSuggestionToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Gestión de Sugerencias</h1>
      <p className="text-muted-foreground mb-8">
        Administra las sugerencias enviadas por los usuarios del sistema.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Listado de sugerencias</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : suggestions.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell className="font-medium">{suggestion.title}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate whitespace-pre-wrap line-clamp-2">
                          {suggestion.description}
                        </div>
                      </TableCell>
                      <TableCell>{suggestion.user_name}</TableCell>
                      <TableCell>{formatDate(suggestion.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(suggestion)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay sugerencias disponibles.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la sugerencia de {suggestionToDelete?.user_name}: "{suggestionToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
