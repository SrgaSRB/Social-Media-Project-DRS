from flask import Blueprint, request, jsonify, session
from sqlalchemy.orm import Session
from app.models import User, SessionLocal
from app.dbUtils import execute_query
from werkzeug.security import check_password_hash
from app.routes.emails import send_email_in_thread


auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

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

    # Validate required fields
    required_fields = [
        'username', 'first_name', 'last_name', 'address', 
        'city', 'country', 'phone_number', 'email', 'password'
    ]
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    # Check if username or email already exists
    db = next(get_db())
    existing_user = db.query(User).filter((User.username == data['username']) | (User.email == data['email'])).first()
    if existing_user:
        return jsonify({"error": "Username or email already exists"}), 400

    # Create a new user instance
    new_user = User(
        username=data['username'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        address=data['address'],
        city=data['city'],
        country=data['country'],
        phone_number=data['phone_number'],
        email=data['email'],
        password=data['password'],  # Hash the password in production!
        role='user'  # Default role
    )

    # Add and commit the new user to the database
    db.add(new_user)
    db.commit()
    message_text = f"Kreiran korisnik! Korisnicko ime: {new_user.username} Lozinka: {new_user.password}"
    send_email_in_thread("luka.zbucnovic@gmail.com","jndx ishq rgsd ehnb",[f"{new_user.email}"],"Korisnik uspesno kreiran",message_text,"smtp.gmail.com",587)

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

    # Get the user from the database
    db = next(get_db())
    user = db.query(User).filter_by(username=username).first()

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
            'createdAt': user.created_at.isoformat() if user.created_at else None
        }
        print(f"Session created: {session['user']}")  # Debug ispis sesije
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

    # Get the user from the database
    db = next(get_db())
    user = db.query(User).filter_by(username=session_username).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Update user details except username
    for key, value in data.items():
        if key != 'username':  # Prevent updating the username
            setattr(user, key, value)

    db.commit()

    # Update session with the new data
    session['user'] = {**session['user'], **data}
    return jsonify({'message': 'Profile updated successfully', 'user': session['user']}), 200

@auth_bp.route('/check-username', methods=['POST'])
def check_username():
    data = request.get_json()
    username = data.get('username')

    if not username:
        return jsonify({"error": "Username is required"}), 400

    # Provera dostupnosti korisničkog imena u bazi
    db = SessionLocal()
    user = db.query(User).filter_by(username=username).first()
    db.close()

    return jsonify({"available": user is None}), 200

@auth_bp.route('/session', methods=['GET'])
def get_session():
    """
    Returns the current user session if it exists.
    """
    user = session.get('user')  # Dohvati podatke o korisniku iz sesije
    print(f"Session: {session.get('user')}")

    if user:
        return jsonify({'user': user}), 200

    return jsonify({'user': None}), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    POST: Logout user by clearing the session.
    """
    session.clear()
    return jsonify({'message': 'Successfully logged out'}), 200
