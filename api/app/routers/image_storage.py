# app/routers/inventory.py
import os
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from fastapi.responses import FileResponse
import base64
import uuid

router = APIRouter(prefix="/storage", tags=["Dashboard"])


# Directorio donde se guardarán las imágenes
UPLOAD_DIR = "imagenes_guardadas"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Modelo Pydantic para recibir los datos en el body de la petición
class ImagenBase64(BaseModel):
    nombre_archivo: str  # Ejemplo: "mi_foto.jpg"
    base64_str: str      # La cadena base64 de la imagen

@router.post("/subir-imagen/")
async def subir_imagen(imagen: ImagenBase64):
    """
    Recibe una imagen en base64, la decodifica y la guarda en el servidor.
    """
    try:
        # Si el string base64 incluye el encabezado (ej. "data:image/jpeg;base64,..."), lo limpiamos
        cadena_limpia = imagen.base64_str
        if "," in cadena_limpia:
            cadena_limpia = cadena_limpia.split(",")[1]

        # Decodificamos el string base64 a bytes
        image_bytes =   base64.b64decode(cadena_limpia)

        # Generamos un nombre único para evitar sobreescribir archivos (opcional pero recomendado)
        extension = imagen.nombre_archivo.split(".")[-1] if "." in imagen.nombre_archivo else "png"
        nombre_unico = f"{uuid.uuid4()}.{extension}"
        
        # Ruta final donde se guardará
        ruta_archivo = os.path.join(UPLOAD_DIR, nombre_unico)

        # Guardamos los bytes en un archivo físico
        with open(ruta_archivo, "wb") as f:
            f.write(image_bytes)

        return {
            "mensaje": "Imagen guardada exitosamente",
            "nombre_archivo_guardado": nombre_unico,
            "url_acceso": f"/imagen/{nombre_unico}"
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar la imagen: {str(e)}")

@router.get("/imagen/{nombre_archivo}")
async def obtener_imagen(nombre_archivo: str):
    """
    Retorna la imagen almacenada para que pueda ser renderizada en el navegador o cliente.
    """
    ruta_archivo = os.path.join(UPLOAD_DIR, nombre_archivo)
    
    # Verificamos si la imagen existe
    if not os.path.exists(ruta_archivo):
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    
    # FileResponse envía el archivo con los headers correctos para que se renderice como imagen
    return FileResponse(ruta_archivo)