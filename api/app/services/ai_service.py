# Clasificación de imágenes
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
    Clasifica una forma de vida usando IA a partir de una foto y descripción.
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

    Respond ONLY in JSON:
    {{"classification": "...", "danger_level": "...", "confidence": 0.0, "reasoning": "..."}}
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.ai_api_key}"},
                json={
                    "model": "gpt-4o",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                },
                timeout=30,
            )
            data = response.json()
            result = data["choices"][0]["message"]["content"]
            parsed = json.loads(result)
            return AIClassificationResult(
                classification=LifeFormCategory(
                    parsed.get("classification", "UNKNOWN_ORGANISM")
                ),
                danger_level=DangerLevel(parsed.get("danger_level", "UNKNOWN")),
                confidence=float(parsed.get("confidence", 0.0)),
                raw_response=result,
            )
    except Exception:
        return None


async def find_matching_entry(photo_url: str, entries: list) -> Optional[str]:
    """
    Compara una foto con las entradas de la bitácora y retorna el ID de la más similar.
    Retorna None si no hay coincidencia.
    Por ahora es un placeholder — se puede implementar con embeddings de imágenes.
    """
    return None