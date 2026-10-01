-- Acceptance-safe fixtures only. No crawler data imported or existing rows modified.
\set ON_ERROR_STOP on
BEGIN;
CREATE FUNCTION pg_temp.expect_inventory_error(stmt text, state text, name text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE s text; c text;
BEGIN
 BEGIN EXECUTE stmt;
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS s=RETURNED_SQLSTATE,c=CONSTRAINT_NAME;
  IF s<>state OR c IS DISTINCT FROM name THEN RAISE EXCEPTION 'Unexpected inventory rejection: % %',s,c; END IF;
  RAISE NOTICE 'PASS inventory rejection % %',s,c; RETURN;
 END;
 RAISE EXCEPTION 'Inventory rejection unexpectedly accepted';
END $$;
DO $$
DECLARE v bigint; s bigint; l bigint; u bigint; d bigint; r record; t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['sources','vehicles','listings','showrooms','deposits','appointments',
   'transaction_ledger','app_users','auth_otps','password_reset_sessions'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid=('public.'||t)::regclass AND contype='p'
    AND convalidated AND pg_get_constraintdef(oid)='PRIMARY KEY (id)') THEN RAISE EXCEPTION 'Missing PK %',t; END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=('public.'||t)::regclass AND attname='id'
    AND atttypid='bigint'::regtype AND attnotnull) THEN RAISE EXCEPTION 'Wrong ID type/NULL %',t; END IF;
 END LOOP;
 FOR r IN SELECT * FROM (VALUES
  ('idx_listings_price','listings','price',NULL::text),
  ('idx_listings_mileage','listings','mileage','(mileage IS NOT NULL)'),
  ('idx_listings_vehicle_id','listings','vehicle_id',NULL),
  ('idx_vehicles_fuel_type','vehicles','fuel_type','(fuel_type IS NOT NULL)'),
  ('idx_vehicles_transmission','vehicles','transmission','(transmission IS NOT NULL)'),
  ('idx_vehicles_body_type','vehicles','body_type','(body_type IS NOT NULL)')
 ) expected(name,tbl,col,predicate) LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid
   WHERE c.relname=r.name AND i.indrelid=('public.'||r.tbl)::regclass AND i.indisvalid
    AND pg_get_indexdef(i.indexrelid,1,true)=r.col AND pg_get_expr(i.indpred,i.indrelid) IS NOT DISTINCT FROM r.predicate)
  THEN RAISE EXCEPTION 'Wrong inventory index %',r.name; END IF;
 END LOOP;
 INSERT INTO sources(source_name) VALUES('TV3-FINAL-INVENTORY') RETURNING id INTO s;
 INSERT INTO vehicles(brand,model,manufacture_year,demo_key)
  VALUES('TV3','Archive fixture',2020,'TV3-FINAL-INVENTORY') RETURNING id INTO v;
 IF NOT EXISTS(SELECT 1 FROM vehicles WHERE id=v AND status='ARCHIVED' AND showroom_id IS NULL)
  THEN RAISE EXCEPTION 'Archive/showroom default boundary invalid'; END IF;
 FOR r IN SELECT * FROM (VALUES
  ('manufacture_year','1899','chk_vehicles_manufacture_year'),
  ('fuel_type','''Petrol''','chk_vehicles_fuel_type'),
  ('transmission','''Other''','chk_vehicles_transmission'),
  ('engine_size','0','chk_vehicles_engine_size'),
  ('seat_count','1','chk_vehicles_seat_count'),
  ('origin','''Other''','chk_vehicles_origin'),
  ('status','''Other''','chk_vehicles_status')
 ) expected(col,value,constraint_name) LOOP
  PERFORM pg_temp.expect_inventory_error(format('UPDATE vehicles SET %I=%s WHERE id=%s',r.col,r.value,v),'23514',r.constraint_name);
 END LOOP;
 PERFORM pg_temp.expect_inventory_error(format('INSERT INTO vehicles(brand,model,manufacture_year,demo_key) VALUES(''TV3'',''Duplicate'',2020,''TV3-FINAL-INVENTORY'')'),'23505','uq_vehicles_demo_key');
 PERFORM pg_temp.expect_inventory_error('INSERT INTO sources(source_name) VALUES(''TV3-FINAL-INVENTORY'')','23505','sources_source_name_key');
 UPDATE vehicles SET vin='TV3-FINAL-INVENTORY-NOT-REAL' WHERE id=v;
 PERFORM pg_temp.expect_inventory_error('INSERT INTO vehicles(brand,model,manufacture_year,vin) VALUES(''TV3'',''Duplicate'',2020,''TV3-FINAL-INVENTORY-NOT-REAL'')','23505','vehicles_vin_key');
 INSERT INTO listings(vehicle_id,source_id,price,source_url,crawled_at,image_url)
  VALUES(v,s,100,'https://example.test/tv3-final-inventory',CURRENT_TIMESTAMP,'https://example.test/fixture.png') RETURNING id INTO l;
 PERFORM pg_temp.expect_inventory_error(format('INSERT INTO listings(vehicle_id,source_id,price,source_url,crawled_at) VALUES(%s,%s,100,''https://example.test/tv3-final-inventory'',CURRENT_TIMESTAMP)',v,s),'23505','listings_source_url_key');
 PERFORM pg_temp.expect_inventory_error(format('UPDATE listings SET price=0 WHERE id=%s',l),'23514','chk_listings_price');
 PERFORM pg_temp.expect_inventory_error(format('UPDATE listings SET mileage=-1 WHERE id=%s',l),'23514','chk_listings_mileage');
 PERFORM pg_temp.expect_inventory_error(format('UPDATE listings SET vehicle_id=-9223372036854775808 WHERE id=%s',l),'23503','fk_listings_vehicle');
 PERFORM pg_temp.expect_inventory_error(format('UPDATE listings SET source_id=-9223372036854775808 WHERE id=%s',l),'23503','fk_listings_source');
 UPDATE listings SET updated_at='2000-01-01' WHERE id=l;
 IF NOT EXISTS(SELECT 1 FROM listings WHERE id=l AND updated_at=CURRENT_TIMESTAMP AND image_url IS NOT NULL)
  THEN RAISE EXCEPTION 'Listing timestamp trigger failed'; END IF;
 SELECT id INTO u FROM app_users WHERE username='customer';
 UPDATE vehicles SET showroom_id=1,status='AVAILABLE' WHERE id=v;
 INSERT INTO deposits(deposit_code,vehicle_id,user_id,showroom_id,amount,status)
  VALUES('TV3-FINAL-INVENTORY',v,u,1,100,'DEPOSITED') RETURNING id INTO d;
 -- DB has FK/uniqueness but no vehicle-state transition trigger. Assert this actual boundary.
 IF NOT EXISTS(SELECT 1 FROM deposits deposit_row JOIN vehicles stock ON stock.id=deposit_row.vehicle_id
   WHERE deposit_row.id=d AND stock.showroom_id=deposit_row.showroom_id AND deposit_row.user_id=u)
 THEN RAISE EXCEPTION 'Fixture deposit/vehicle/showroom references incoherent'; END IF;
 IF NOT EXISTS(SELECT 1 FROM vehicles WHERE id=v AND status='AVAILABLE') THEN RAISE EXCEPTION 'Unexpected vehicle state transition'; END IF;
 PERFORM pg_temp.expect_inventory_error(format('UPDATE deposits SET vehicle_id=-9223372036854775808 WHERE id=%s',d),'23503','fk_deposits_vehicle');
 PERFORM pg_temp.expect_inventory_error(format('UPDATE deposits SET showroom_id=-9223372036854775808 WHERE id=%s',d),'23503','fk_deposits_showroom');
 RAISE NOTICE 'PASS base PK/ID/index/predicates, archive boundary, vehicle vocabulary/VIN/demo uniqueness, listing FK/CHECK/UNIQUE/trigger and deposit vehicle/showroom FK; state transitions remain Backend-owned';
END $$;
ROLLBACK;
