import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useSuggestions, Suggestion, NewSuggestion } from '@/hooks/useSuggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Suggestions() {
  const { t } = useLanguage();
  const { createSuggestion, getUserSuggestions, loading } = useSuggestions();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('new');

  // Cargar sugerencias existentes al cambiar a la pestaña "Mis sugerencias"
  useEffect(() => {
    if (activeTab === 'my-suggestions') {
      fetchSuggestions();
    }
  }, [activeTab]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    const userSuggestions = await getUserSuggestions();
    if (userSuggestions) {
      setSuggestions(userSuggestions);
    }
    setLoadingSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    const newSuggestion: NewSuggestion = {
      title: title.trim(),
      description: description.trim()
    };

    const suggestionId = await createSuggestion(newSuggestion);
    
    if (suggestionId) {
      setTitle('');
      setDescription('');
      // Cambiar a la pestaña de mis sugerencias después de crear una nueva
      setActiveTab('my-suggestions');
      await fetchSuggestions();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Sugerencias</h1>
      <p className="text-muted-foreground mb-8">
        Ayúdanos a mejorar nuestro sistema compartiendo tus ideas y sugerencias.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="new">Nueva sugerencia</TabsTrigger>
          <TabsTrigger value="my-suggestions">Mis sugerencias</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Crear nueva sugerencia</CardTitle>
                <CardDescription>
                  Comparte tu idea para mejorar nuestro servicio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Título de tu sugerencia"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe tu sugerencia con más detalle..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading || !title.trim()}>
                  {loading ? 'Enviando...' : 'Enviar sugerencia'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="my-suggestions">
          <Card>
            <CardHeader>
              <CardTitle>Mis sugerencias</CardTitle>
              <CardDescription>
                Historial de sugerencias que has enviado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSuggestions ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : suggestions.length > 0 ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <Card key={suggestion.id} className="bg-muted/50">
                        <CardHeader>
                          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                          <CardDescription>
                            Enviada el {formatDate(suggestion.created_at)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap">{suggestion.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No has enviado ninguna sugerencia aún.
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setActiveTab('new')}>
                Crear nueva sugerencia
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
