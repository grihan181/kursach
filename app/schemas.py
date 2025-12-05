from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from .models import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(ge=1)
    price: Decimal = Field(gt=0)
    comment: Optional[str] = None


class OrderItemRead(OrderItemCreate):
    id: int

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]


class OrderUpdate(BaseModel):
    items: Optional[List[OrderItemCreate]] = None


class OrderRead(BaseModel):
    id: int
    user_id: str
    status: OrderStatus
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemRead]

    class Config:
        from_attributes = True


class StatusChange(BaseModel):
    status: OrderStatus


class TokenData(BaseModel):
    user_id: str
    role: str
