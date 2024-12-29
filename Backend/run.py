from flask import Flask
from app import create_app, socketio  # Uverite se da je create_app definisan u app/__init__.py

app = create_app()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

