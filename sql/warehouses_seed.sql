INSERT INTO warehouses (id, code, name, country_code, country_name, city, address, contact_phone, working_hours, created_at)
VALUES
  ('1be2a5c0-1c9a-4c16-9d5b-2b9e7de00101', 'NYC-01', 'New York JFK Cargo', 'US', 'США', 'Нью-Йорк', 'Cargo Zone 75, JFK Airport', '+1-212-555-0142', 'круглосуточно', NOW()),
  ('2c84d6b2-5f8b-4a5a-9c2d-4f1bb9d00202', 'BER-01', 'Berlin Tempelhof Hub', 'DE', 'Германия', 'Берлин', 'Ulmenstrasse 15', '+49-30-555-0177', '08:00-22:00', NOW()),
  ('3d95e7c4-6a9c-4b6b-8d3e-5a2ccad00303', 'IST-01', 'Стамбул Евразия', 'TR', 'Турция', 'Стамбул', 'Mahmutbey Mah., 52', '+90-212-555-0199', '07:00-23:00', NOW()),
  ('4ea6f8d6-7bad-4c7c-9e4f-6b3ddbe00404', 'DXB-01', 'Dubai Logistics South', 'AE', 'ОАЭ', 'Дубай', 'Logistics City, блок C2', '+971-4-555-0220', 'круглосуточно', NOW()),
  ('5fb709e8-8cbe-4d8d-af50-7c4eece00505', 'TYO-01', 'Tokyo Narita Express', 'JP', 'Япония', 'Токио', 'Narita 2-1-3', '+81-3-555-0288', '06:00-22:00', NOW()),
  ('6ac81bfa-9dcf-4e9e-b061-8d5ffde00606', 'SAO-01', 'São Paulo Viracopos', 'BR', 'Бразилия', 'Сан-Паулу', 'Rodovia Santos Dumont, км 66', '+55-11-555-0345', '08:00-20:00', NOW()),
  ('7bd92d0c-aed0-4faf-c172-9e600ef00707', 'DEL-01', 'Delhi AeroCity Hub', 'IN', 'Индия', 'Дели', 'Aerocity 4, склад 18', '+91-11-555-0400', '09:00-21:00', NOW()),
  ('8ce03e1e-bfe1-50b0-d283-af711ff00808', 'SEL-01', 'Seoul Incheon Cargo', 'KR', 'Корея', 'Сеул', 'Incheon 272, блок F', '+82-2-555-0468', 'круглосуточно', NOW()),
  ('9df14f30-d0f2-5211-e394-b08220f00909', 'SHA-01', 'Shanghai Pudong Freight', 'CN', 'Китай', 'Шанхай', 'Pudong Logistics Park 7', '+86-21-555-0522', '06:00-00:00', NOW()),
  ('af025042-e203-5322-f4a5-c19331001010', 'MSK-01', 'Москва Шереметьево', 'RU', 'Россия', 'Москва', 'пос. Мелькисарово, стр. 4', '+7-495-555-0601', '07:00-23:00', NOW())
ON CONFLICT (code) DO NOTHING;
