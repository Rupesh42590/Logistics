import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    try:
        # Connect to default database
        con = psycopg2.connect(dbname='postgres', user='postgres', host='localhost', password='harihyma')
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'logistics_db'")
        exists = cur.fetchone()
        
        if not exists:
            print("Creating database logistics_db...")
            cur.execute('CREATE DATABASE logistics_db')
        else:
            print("Database logistics_db already exists.")
            
        cur.close()
        con.close()
        
        # Connect to the new database to enable PostGIS
        con = psycopg2.connect(dbname='logistics_db', user='postgres', host='localhost', password='harihyma')
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()
        
        print("Enabling PostGIS extension...")
        cur.execute('CREATE EXTENSION IF NOT EXISTS postgis')
        
        cur.close()
        con.close()
        print("Database initialized successfully.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_database()
