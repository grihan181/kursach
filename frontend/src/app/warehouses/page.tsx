'use client';

import { useEffect, useMemo, useState } from 'react';
import Protected from '@/components/Protected';
import type { Warehouse } from '@/types';
import { fetchWarehouses } from '@/services/warehouses';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWarehouses();
        setWarehouses(data);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить информацию о складах');
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Warehouse[]>();
    warehouses.forEach((warehouse) => {
      const key = warehouse.countryName;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(warehouse);
    });
    return Array.from(map.entries());
  }, [warehouses]);

  return (
    <Protected>
      <div className="container" style={{ display: 'grid', gap: 24 }}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <p className="badge">Инфраструктура</p>
          <h1 style={{ margin: 0 }}>Наши склады</h1>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
            Эти площадки используем как точки консолидации и последней мили. Добавляйте этапы из этого справочника прямо в карточке заказа.
          </p>
          <div className="stat-grid">
            <article className="stat-card">
              <p style={{ margin: 0, color: 'var(--muted)' }}>Складов</p>
              <strong>{warehouses.length}</strong>
            </article>
            <article className="stat-card">
              <p style={{ margin: 0, color: 'var(--muted)' }}>Стран покрытия</p>
              <strong>{grouped.length}</strong>
            </article>
          </div>
        </section>

        {error && (
          <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>{error}</div>
        )}

        {grouped.map(([country, items]) => (
          <section key={country} className="glass" style={{ display: 'grid', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>{country}</h3>
              <p style={{ margin: 0, color: 'var(--muted)' }}>Складов в стране: {items.length}</p>
            </div>
            <div className="service-grid">
              {items.map((warehouse) => (
                <article key={warehouse.id} className="service-card">
                  <h4 style={{ margin: 0 }}>{warehouse.name}</h4>
                  <p style={{ margin: '4px 0', color: 'var(--muted)' }}>
                    {warehouse.city}, {warehouse.address}
                  </p>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    Телефон: {warehouse.contactPhone ?? '-'}
                    <br />
                    Часы: {warehouse.workingHours ?? 'по запросу'}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}

        {warehouses.length === 0 && !error && <div className="card">Список складов загружается...</div>}
      </div>
    </Protected>
  );
}
