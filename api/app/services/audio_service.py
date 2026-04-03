# Narración TTS
from typing import Optional
import httpx
from app.core.config import settings


async def generate_audio_description(text: str, entry_id: str) -> Optional[str]:
    """
    Genera un archivo de audio TTS para la descripción de una entrada de bitácora.
    Retorna la URL del audio generado o None si falla.
    """
    if not settings.ai_api_key:
        return None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={"Authorization": f"Bearer {settings.ai_api_key}"},
                json={
                    "model": "tts-1",
                    "input": text,
                    "voice": "nova",
                },
                timeout=30,
            )
            if response.status_code == 200:
                # Aquí se guardaría el archivo de audio en un bucket (S3, GCS, etc.)
                # Por ahora retorna None hasta configurar el almacenamiento
                return None
    except Exception:
        return None

    return None