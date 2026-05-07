from fastapi import APIRouter, HTTPException, Depends, Response, Query, status
from pydantic import BaseModel
from typing import List, Any
import os
import io
import wave
import json
import mimetypes
from typing import List
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.logbook import LogbookEntry
from app.schemas.logbook import LogbookEntryResponse
from app.services.rag_service import (
    index_new_entry, 
    CONNECTION_STRING, 
    embeddings
)
from langchain_community.vectorstores import PGVector

router = APIRouter(prefix="/classification", tags=["AI Classificator"])

class AIAnalyzeRequest(BaseModel):
    photo_url: str

class AudioRequest(BaseModel):
    text: str

class SearchRequest(BaseModel):
    query: str
UPLOAD_DIR = "imagenes_guardadas"
client = genai.Client(api_key=settings.ai_api_key)

def limpiar_json(texto: str) -> str:
    texto = texto.strip()
    if texto.startswith("```"):
        texto = texto.split("```")[1]
        texto = texto.replace("json", "", 1).strip()
    return texto


@router.post("/classify", status_code=status.HTTP_200_OK)
async def endpoint_analizar_forma_vida(req: AIAnalyzeRequest):
    nombre_archivo = req.photo_url.split("/")[-1]
    ruta_archivo = os.path.join(UPLOAD_DIR, nombre_archivo)

    if not os.path.exists(ruta_archivo):
        raise HTTPException(status_code=404, detail="La imagen no existe en el servidor local.")

    try:
        prompt = """
        Actúa como un xenobiólogo experto. Analiza este descubrimiento de forma de vida en un planeta desconocido.
        Tareas:
        1. Genera una descripción corta y creativa (1-2 oraciones).
        2. Clasifícalo como uno de: ANIMAL, PLANT, RESOURCE, MINERAL, FUNGI, UNKNOWN_ORGANISM
        3. Determina el nivel de peligro: DANGEROUS, FRIENDLY, UNKNOWN basado en la especie y características.
        4. Proporciona una confianza del 0.0 al 1.0

        IMPORTANTE: Los campos "description" y "reasoning" deben estar escritos en español.
        Los campos "classification" y "danger_level" deben usar exactamente los valores en inglés indicados arriba.

        Responde ÚNICAMENTE con esta estructura JSON exacta:
        {"description": "...", "classification": "...", "danger_level": "...", "confidence": 0.0, "reasoning": "..."}
        """

        mime_type, _ = mimetypes.guess_type(ruta_archivo)
        with open(ruta_archivo, "rb") as f:
            image_bytes = f.read()

        result = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type or "image/jpeg")
            ],
        )

        print(limpiar_json(result.text))
        try:
            return json.loads(limpiar_json(result.text))
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Respuesta de IA no válida.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-audio")
async def endpoint_generar_audio(req: AudioRequest):
    if not req.text:
        raise HTTPException(status_code=400, detail="El texto está vacío.")

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=req.text,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"], 
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Fenrir" 
                        )
                    )
                ),
            ),
        )

        audio_bytes = response.candidates[0].content.parts[0].inline_data.data
        print(f"Audio generado, tamaño: {len(audio_bytes)} bytes")

        with io.BytesIO() as wav_file:
            with wave.open(wav_file, "wb") as wf:
                wf.setnchannels(1)         
                wf.setsampwidth(2)          
                wf.setframerate(24000)    
                wf.writeframes(audio_bytes)
            
            wav_data = wav_file.getvalue()

        return Response(
            content=wav_data, 
            media_type="audio/wav"
        )

    except Exception as e:
        print(f"Error TTS Gemini 3.1: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=List[LogbookEntryResponse])
async def search_entries_rag(
    req: SearchRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Busca coincidencias semánticas y retorna los objetos reales de la DB.
    """
    user = await resolve_db_user(current_user, db)

    try:
        vector_store = PGVector(
            connection_string=CONNECTION_STRING,
            embedding_function=embeddings,
            collection_name="logbook_embeddings",
            distance_strategy="cosine"
        )

        docs = vector_store.similarity_search(req.query, k=5)
        
        entry_ids = [doc.metadata.get("entry_id") for doc in docs if doc.metadata.get("entry_id")]

        if not entry_ids:
            return []

        entries = (
            db.query(LogbookEntry)
            .filter(LogbookEntry.id.in_(entry_ids))
            .filter(LogbookEntry.user_id == user.id)
            .all()
        )

        results_map = {str(e.id): e for e in entries}
        ordered_results = [results_map[str(eid)] for eid in entry_ids if str(eid) in results_map]

        return ordered_results

    except Exception as e:
        print(f"RAG Error: {e}")
        raise HTTPException(status_code=500, detail="Error en la búsqueda semántica.")

@router.post("/seed-vectors", status_code=200)
async def run_vector_seed(db: Session = Depends(get_db)):
    """Ejecuta el proceso de indexación masiva."""
    try:
        count = seed_vector_db(db)
        return {"message": f"Sincronización completada. {count} registros indexados."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def seed_vector_db(db: Session):
    print("🚀 Iniciando Seed...")
    entries = db.query(LogbookEntry).all()
    
    count = 0
    for entry in entries:
        text_to_index = entry.description or "Sin descripción"
        metadata = {
            "entry_id": str(entry.id),
            "classification": entry.classification,
            "user_id": str(entry.user_id)
        }
        
        try:
            index_new_entry(text=text_to_index, metadata=metadata)
            count += 1
        except Exception as e:
            print(f"❌ Error en ID {entry.id}: {e}")
            continue
            
    return count