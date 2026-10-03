import sys
import psycopg2
from tabulate import tabulate

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_CONFIG = {
    "host": "26.181.182.25",
    "port": 5432,
    "dbname": "autotrade_final",
    "user": "autotrade_app",
    "password": "sOHS9jn6Uw5Dc0E2yDh2UyMSRKw6opBnwGA9dzidIG3l5M4BZHspvw"
}

def run_query(sql):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(sql)
        if cur.description:
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            print(tabulate(rows, headers=columns, tablefmt="psql"))
        else:
            print("Query executed successfully (no rows returned).")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        run_query(query)
    else:
        print("=== 1. Current Database & User ===")
        run_query("SELECT current_database(), current_user;")
        
        print("\n=== 2. Sample 10 Vehicles (id, status, showroom_id) ===")
        run_query("SELECT id, status, showroom_id FROM public.vehicles ORDER BY id LIMIT 10;")
        
        print("\n=== 3. Count by Status ===")
        run_query("SELECT status, COUNT(*) FROM public.vehicles GROUP BY status;")
        
        print("\n=== 4. Privileges Check ===")
        priv_query = """SELECT
  has_table_privilege(current_user, 'public.vehicles', 'SELECT') AS can_read,
  has_table_privilege(current_user, 'public.vehicles', 'INSERT') AS can_insert,
  has_table_privilege(current_user, 'public.vehicles', 'UPDATE') AS can_update,
  has_table_privilege(current_user, 'public.vehicles', 'DELETE') AS can_delete,
  has_table_privilege(current_user, 'public.vehicles', 'TRUNCATE') AS can_truncate;"""
        run_query(priv_query)
