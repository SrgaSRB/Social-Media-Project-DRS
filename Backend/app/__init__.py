from flask import Flask, session, g, abort
from flask_cors import CORS
from flask_socketio import SocketIO
import cloudinary
import cloudinary.uploader
from config import Config

from app.models import User
from app.models import engine 
from app.models import Base
from app.models import SessionLocal

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

    @app.before_request
    def check_if_user_blocked():
        user_data = session.get("user")
        if not user_data:
            return  # Gost

        user_id = user_data.get("id")
        if not user_id:
            return

        with SessionLocal() as db:
            user = db.get(User, user_id)
            if not user:
                session.clear()
                abort(401)

            if user.is_blocked:
                session.clear()
                abort(403, "Your account has been blocked.")

            # Dajemo pristup user objektu kroz g
            g.current_user = user

    # Register blueprints
    from .routes.posts import posts_bp
    from .routes.auth import auth_bp
    from .routes.users import users_bp
    from .routes.messages import messages_bp

    app.register_blueprint(posts_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(messages_bp)

    Base.metadata.create_all(bind=engine)

    return app
