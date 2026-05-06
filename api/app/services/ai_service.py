import json
import mimetypes
import os
from typing import Optional
import httpx
from app.core.config import settings
from app.models.logbook import DangerLevel, LifeFormCategory
from app.core.config import UPLOAD_DIR

class AIClassificationResult:
    def __init__(
        self,
        classification: LifeFormCategory,
        danger_level: DangerLevel,
        confidence: float,
        raw_response: str,
    ):
        self.classification = classification
        self.danger_level = danger_level
        self.confidence = confidence
        self.raw_response = raw_response


def limpiar_json(text: str) -> str:
    return text.strip().replace("```json", "").replace("```", "")


async def classify_life_form(
    photo_url: str, description: str
) -> Optional[AIClassificationResult]:

    if not settings.ai_api_key:
        return AIClassificationResult(
            classification=LifeFormCategory.UNKNOWN_ORGANISM,
            danger_level=DangerLevel.UNKNOWN,
            confidence=0.0,
            raw_response="{}",
        )

    # Resolver archivo local igual que endpoint
    nombre_archivo = photo_url.split("/")[-1]
    ruta_archivo = os.path.join(UPLOAD_DIR, nombre_archivo)

    if not os.path.exists(ruta_archivo):
        print("Imagen no encontrada localmente")
        return None

    prompt = f"""
    Actúa como un xenobiólogo experto. Analiza este descubrimiento de forma de vida.

    Descripción: {description}

    Tareas:
    1. Genera una descripción corta (1-2 oraciones).
    2. Clasifícalo como: ANIMAL, PLANT, RESOURCE, MINERAL, FUNGI, UNKNOWN_ORGANISM
    3. Nivel de peligro: DANGEROUS o FRIENDLY
    4. Confianza de 0.0 a 1.0

    IMPORTANTE:
    - "classification" y "danger_level" en inglés exacto
    - Responde SOLO JSON

    {{
      "description": "...",
      "classification": "...",
      "danger_level": "...",
      "confidence": 0.0,
      "reasoning": "..."
    }}
    """

    try:
        mime_type, _ = mimetypes.guess_type(ruta_archivo)

        with open(ruta_archivo, "rb") as f:
            image_bytes = f.read()

        async with httpx.AsyncClient(timeout=30) as client:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={settings.ai_api_key}"

            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type or "image/jpeg",
                                    "data": image_bytes.hex(),  # <- importante
                                }
                            },
                        ]
                    }
                ]
            }

            res = await client.post(url, json=payload)
            res.raise_for_status()

            data = res.json()

            text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned = limpiar_json(text)

            parsed = json.loads(cleaned)

            return AIClassificationResult(
                classification=LifeFormCategory(
                    parsed.get("classification", "UNKNOWN_ORGANISM")
                ),
                danger_level=DangerLevel(
                    parsed.get("danger_level", "UNKNOWN")
                ),
                confidence=float(parsed.get("confidence", 0.0)),
                raw_response=cleaned,
            )

    except Exception as e:
        print(f"Error Gemini: {e}")
        return None
    

async def find_matching_entry(photo_url: str, entries: list) -> Optional[str]:
    return None