import React, { useState, useEffect, useCallback } from "react";
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
import { AlertCircle, X, Upload, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { v4 as uuidv4 } from 'uuid';
import { uploadTicketImage, moveTicketImages } from "@/services/storage";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Please provide a more detailed description"),
  category: z.enum(["hardware", "software", "network", "email", "access", "mobile", "security", "other"]),
});

const NewTicket = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { mutate: createTicket, isPending, isError, error } = useCreateTicket();
  const { user } = useAuth();
  const [showDiagnosticHelp, setShowDiagnosticHelp] = useState(false);
  
  // Estados para la gestión de imágenes
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [tempId] = useState(`temp-${uuidv4()}`); // ID temporal para subir imágenes
  
  // Ejecutamos el diagnóstico cuando se monta el componente
  useEffect(() => {
    // Exponemos las funciones al objeto window
    if (typeof window !== 'undefined') {
      (window as any).tryCreateTicket = tryCreateTicket;
      (window as any).checkTicketsSchema = checkTicketsSchema;
    }

  }, []);
    const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "hardware",
    },
  });

  // Manejador para seleccionar imágenes
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      
      // Verificar el tamaño máximo (2MB por archivo)
      const validFiles = filesArray.filter(file => {
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`El archivo ${file.name} excede el tamaño máximo permitido (2MB)`);
          return false;
        }
        return true;
      });
      
      setSelectedImages(prev => [...prev, ...validFiles]);
    }
  };

  // Manejador para eliminar una imagen
  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Subir imágenes a Supabase Storage
  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];
    
    setIsUploadingImages(true);
    
    try {
      const uploadPromises = selectedImages.map(file => 
        uploadTicketImage(file, tempId)
      );
      
      const urls = await Promise.all(uploadPromises);
      setImageUrls(urls);
      return urls;
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Error al subir las imágenes. Intente nuevamente.");
      return [];
    } finally {
      setIsUploadingImages(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("You need to be logged in to create a ticket");
      return;
    }
    
    try {
      // Primero subimos las imágenes
      const uploadedImageUrls = await uploadImages();
      
      // Luego creamos el ticket con las URLs de las imágenes
      createTicket({
        ...values,
        userId: user.id,
        status: "open",
        priority: "toassign", // Por defecto, será asignado por un administrador
        imageUrls: uploadedImageUrls
      }, {
        onSuccess: (ticket) => {
          toast.success("Ticket created successfully!");
          navigate("/tickets");
        },
        onError: (error) => {
          console.error("Error creating ticket:", error);
          toast.error("Failed to create ticket. Please try again.");
          setShowDiagnosticHelp(true);
        }
      });
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("An error occurred while submitting the form");
    }
  };
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t('createTicket')}</h1>
      
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
                        </FormControl>                        <SelectContent>
                          <SelectItem value="hardware">{t('category_hardware')}</SelectItem>
                          <SelectItem value="software">{t('category_software')}</SelectItem>
                          <SelectItem value="network">{t('category_network')}</SelectItem>
                          <SelectItem value="email">{t('category_email')}</SelectItem>
                          <SelectItem value="access">{t('category_access')}</SelectItem>
                          <SelectItem value="mobile">{t('category_mobile')}</SelectItem>
                          <SelectItem value="security">{t('category_security')}</SelectItem>
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
              
              {/* Campo para subir imágenes */}
              <div className="space-y-3">
                <div className="flex flex-col">
                  <FormLabel htmlFor="image-upload">{t('attachImages')}</FormLabel>
                  <FormDescription>
                    {t('uploadImagesDesc')}
                  </FormDescription>
                  
                  <div className="mt-2">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          {t('clickToUpload')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF {t('upTo')} 2MB
                        </p>
                      </div>
                      <Input 
                        id="image-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        multiple 
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                </div>
                
                {/* Vista previa de las imágenes seleccionadas */}
                {selectedImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">{t('selectedImages')} ({selectedImages.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-md overflow-hidden border border-gray-200">
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`Preview ${index}`} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-90 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <p className="text-xs mt-1 truncate">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/tickets')}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isPending || isUploadingImages}
                >
                  {isPending || isUploadingImages ? t('submitting') : t('submit')}
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
