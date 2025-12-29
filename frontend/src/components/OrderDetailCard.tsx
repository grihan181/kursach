'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { OrderDetail, OrderStage, OrderStatus } from '@/types';
import { COUNTRY_OPTIONS } from '@/constants/countries';
import { STAGE_TEMPLATES } from '@/constants/stages';
import { WAREHOUSE_LOCATION_OPTIONS } from '@/constants/warehouseLocations';
import { createOrderStage, fetchOrderDetail, updateOrder, updateOrderStatus } from '@/services/orders';
import { paymentsBaseUrl } from '@/config';

const statuses: OrderStatus[] = ['created', 'paid', 'shipping', 'delivered', 'cancelled'];
const statusLabels: Record<OrderStatus, string> = {
  created: 'Создан',
  paid: 'Оплачен',
  shipping: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён'
};

const LIMITS = {
  weight: { min: 0.1, max: 500 },
  dimension: { min: 1, max: 300 }
} as const;

interface Props {
  id: string;
}

interface EditFormState {
  origin: string;
  destination: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

const defaultFormState: EditFormState = {
  origin: 'US',
  destination: 'RU',
  weightKg: 1,
  lengthCm: 10,
  widthCm: 10,
  heightCm: 10
};

export default function OrderDetailCard({ id }: Props) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(defaultFormState);
  const canEditForm = order?.permissions.canEdit && order?.status === 'created';
  const [stageForm, setStageForm] = useState<{ title: string; location: string; note: string }>({
    title: STAGE_TEMPLATES[0] ?? '',
    location: '',
    note: ''
  });
  const [stagePending, setStagePending] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchOrderDetail(id);
        setOrder(data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!order) return;
    setEditForm({
      origin: order.originCountry ?? defaultFormState.origin,
      destination: order.destinationCountry ?? defaultFormState.destination,
      weightKg: order.weightKg ?? defaultFormState.weightKg,
      lengthCm: order.lengthCm ?? defaultFormState.lengthCm,
      widthCm: order.widthCm ?? defaultFormState.widthCm,
      heightCm: order.heightCm ?? defaultFormState.heightCm
    });
  }, [order]);

  const onChangeStatus = async (status: OrderStatus) => {
    if (!order?.permissions.canChangeStatus) return;
    setPendingStatus(true);
    setStatusError(null);
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrder(updated);
    } catch (err) {
      setStatusError((err as Error).message);
    } finally {
      setPendingStatus(false);
    }
  };

  const handleAddStage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order?.permissions.canChangeStatus) return;
    if (!stageForm.title.trim()) {
      setStageError('Название этапа обязательно');
      return;
    }
    setStagePending(true);
    setStageError(null);
    try {
      await createOrderStage(order.id, {
        title: stageForm.title.trim(),
        location: stageForm.location.trim() || undefined,
        note: stageForm.note.trim() || undefined
      });
      const updated = await fetchOrderDetail(order.id);
      setOrder(updated);
      setStageForm({ title: STAGE_TEMPLATES[0] ?? '', location: '', note: '' });
    } catch (err) {
      setStageError((err as Error).message);
    } finally {
      setStagePending(false);
    }
  };

  const handleUpdateOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order?.permissions.canEdit || order.status !== 'created') {
      setFormError('Редактирование доступно только до оплаты');
      return;
    }
    const sameCountry = editForm.origin === editForm.destination;
    if (sameCountry) {
      setFormError('Выберите разные страны маршрута');
      return;
    }
    setPendingUpdate(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const updated = await updateOrder(order.id, {
        direction: { origin: editForm.origin, destination: editForm.destination },
        pricing: {
          origin: editForm.origin,
          destination: editForm.destination,
          weightKg: editForm.weightKg,
          lengthCm: editForm.lengthCm,
          widthCm: editForm.widthCm,
          heightCm: editForm.heightCm,
          currency: order.currency ?? 'USD'
        },
        items: order.items ?? []
      });
      setOrder(updated);
      setFormSuccess('Изменения сохранены');
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setPendingUpdate(false);
    }
  };

  const historyItems = useMemo(() => {
    if (!order?.history) return [];
    return [...order.history].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }, [order?.history]);

  const stageItems = useMemo(() => {
    if (!order?.stages) return [];
    return [...order.stages].sort((a, b) => new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime());
  }, [order?.stages]);
  const stageTemplateListId = 'stage-template-options';
  const stageLocationListId = 'stage-location-options';

  const resolveCountryName = (code?: string | null) =>
    COUNTRY_OPTIONS.find((c) => c.code === code)?.label ?? 'Не указано';

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const invalidDirection = editForm.origin === editForm.destination;

  if (!order) {
    return <div className="card">{error ?? 'Загрузка...'}</div>;
  }

  const paymentUrl = `${paymentsBaseUrl}/payments/${order.id}`;

  return (
    <section className="card" style={{ display: 'grid', gap: 20 }}>
      <header className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <p className={`status-chip status-${order.status}`} style={{ marginBottom: 8 }}>
            {statusLabels[order.status] ?? order.status}
          </p>
          <h2 style={{ margin: 0 }}>{order.title}</h2>
          <p style={{ marginTop: 4, color: 'var(--muted)' }}>{order.route ?? 'Маршрут не указан'}</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <Link className="button secondary" href={`/chat?orderId=${order.id}`}>
            Перейти в чат
          </Link>
          {order.status === 'created' && (
            <a className="button primary" href={paymentUrl} target="_blank" rel="noreferrer">
              Оплатить заказ
            </a>
          )}
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Номер</p>
          <strong style={{ fontFamily: 'monospace' }}>{order.reference}</strong>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
            Создан {new Date(order.createdAt).toLocaleString('ru-RU')}
          </p>
          <strong style={{ fontSize: 26 }}>
            {order.total.toFixed(2)} {order.currency ?? '₽'}
          </strong>
        </div>
      </header>

      <section className="grid" style={{ gap: 12 }}>
        <h3 style={{ margin: 0 }}>Статус заказа</h3>
        {order.permissions.canChangeStatus ? (
          <div className="flex" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="input"
              value={order.status}
              onChange={(e) => onChangeStatus(e.target.value as OrderStatus)}
              disabled={pendingStatus}
            >
              {statuses.map((status) => (
                <option value={status} key={status}>
                  {statusLabels[status] ?? status}
                </option>
              ))}
            </select>
            {pendingStatus && <span className="badge">Сохраняем...</span>}
          </div>
        ) : (
          <p style={{ margin: 0, color: 'var(--muted)' }}></p>
        )}
        {statusError && (
          <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>{statusError}</div>
        )}
        <div className="flex" style={{ gap: 6, flexWrap: 'wrap' }}>
          {statuses.map((status) => (
            <span
              key={status}
              className={`status-chip status-${status}`}
              style={{ opacity: status === order.status ? 1 : 0.4 }}
            >
              {statusLabels[status]}
            </span>
          ))}
        </div>
      </section>

      <section className="glass" style={{ display: 'grid', gap: 12 }}>
        <h3 style={{ margin: 0 }}>История обновлений</h3>
        {historyItems.length === 0 && <p style={{ margin: 0, color: 'var(--muted)' }}>Записей пока нет.</p>}
        {historyItems.map((entry) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: 6
            }}
          >
            <div style={{ fontWeight: 600 }}>{statusLabels[entry.status] ?? entry.status}</div>
            <div style={{ textAlign: 'right', color: 'var(--muted)', fontSize: 13 }}>
              {new Date(entry.changedAt).toLocaleString('ru-RU')}
            </div>
          </div>
        ))}
      </section>

      <section className="glass" style={{ display: 'grid', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Отслеживание</h3>
        {stageItems.length === 0 && <p style={{ margin: 0, color: 'var(--muted)' }}>Доставка еще не отправлена.</p>}
        {stageItems.map((stage) => {
          const locationLine = stage.warehouseName
            ? `${stage.warehouseName}${stage.location ? ` · ${stage.location}` : ''}`
            : stage.location;
          return (
            <div
              key={stage.id}
              style={{
                borderLeft: '2px solid var(--accent)',
                paddingLeft: 12,
                display: 'grid',
                gap: 4
              }}
            >
              <div style={{ fontWeight: 600 }}>{stage.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                {new Date(stage.happenedAt).toLocaleString('ru-RU')}
              </div>
              {locationLine && (
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Локация: {locationLine}
                </div>
              )}
              {stage.note && <div style={{ fontSize: 14 }}>{stage.note}</div>}
            </div>
          );
        })}
        {order?.permissions.canChangeStatus && (
          <form className="grid" style={{ gap: 8, marginTop: 4 }} onSubmit={handleAddStage}>
            <h4 style={{ margin: '8px 0 0' }}>Новый этап</h4>
            <label className="grid">
              Название
              <input
                className="input"
                list={stageTemplateListId}
                value={stageForm.title}
                onChange={(e) => setStageForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
              <datalist id={stageTemplateListId}>
                {STAGE_TEMPLATES.map((template) => (
                  <option key={template} value={template} />
                ))}
              </datalist>
              <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                Начните вводить и выберите подсказку или впишите свой вариант
              </small>
            </label>
            <label className="grid">
              Локация
              <input
                className="input"
                list={stageLocationListId}
                value={stageForm.location}
                onChange={(e) => setStageForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Например: Москва · Домодедово"
              />
              <datalist id={stageLocationListId}>
                {WAREHOUSE_LOCATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </datalist>
              <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                Подсказки доступны только администраторам и помогут быстро подставить правильный склад
              </small>
            </label>
            <label className="grid">
              Примечание
              <textarea
                className="input"
                value={stageForm.note}
                onChange={(e) => setStageForm((prev) => ({ ...prev, note: e.target.value }))}
                rows={2}
              />
            </label>
            {stageError && (
              <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>{stageError}</div>
            )}
            <button className="button secondary" type="submit" disabled={stagePending}>
              {stagePending ? 'Добавляем...' : 'Добавить этап'}
            </button>
          </form>
        )}
      </section>

      <section className="glass" style={{ display: 'grid', gap: 16 }}>
        <h3 style={{ margin: 0 }}>
          {canEditForm ? 'Данные отправления' : 'Параметры груза'}
        </h3>
        {canEditForm ? (
          <form className="grid" style={{ gap: 12 }} onSubmit={handleUpdateOrder}>
            <div className="grid" style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <label className="grid">
                Откуда
                <select
                  className="input"
                  value={editForm.origin}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, origin: e.target.value }))}
                >
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid">
                Куда
                <select
                  className="input"
                  value={editForm.destination}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, destination: e.target.value }))}
                >
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid" style={{ gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
              <label className="grid">
                Вес, кг
                <input
                  className="input"
                  type="number"
                  min={LIMITS.weight.min}
                  max={LIMITS.weight.max}
                  step="0.1"
                  value={editForm.weightKg}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      weightKg: clamp(Number(e.target.value), LIMITS.weight.min, LIMITS.weight.max)
                    }))
                  }
                />
              </label>
              <label className="grid">
                Длина, см
                <input
                  className="input"
                  type="number"
                  min={LIMITS.dimension.min}
                  max={LIMITS.dimension.max}
                  step="1"
                  value={editForm.lengthCm}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      lengthCm: clamp(Number(e.target.value), LIMITS.dimension.min, LIMITS.dimension.max)
                    }))
                  }
                />
              </label>
              <label className="grid">
                Ширина, см
                <input
                  className="input"
                  type="number"
                  min={LIMITS.dimension.min}
                  max={LIMITS.dimension.max}
                  step="1"
                  value={editForm.widthCm}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      widthCm: clamp(Number(e.target.value), LIMITS.dimension.min, LIMITS.dimension.max)
                    }))
                  }
                />
              </label>
              <label className="grid">
                Высота, см
                <input
                  className="input"
                  type="number"
                  min={LIMITS.dimension.min}
                  max={LIMITS.dimension.max}
                  step="1"
                  value={editForm.heightCm}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      heightCm: clamp(Number(e.target.value), LIMITS.dimension.min, LIMITS.dimension.max)
                    }))
                  }
                />
              </label>
            </div>
            {formError && (
              <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>{formError}</div>
            )}
            {formSuccess && (
              <div className="badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#bbf7d0' }}>{formSuccess}</div>
            )}
            {invalidDirection && (
              <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>
                Маршрут должен быть между разными странами
              </div>
            )}
            <button className="button secondary" type="submit" disabled={pendingUpdate || invalidDirection}>
              {pendingUpdate ? 'Сохраняем...' : 'Сохранить изменения'}
            </button>
          </form>
        ) : (
          <div className="grid" style={{ gap: 8 }}>
            <div>
              <strong>Маршрут:</strong> {resolveCountryName(order.originCountry)}
              {' → '}
              {resolveCountryName(order.destinationCountry)}
            </div>
            <div>
              <strong>Вес:</strong> {order.weightKg ?? '—'} кг
            </div>
            <div>
              <strong>Габариты:</strong> {order.lengthCm ?? '-'} x {order.widthCm ?? '-'} x {order.heightCm ?? '-'} см
            </div>
          </div>
        )}
      </section>

      {error && (
        <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>{error}</div>
      )}
    </section>
  );
}
