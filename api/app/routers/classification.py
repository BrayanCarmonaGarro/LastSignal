from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
from google import genai
from google.genai import types
import mimetypes
from core.config import settings

router = APIRouter(prefix="/classification", tags=["AI Classificator"])

class AIAnalyzeRequest(BaseModel):
    photo_url: str

UPLOAD_DIR = "imagenes_guardadas"

client = genai.Client(api_key=settings.ai_api_key)

def limpiar_json(texto: str) -> str:
    texto = texto.strip()

    if texto.startswith("```"):
        # Quita ```json o ```
        texto = texto.split("```")[1]
        texto = texto.replace("json", "", 1).strip()

    return texto

@router.post("/")
async def endpoint_analizar_forma_vida(req: AIAnalyzeRequest):
    nombre_archivo = req.photo_url.split("/")[-1]
    ruta_archivo = os.path.join(UPLOAD_DIR, nombre_archivo)

    if not os.path.exists(ruta_archivo):
        raise HTTPException(status_code=404, detail="La imagen no existe en el servidor local.")

    try:
        prompt = """
        Act as an expert xenobiologist. Analyze this life form discovery on an unknown planet.
        Tasks:
        1. Generate a short, creative description (1-2 sentences).
        2. Classify it as one of: ANIMAL, PLANT, RESOURCE, MINERAL, FUNGI, UNKNOWN_ORGANISM
        3. Determine danger level: DANGEROUS, FRIENDLY, UNKNOWN
        4. Provide confidence from 0.0 to 1.0

        Respond ONLY with this exact JSON structure:
        {"description": "...", "classification": "...", "danger_level": "...", "confidence": 0.0, "reasoning": "..."}
        """

        # 🔍 Detectar mime
        mime_type, _ = mimetypes.guess_type(ruta_archivo)
        if mime_type is None:
            mime_type = "image/jpeg"

        # 📂 Leer archivo
        with open(ruta_archivo, "rb") as f:
            image_bytes = f.read()

        # ✅ Envío correcto
        result = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type
                )
            ],
        )

        try:
            return json.loads(limpiar_json(result.text))
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500,
                detail=f"Respuesta no válida: {result.text}"
            )

    except Exception as e:
        print(f"Error detallado: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al procesar la IA.")