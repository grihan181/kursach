export interface WarehouseLocationOption {
  value: string;
  label: string;
  country: string;
  city: string;
  note?: string;
}

export const WAREHOUSE_LOCATION_OPTIONS: WarehouseLocationOption[] = [
  {
    value: 'Россия, Москва · Склад Домодедово, Индустриальная 7',
    label: 'Москва · Домодедово',
    country: 'Россия',
    city: 'Москва',
    note: 'Основной сортировочный центр'
  },
  {
    value: 'Россия, Санкт-Петербург · Терминал Пулково, Воздушная 12',
    label: 'Санкт-Петербург · Пулково',
    country: 'Россия',
    city: 'Санкт-Петербург',
    note: 'Перевалка северо-запад'
  },
  {
    value: 'США, Нью-Йорк · JFK Logistics Park, 52nd Street 18',
    label: 'Нью-Йорк · JFK',
    country: 'США',
    city: 'Нью-Йорк'
  },
  {
    value: 'США, Лос-Анджелес · Port of LA, Warehouse B12',
    label: 'Лос-Анджелес · порт',
    country: 'США',
    city: 'Лос-Анджелес'
  },
  {
    value: 'Германия, Франкфурт · Cargo City Süd, Гейт 45',
    label: 'Франкфурт · Cargo City',
    country: 'Германия',
    city: 'Франкфурт'
  },
  {
    value: 'Турция, Стамбул · Логцентр Халкалы, Ulubatli Cd. 4',
    label: 'Стамбул · Halkalı',
    country: 'Турция',
    city: 'Стамбул'
  },
  {
    value: 'Китай, Шанхай · Pudong Free Trade Zone, Block 9',
    label: 'Шанхай · FTZ',
    country: 'Китай',
    city: 'Шанхай'
  },
  {
    value: 'ОАЭ, Дубай · Jebel Ali Logistics, Plot N25',
    label: 'Дубай · Jebel Ali',
    country: 'ОАЭ',
    city: 'Дубай'
  },
  {
    value: 'Корея, Сеул · Incheon Smart Hub, Warehouse 3',
    label: 'Сеул · Incheon',
    country: 'Корея',
    city: 'Сеул'
  },
  {
    value: 'Бразилия, Сан-Паулу · Guarulhos Cargo, Terminal 2',
    label: 'Сан-Паулу · Guarulhos',
    country: 'Бразилия',
    city: 'Сан-Паулу'
  }
] as const;
