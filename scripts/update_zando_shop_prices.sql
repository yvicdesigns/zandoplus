-- Mise a jour des prix de la boutique officielle "Zando Plus CG"
-- Source : liste manuscrite envoyee par l'utilisateur le 16/09/2026,
-- prix reels vs prix errones actuellement en ligne.
BEGIN;

UPDATE listings SET price = 19000  WHERE id = 'bf98fbbc-4c38-4e4e-96da-1edbf9a546d8'; -- Calculatrice ZH-70
UPDATE listings SET price = 10000  WHERE id = 'c5b39dc0-42e4-4d25-a2c8-72ffbe394cb9'; -- Boitier AirPods 3e Gen
UPDATE listings SET price = 15000  WHERE id = '7feaac11-b9d7-4ab5-9147-d9edaa195173'; -- Ecouteurs TWS style AirPods Pro
UPDATE listings SET price = 25000  WHERE id = '8b697a56-5e28-4b60-bfc0-b31465eb0ec2'; -- Pack Luxe WISME WS-80 Ultra 3
UPDATE listings SET price = 18000  WHERE id = '7e78fa03-1cbf-4718-b532-aea8905c493f'; -- Cles Usb 128Gb
UPDATE listings SET price = 2000   WHERE id = '6c9f85c1-71fb-4ca1-8a4a-7243039c2993'; -- Cles Usb 2Gb
UPDATE listings SET price = 4000   WHERE id = 'b7af5051-4ad2-4494-8c56-0d60f62ed46c'; -- Cles usb 8Gb
UPDATE listings SET price = 8000   WHERE id = '1581dcf5-302e-44eb-9c76-5423f8e9b5fc'; -- Cle USB FASTER 32GB
UPDATE listings SET price = 95000  WHERE id = '2394e6c8-3b3c-4acf-9ee4-db2eaf9b0689'; -- Disque Dur Seagate 4TB
UPDATE listings SET price = 25000  WHERE id = '3db0af1f-b982-49e3-ac87-f6d08aa2281a'; -- Montre JSYES M75 MAX
UPDATE listings SET price = 130000 WHERE id = '02acff90-2130-4a13-83b8-c69156f5c2c2'; -- Xiaomi Redmi 13C
UPDATE listings SET price = 140000 WHERE id = '688771f1-3671-4753-8646-6f6ff544f48c'; -- itel Super 26 Ultra
UPDATE listings SET price = 75000  WHERE id = 'c0ca5b30-6e38-49a8-90f3-53f8ab6d9442'; -- Itel A90
UPDATE listings SET price = 380000 WHERE id = '4fabac8b-4dfd-46a8-9799-26f7f38e6002'; -- iPHONE 14 Pro
UPDATE listings SET price = 95000  WHERE id = 'a852bb68-9f53-4915-837d-fcf97aa532b8'; -- Samsung Galaxy A07
UPDATE listings SET price = 140000 WHERE id = '63263579-678c-4901-8e85-d9043d2747b1'; -- Samsung Galaxy M17
UPDATE listings SET price = 110000 WHERE id = 'de3f814d-af75-4575-beb7-e9f1d27eef4a'; -- Samsung Galaxy M16 5G
UPDATE listings SET price = 350000 WHERE id = '7d40f1f1-4e37-464d-a82b-05ae4cc9ec17'; -- HP ProBook 450 G10
UPDATE listings SET price = 45000  WHERE id = 'bab9f325-465d-451b-83ec-10a56e0b7630'; -- Manette PS5 Noir
UPDATE listings SET price = 45000  WHERE id = '4f6128dc-b7f4-4855-b7b3-57335ca75d00'; -- Manette PS5 Blanc
UPDATE listings SET price = 180000 WHERE id = '3d43e1c2-a25f-4730-be79-a8dca9cb0af2'; -- Galaxy TAb 11 (titre inchange)

-- Verification : doit renvoyer 21 lignes, chacune avec le bon nouveau prix
SELECT id, title, price FROM listings WHERE id IN (
  'bf98fbbc-4c38-4e4e-96da-1edbf9a546d8','c5b39dc0-42e4-4d25-a2c8-72ffbe394cb9',
  '7feaac11-b9d7-4ab5-9147-d9edaa195173','8b697a56-5e28-4b60-bfc0-b31465eb0ec2',
  '7e78fa03-1cbf-4718-b532-aea8905c493f','6c9f85c1-71fb-4ca1-8a4a-7243039c2993',
  'b7af5051-4ad2-4494-8c56-0d60f62ed46c','1581dcf5-302e-44eb-9c76-5423f8e9b5fc',
  '2394e6c8-3b3c-4acf-9ee4-db2eaf9b0689','3db0af1f-b982-49e3-ac87-f6d08aa2281a',
  '02acff90-2130-4a13-83b8-c69156f5c2c2','688771f1-3671-4753-8646-6f6ff544f48c',
  'c0ca5b30-6e38-49a8-90f3-53f8ab6d9442','4fabac8b-4dfd-46a8-9799-26f7f38e6002',
  'a852bb68-9f53-4915-837d-fcf97aa532b8','63263579-678c-4901-8e85-d9043d2747b1',
  'de3f814d-af75-4575-beb7-e9f1d27eef4a','7d40f1f1-4e37-464d-a82b-05ae4cc9ec17',
  'bab9f325-465d-451b-83ec-10a56e0b7630','4f6128dc-b7f4-4855-b7b3-57335ca75d00',
  '3d43e1c2-a25f-4730-be79-a8dca9cb0af2'
) ORDER BY title;

COMMIT;
