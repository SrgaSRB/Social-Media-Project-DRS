from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
import cloudinary
import cloudinary.uploader
from config import Config

socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    socketio.init_app(app)

    # Enable CORS
    CORS(app, supports_credentials=True)

    # Cloudinary inicijalizacija
    cloudinary.config(
        cloud_name=Config.CLOUDINARY_CLOUD_NAME,
        api_key=Config.CLOUDINARY_API_KEY,
        api_secret=Config.CLOUDINARY_API_SECRET,
    )

    # Register blueprints
    from .routes.posts import posts_bp
    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.messages import messages_bp

    app.register_blueprint(posts_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(messages_bp)

    return app
