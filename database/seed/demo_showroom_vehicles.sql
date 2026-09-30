-- Development only. Fictional display records; demo_key is not a VIN.
-- Apply V3_0_1 first. Existing V3_0_0 inserts showroom id 1.
BEGIN;
INSERT INTO vehicles (demo_key,brand,model,variant,manufacture_year,fuel_type,transmission,
  body_type,price,mileage,image_url,showroom_id,status,description)
SELECT 'DEMO-' || lpad(n::text,2,'0'),
  (ARRAY['Toyota','Honda','Mazda','Hyundai','Kia','Ford','Mitsubishi','Suzuki','Nissan','VinFast'])[n],
  (ARRAY['Vios','City','CX 5','Accent','Seltos','Ranger','Xpander','XL7','Navara','VF 8'])[n],
  'DEMO', 2016+n, 'Gasoline', 'Automatic',
  CASE WHEN n IN (3,5,7,8,10) THEN 'SUV / Crossover' ELSE 'Sedan' END,
  300000000+n*40000000, 10000+n*5000,
  'https://placehold.co/800x600/png?text=DEMO+Vehicle+' || n,
  1, CASE WHEN n=8 THEN 'HOLD' WHEN n=9 THEN 'RESERVED' WHEN n=10 THEN 'SOLD' ELSE 'AVAILABLE' END,
  'DEMO ONLY - fictional showroom stock; not verified marketplace inventory'
FROM generate_series(1,10) AS n
ON CONFLICT (demo_key) DO UPDATE SET
  brand=EXCLUDED.brand, model=EXCLUDED.model, variant=EXCLUDED.variant,
  manufacture_year=EXCLUDED.manufacture_year, fuel_type=EXCLUDED.fuel_type,
  transmission=EXCLUDED.transmission, body_type=EXCLUDED.body_type,
  price=EXCLUDED.price, mileage=EXCLUDED.mileage, image_url=EXCLUDED.image_url,
  showroom_id=EXCLUDED.showroom_id, description=EXCLUDED.description;
COMMIT;
