cd Backend   # Pređite u backend folder
gunicorn -b 0.0.0.0:$PORT run:app