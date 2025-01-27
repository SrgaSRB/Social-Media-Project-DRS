from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import os

socketio = SocketIO(cors_allowed_origins="*")  

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your-secret-key'
    app.config['SESSION_TYPE'] = 'filesystem'  # ili 'redis' za skalabilnost
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True

    socketio.init_app(app) 

    # Enable CORS
    CORS(app, supports_credentials=True)

    # Ako želite ograničiti na određeni frontend:
    # CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    # Register blueprints
    from .routes.posts import posts_bp
    from .routes.auth import auth_bp
    from .routes.users import users_bp

    app.register_blueprint(posts_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)

    return app
