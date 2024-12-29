import psycopg2
from psycopg2.extras import RealDictCursor

# Konfiguracija baze
DATABASE_CONFIG = {
    "host": "localhost",
    "database": "DRS",
    "user": "postgres",
    "password": "ftn",
    "port": 5432
}

def get_connection():
    """
    Kreira i vraća konekciju na bazu.
    """
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        return conn
    except Exception as e:
        print("Greška prilikom povezivanja na bazu:", e)
        return None

def execute_query(query, params=None, fetch_one=False, fetch_all=False):
    """
    Izvršava SQL upit.
    """
    conn = get_connection()
    if not conn:
        return None

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            
            if fetch_one:
                result = cursor.fetchone()
            elif fetch_all:
                result = cursor.fetchall()
            else:
                result = None

            conn.commit()
            return result
    except Exception as e:
        print(f"Greška prilikom izvršavanja upita: {e}")
        conn.rollback()
    finally:
        conn.close()

# Test konekcije
if __name__ == "__main__":
    print("Testiranje konekcije na bazu...")
    conn = get_connection()
    if conn:
        print("Uspešno povezivanje na bazu!")
        cursor = conn.cursor()
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        tables = cursor.fetchall()
        print("Tabele u bazi:", tables)
        cursor.close()
        conn.close()
