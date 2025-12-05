from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import Order, OrderItem, OrderStatus
from .schemas import OrderCreate, OrderUpdate


def _calculate_total(items: List[OrderItem]) -> Decimal:
    return sum((item.price * item.quantity for item in items), Decimal("0"))


def create_order(db: Session, user_id: str, payload: OrderCreate) -> Order:
    items = [
        OrderItem(
            product_id=item.product_id,
            quantity=item.quantity,
            price=item.price,
            comment=item.comment,
        )
        for item in payload.items
    ]
    total = _calculate_total(items)
    order = Order(user_id=user_id, items=items, total_amount=total)
    db.add(order)
    db.flush()
    db.refresh(order)
    return order


def list_orders(db: Session, user_id: Optional[str] = None) -> List[Order]:
    stmt = select(Order)
    if user_id:
        stmt = stmt.where(Order.user_id == user_id)
    return list(db.scalars(stmt))


def get_order(db: Session, order_id: int) -> Optional[Order]:
    return db.get(Order, order_id)


def update_order(db: Session, order: Order, payload: OrderUpdate) -> Order:
    if payload.items is not None:
        order.items.clear()
        for item in payload.items:
            order.items.append(
                OrderItem(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    price=item.price,
                    comment=item.comment,
                )
            )
        order.total_amount = _calculate_total(order.items)
    db.add(order)
    db.flush()
    db.refresh(order)
    return order


def change_status(db: Session, order: Order, status: OrderStatus) -> Order:
    order.status = status
    db.add(order)
    db.flush()
    db.refresh(order)
    return order


def delete_order(db: Session, order: Order) -> None:
    db.delete(order)
    db.flush()
