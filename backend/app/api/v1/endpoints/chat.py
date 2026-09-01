import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.agent import run_agent
from app.db.models import ChatMessage
from app.db.session import get_db

router = APIRouter(tags=["chat"])

HISTORY_LIMIT = 20


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, db: AsyncSession = Depends(get_db)) -> ChatResponse:
    session_id = req.session_id or uuid.uuid4().hex

    rows = (
        await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.id.desc())
            .limit(HISTORY_LIMIT)
        )
    ).scalars().all()
    history = [(m.role, m.content) for m in reversed(rows)]

    reply = await run_agent(req.message, history)

    db.add_all(
        [
            ChatMessage(session_id=session_id, role="user", content=req.message),
            ChatMessage(session_id=session_id, role="assistant", content=reply),
        ]
    )
    await db.commit()
    return ChatResponse(session_id=session_id, reply=reply)
