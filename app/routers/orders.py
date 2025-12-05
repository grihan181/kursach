import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth import AuthError, get_current_user
from ..config import settings
from ..db import get_session
from ..kafka_bus import kafka_bus
from ..models import OrderStatus
from ..schemas import OrderCreate, OrderRead, OrderUpdate, StatusChange, TokenData
from ..service import change_status, create_order, delete_order, get_order, list_orders, update_order

router = APIRouter(prefix="/orders", tags=["orders"])
logger = logging.getLogger(__name__)


async def _emit_order_created(order: OrderRead):
    await kafka_bus.send(
        topic=settings.kafka_order_created_topic,
        event={"id": order.id, "user_id": order.user_id, "status": order.status, "total": str(order.total_amount)},
    )


async def _emit_order_status(order: OrderRead):
    await kafka_bus.send(
        topic=settings.kafka_order_status_topic,
        event={"id": order.id, "status": order.status, "user_id": order.user_id},
    )


def _ensure_access(user: TokenData, owner_id: str):
    if user.role != "admin" and user.user_id != owner_id:
        raise AuthError("Access denied")


@router.post("/", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create(payload: OrderCreate, user: TokenData = Depends(get_current_user), db: Session = Depends(get_session)):
    order = create_order(db, user.user_id, payload)
    data = OrderRead.model_validate(order)
    asyncio.create_task(_emit_order_created(data))
    return data


@router.get("/", response_model=list[OrderRead])
async def fetch_all(user: TokenData = Depends(get_current_user), db: Session = Depends(get_session)):
    user_filter = None if user.role == "admin" else user.user_id
    orders = list_orders(db, user_filter)
    return [OrderRead.model_validate(o) for o in orders]


@router.get("/{order_id}", response_model=OrderRead)
async def fetch_one(order_id: int, user: TokenData = Depends(get_current_user), db: Session = Depends(get_session)):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    _ensure_access(user, order.user_id)
    return OrderRead.model_validate(order)


@router.put("/{order_id}", response_model=OrderRead)
async def update(order_id: int, payload: OrderUpdate, user: TokenData = Depends(get_current_user), db: Session = Depends(get_session)):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    _ensure_access(user, order.user_id)
    updated = update_order(db, order, payload)
    return OrderRead.model_validate(updated)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(order_id: int, user: TokenData = Depends(get_current_user), db: Session = Depends(get_session)):
    order = get_order(db, order_id)
    if not order:
        return
    _ensure_access(user, order.user_id)
    delete_order(db, order)


@router.post("/{order_id}/status", response_model=OrderRead)
async def set_status(order_id: int, payload: StatusChange, user: TokenData = Depends(get_current_user), db: Session = Depends(get_session)):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    _ensure_access(user, order.user_id)
    updated = change_status(db, order, payload.status)
    data = OrderRead.model_validate(updated)
    asyncio.create_task(_emit_order_status(data))
    return data


async def apply_status_update(event: dict, db: Session):
    order_id = event.get("id")
    status_name = event.get("status")
    if not order_id or not status_name:
        return
    status_value = OrderStatus(status_name)
    order = get_order(db, order_id)
    if not order:
        return
    change_status(db, order, status_value)


async def background_consumer():
    async def handler(event: dict):
        with get_session() as db:
            await apply_status_update(event, db)
    await kafka_bus.consume_status_updates(handler)


@router.on_event("startup")
async def startup():
    await kafka_bus.start()
    asyncio.create_task(background_consumer())


@router.on_event("shutdown")
async def shutdown():
    await kafka_bus.stop()
