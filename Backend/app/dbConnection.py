from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:ftn@postgres:5432/DRS"
engine = create_engine(DATABASE_URL)

try:
    connection = engine.connect()
    print("Uspešno povezivanje na bazu!")
except Exception as e:
    print(f"Greška prilikom povezivanja na bazu: {e}")
