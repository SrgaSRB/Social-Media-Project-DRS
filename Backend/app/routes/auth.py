from flask import Blueprint, request, jsonify, session
from sqlalchemy.orm import Session
from app.models import User, SessionLocal, Friendship
from werkzeug.security import check_password_hash
from app.routes.emails import send_email_in_thread
from contextlib import contextmanager


auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@contextmanager
def get_db():
    """
    Creates and manages a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Registers a new user in the database.
    """
    data = request.get_json()

    required_fields = [
        'username', 'first_name', 'last_name', 'address', 
        'city', 'country', 'phone_number', 'email', 'password'
    ]
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    if ' ' in data['username']:
        return jsonify({"error": "Username cannot contain whitespace"}), 400

    with get_db() as db:

        existing_user = db.query(User).filter((User.username == data['username']) | (User.email == data['email'])).first()
        if existing_user:
            return jsonify({"error": "Username or email already exists"}), 400

        new_user = User(
            username=data['username'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            address=data['address'],
            city=data['city'],
            country=data['country'],
            phone_number=data['phone_number'],
            email=data['email'],
            password=data['password'],  
            role='user'  
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        admin = db.query(User).filter_by(role='admin').first()

        if admin:
            new_friendship = Friendship(
                user1_id = new_user.id,
                user2_id = admin.id,
                status = 'accepted',
                request_sent_by = admin.id
            )
            db.add(new_friendship)
            db.commit()

        message_text = f"Kreiran korisnik! Korisnicko ime: {new_user.username} Lozinka: {new_user.password}"
        send_email_in_thread(
            "luka.zbucnovic@gmail.com", "jndx ishq rgsd ehnb",
            [f"{new_user.email}"], "Korisnik uspesno kreiran", message_text,
            "smtp.gmail.com", 587
        )

    return jsonify({"message": "Registration successful"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Logs in a user and creates a session.
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    with get_db() as db:
        user = db.query(User).filter_by(username=username).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.is_blocked:
            return jsonify({'error': 'User is blocked'}), 403

        if user and user.password == password:
            session['user'] = {
                'id': user.id,
                'username': user.username,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'address': user.address,
                'city': user.city,
                'country': user.country,
                'phone': user.phone_number,
                'email': user.email,
                'password': user.password,  # Plain-text password (to be removed in the future)
                'role': user.role,
                'isBlocked': user.is_blocked,
                'rejectedPostsCount': user.rejected_posts_count,
                'createdAt': user.created_at.isoformat() if user.created_at else None,
                'profileImage': user.profile_picture_url
            }
            return jsonify({'message': 'Login successful', 'user': session['user']}), 200

    return jsonify({'error': 'Invalid username or password'}), 401


@auth_bp.route('/update-profile', methods=['POST'])
def update_profile():
    """
    Updates the profile of the currently logged-in user.
    """
    data = request.get_json()
    session_username = session.get('user', {}).get('username')

    if not session_username:
        return jsonify({'error': 'You are not logged in'}), 401

    with get_db() as db:
        user = db.query(User).filter_by(username=session_username).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        for key, value in data.items():
            if key != 'username':  
                setattr(user, key, value)

        db.commit()

        session['user'] = {**session['user'], **data}

        return jsonify({'message': 'Profile updated successfully', 'user': session['user']}), 200

@auth_bp.route('/check-username', methods=['POST'])
def check_username():
    data = request.get_json()
    username = data.get('username')

    if not username:
        return jsonify({"error": "Username is required"}), 400

    with get_db() as db:
        user = db.query(User).filter_by(username=username).first()

    return jsonify({"available": user is None}), 200

@auth_bp.route('/session', methods=['GET'])
def get_session():
    """
    Returns the current user session if it exists.
    """
    user = session.get('user') 
    
    if user:
        return jsonify({'user': user}), 200

    return jsonify({'error': 'No active session'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    POST: Logout user by clearing the session.
    """
    session.clear()
    return jsonify({'message': 'Successfully logged out'}), 200

@auth_bp.route('/check-email', methods=['POST'])
def check_email():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    with get_db() as db:
        user = db.query(User).filter_by(email=email).first()

    if user:
        return jsonify({'available': False}), 200

    return jsonify({'available': True}), 200
