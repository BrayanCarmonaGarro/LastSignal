import json
from typing import Optional
import httpx
from app.core.config import settings
from app.models.logbook import DangerLevel, LifeFormCategory

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

async def classify_life_form(
    photo_url: str, description: str
) -> Optional[AIClassificationResult]:
    """
    Clasifica una forma de vida usando Gemini a partir de una foto y descripción.
    Retorna None si la clasificación falla.
    """
    if not settings.ai_api_key:
        return AIClassificationResult(
            classification=LifeFormCategory.UNKNOWN_ORGANISM,
            danger_level=DangerLevel.UNKNOWN,
            confidence=0.0,
            raw_response="{}",
        )

    prompt = f"""
    Analyze this life form discovery on an unknown planet.
    Description: {description}
    Photo URL: {photo_url}

    Classify it as one of: ANIMAL, PLANT, RESOURCE, MINERAL, FUNGI, UNKNOWN_ORGANISM
    Determine danger level: DANGEROUS, FRIENDLY, UNKNOWN
    Provide confidence from 0.0 to 1.0

    Respond ONLY in JSON with this exact structure:
    {{"classification": "...", "danger_level": "...", "confidence": 0.0, "reasoning": "..."}}
    """

    try:
        async with httpx.AsyncClient() as client:
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={settings.ai_api_key}"
            
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }

            response = await client.post(
                gemini_url,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Extraer el texto de la respuesta de Gemini
            result = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(result)
            
            return AIClassificationResult(
                classification=LifeFormCategory(
                    parsed.get("classification", "UNKNOWN_ORGANISM")
                ),
                danger_level=DangerLevel(parsed.get("danger_level", "UNKNOWN")),
                confidence=float(parsed.get("confidence", 0.0)),
                raw_response=result,
            )
    except Exception as e:
        print(f"Error en clasificación Gemini: {e}")
        return None

async def find_matching_entry(photo_url: str, entries: list) -> Optional[str]:
    return None