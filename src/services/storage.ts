import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

// Nombre del bucket de Supabase Storage
const BUCKET_NAME = 'ticket-images';

/**
 * Sube una imagen al Storage de Supabase
 * @param file Archivo a subir
 * @param ticketId ID del ticket al que pertenece la imagen
 * @returns URL de la imagen subida
 */
export const uploadTicketImage = async (file: File, ticketId?: string): Promise<string> => {
  try {
    // Validar el archivo
    if (!file || !(file instanceof File)) {
      throw new Error("Invalid file provided");
    }
    
    // Validar que el archivo sea una imagen
    if (!file.type.startsWith('image/')) {
      throw new Error("File must be an image");
    }
    
    // Validar tamaño máximo (2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("File size exceeds the 2MB limit");
    }
    
    // Si no tenemos un ticketId (porque el ticket aún no existe), creamos un UUID temporal
    // Este se usará solo para la carga inicial, luego se moverá a la carpeta correcta
    const tempId = ticketId || 'temp-' + uuidv4();
    
    // Definimos un nombre de archivo único
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = ticketId 
      ? `tickets/${ticketId}/${fileName}`
      : `temp/${tempId}/${fileName}`;
    
    // Subimos el archivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
    
    // Obtenemos la URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Failed to upload image:", error);
    throw new Error("Failed to upload image");
  }
};

/**
 * Mueve imágenes temporales a la carpeta definitiva del ticket
 * @param tempId ID temporal usado para subir las imágenes
 * @param ticketId ID real del ticket generado por la base de datos
 * @param imageUrls URLs de las imágenes que se subieron
 * @returns URLs actualizadas tras mover las imágenes
 */
export const moveTicketImages = async (
  tempId: string,
  ticketId: string,
  imageUrls: string[]
): Promise<string[]> => {
  // Solo proceder si hay imágenes que mover
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  try {
    const updatedUrls: string[] = [];
    
    // Para cada URL de imagen
    for (const url of imageUrls) {
      // Extraer el nombre del archivo de la URL
      const fileName = url.split('/').pop();
      
      if (!fileName) continue;
      
      // Definir las rutas de origen y destino
      const sourceFilePath = `temp/${tempId}/${fileName}`;
      const destFilePath = `tickets/${ticketId}/${fileName}`;
      
      // Copiar el archivo a la nueva ubicación
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .copy(sourceFilePath, destFilePath);
      
      if (error) {
        console.error("Error moving image:", error);
        continue;
      }
      
      // Eliminar el archivo temporal
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([sourceFilePath]);
      
      // Obtener la nueva URL pública
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(destFilePath);
      
      updatedUrls.push(urlData.publicUrl);
    }
    
    return updatedUrls;
  } catch (error) {
    console.error("Failed to move images:", error);
    return imageUrls; // Devolver las URLs originales si algo falla
  }
};

/**
 * Elimina imágenes de un ticket del storage
 * @param ticketId ID del ticket
 * @returns true si se completó la operación correctamente
 */
export const deleteTicketImages = async (ticketId: string): Promise<boolean> => {
  try {
    // Lista todos los archivos en la carpeta del ticket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`tickets/${ticketId}`);
    
    if (error) {
      console.error("Error listing images to delete:", error);
      return false;
    }
    
    if (!data || data.length === 0) {
      // No hay imágenes que eliminar
      return true;
    }
    
    // Construye un array con las rutas completas de los archivos
    const filesToDelete = data.map(file => `tickets/${ticketId}/${file.name}`);
    
    // Elimina los archivos
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filesToDelete);
    
    if (deleteError) {
      console.error("Error deleting images:", deleteError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to delete ticket images:", error);
    return false;
  }
};
