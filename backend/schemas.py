from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth schemas
class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Chat schemas
class ChatCreate(BaseModel):
    title: Optional[str] = "New Consultation"


class ChatResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    is_report_generated: bool
    legal_domain: Optional[str]

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    chat_id: int
    role: str
    content: str
    created_at: datetime
    message_type: str

    class Config:
        from_attributes = True


class ChatWithMessages(BaseModel):
    chat: ChatResponse
    messages: List[MessageResponse]


class AIResponse(BaseModel):
    message: str
    message_type: str
    legal_domain: Optional[str] = None
    precedents: Optional[List[dict]] = None
