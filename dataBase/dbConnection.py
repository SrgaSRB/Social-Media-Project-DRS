import psycopg2

host = "localhost"  
database = "DRS"          
user = "postgres"         
password = "ftn" 
port = 5432 

try:
    
    conn = psycopg2.connect(
        host=host,
        database=database,
        user=user,
        password=password,
        port=port
    )

    print("Uspešno ste povezani na bazu!")
    
    # Kreiranje kursora za izvršavanje SQL upita
    cursor = conn.cursor()
    
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = cursor.fetchall()
    print("Tabele u bazi:", tables)
    
    cursor.close()
    conn.close()

except Exception as e:
    print("Greška prilikom povezivanja:", e)