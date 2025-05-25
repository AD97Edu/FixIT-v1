import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useSuggestions, NewSuggestion } from '@/hooks/useSuggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Suggestion } from '@/types';

export default function Suggestions() {
  const { t } = useLanguage();
  const { createSuggestion, getUserSuggestions, deleteSuggestion, loading } = useSuggestions();
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

  const handleDelete = async (suggestionId: string) => {
    try {
      const success = await deleteSuggestion(suggestionId);
      if (success) {
        setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
        toast.success(t('suggestionDeleted'));
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      toast.error(t('errorDeletingSuggestion'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('suggestions')}</h1>
      <p className="text-muted-foreground mb-8">
        {t('helpImproveSystem')}
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="new">{t('newSuggestion')}</TabsTrigger>
          <TabsTrigger value="my-suggestions">{t('mySuggestions')}</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>{t('createNewSuggestion')}</CardTitle>
                <CardDescription>{t('shareYourIdea')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('title')}</Label>
                  <Input
                    id="title"
                    placeholder={t('suggestionTitlePlaceholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('suggestionDescriptionPlaceholder')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading || !title.trim()}>
                  {loading ? t('sending') : t('sendSuggestion')}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="my-suggestions">
          <Card>
            <CardHeader>
              <CardTitle>{t('mySuggestions')}</CardTitle>
              <CardDescription>{t('suggestionHistory')}</CardDescription>
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
                            {t('submittedOn')} {formatDate(suggestion.created_at)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap">{suggestion.description}</p>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(suggestion.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t('noSuggestionsYet')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
