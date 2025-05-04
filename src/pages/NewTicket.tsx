import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreateTicket } from "@/hooks/useTickets";
import { useAuth } from "@/components/auth/AuthProvider";
import { tryCreateTicket, checkTicketsSchema } from "@/diagnostics/checkSchema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Please provide a more detailed description"),
  category: z.enum(["technical", "billing", "account", "other"]),
});

const NewTicket = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { mutate: createTicket, isPending, isError, error } = useCreateTicket();
  const { user } = useAuth();
  const [showDiagnosticHelp, setShowDiagnosticHelp] = useState(false);
  
  // Ejecutamos el diagnóstico cuando se monta el componente
  useEffect(() => {
    // Exponemos las funciones al objeto window
    if (typeof window !== 'undefined') {
      (window as any).tryCreateTicket = tryCreateTicket;
      (window as any).checkTicketsSchema = checkTicketsSchema;
    }
    
    console.log("Component mounted, diagnostics available in console");
    console.log("You can run window.tryCreateTicket() to test ticket creation");
    console.log("Or window.checkTicketsSchema() to check the database schema");
  }, []);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "technical",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("You need to be logged in to create a ticket");
      return;
    }
    
    createTicket({
      ...values,
      userId: user.id,
      status: "open",
      priority: "info", // Por defecto, será asignado por un administrador
    }, {
      onSuccess: () => {
        toast.success("Ticket created successfully!");
        navigate("/tickets");
      },
      onError: (error) => {
        console.error("Error creating ticket:", error);
        toast.error("Failed to create ticket. Please try again.");
        setShowDiagnosticHelp(true);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{t('createTicket')}</h1>
      
      {showDiagnosticHelp && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('error')} {t('createTicket').toLowerCase()}</AlertTitle>
          <AlertDescription>
            {t('errorCreatingTicket')}
            <ul className="list-disc ml-5 mt-2">
              <li>{t('refreshPage')}</li>
              <li>{t('tryLogout')}</li>
              <li>{t('checkConsole')}</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>{t('ticketDetails')}</CardTitle>
          <CardDescription>
            {t('provideInformation')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('title')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('briefSummary')} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('keepItShort')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('category')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectCategory')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="technical">{t('category_technical')}</SelectItem>
                          <SelectItem value="billing">{t('category_billing')}</SelectItem>
                          <SelectItem value="account">{t('category_account')}</SelectItem>
                          <SelectItem value="other">{t('category_other')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('whatTypeOfIssue')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('detailedDescription')} 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {t('provideRelevantInfo')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/tickets')}
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? t('submitting') : t('submit')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewTicket;
