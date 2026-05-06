from typing import List
from uuid import UUID
from app.services.rag_service import get_similar_entries, index_new_entry
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, resolve_db_user
from app.models.logbook import LogbookEntry, LifeFormSearch
from app.schemas.logbook import (
    LogbookEntryCreate,
    LogbookEntryResponse,
    LogbookEntryUpdate,
    LifeFormSearchResponse,
)
from app.services.ai_service import classify_life_form, find_matching_entry
from app.services.achievement_service import check_and_award_achievements

router = APIRouter(prefix="/logbook", tags=["Bitácora"])


@router.get("", response_model=List[LogbookEntryResponse])
async def list_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    return (
        db.query(LogbookEntry)
        .filter(LogbookEntry.user_id == user.id)
        .order_by(LogbookEntry.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=LogbookEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    entry: LogbookEntryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)

    ai_result = await classify_life_form(entry.photo_url, entry.description)

    similar_records = get_similar_entries(entry.description)

    db_entry = LogbookEntry(
        photo_url=entry.photo_url,
        description=entry.description,
        classification=ai_result.classification if ai_result else entry.classification,
        danger_level=ai_result.danger_level if ai_result else entry.danger_level,
        ai_confidence=ai_result.confidence if ai_result else None,
        ai_raw_response=ai_result.raw_response if ai_result else None,
        user_id=user.id,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    index_new_entry(
        text=db_entry.description, 
        metadata={"id": str(db_entry.id), "user_id": str(user.id)}
    )

    check_and_award_achievements(str(user.id), db)

    response_data = db_entry.__dict__
    response_data["similar_findings"] = similar_records

    return response_data


@router.get("/{entry_id}", response_model=LogbookEntryResponse)
async def get_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    entry = (
        db.query(LogbookEntry)
        .filter(LogbookEntry.id == entry_id, LogbookEntry.user_id == user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    return entry


@router.patch("/{entry_id}", response_model=LogbookEntryResponse)
async def update_entry(
    entry_id: UUID,
    data: LogbookEntryUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    entry = (
        db.query(LogbookEntry)
        .filter(LogbookEntry.id == entry_id, LogbookEntry.user_id == user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    entry = (
        db.query(LogbookEntry)
        .filter(LogbookEntry.id == entry_id, LogbookEntry.user_id == user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    db.delete(entry)
    db.commit()


@router.post("/search", response_model=LifeFormSearchResponse)
async def search_life_form(
    photo_url: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    entries = db.query(LogbookEntry).filter(LogbookEntry.user_id == user.id).all()
    matched_id = await find_matching_entry(photo_url, entries)

    search = LifeFormSearch(
        photo_url=photo_url,
        matched_entry_id=matched_id,
        user_id=user.id,
    )
    db.add(search)
    db.commit()
    db.refresh(search)
    return search


@router.post("/{entry_id}/audio")
async def generate_audio(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await resolve_db_user(current_user, db)
    entry = (
        db.query(LogbookEntry)
        .filter(LogbookEntry.id == entry_id, LogbookEntry.user_id == user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")

    from app.services.audio_service import generate_audio_description
    audio_url = await generate_audio_description(entry.description, str(entry_id))

    if audio_url:
        entry.audio_url = audio_url
        db.commit()
        db.refresh(entry)

    return {"audio_url": entry.audio_url}