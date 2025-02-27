import os
from flask import Blueprint, jsonify, request
from flask import Blueprint, jsonify, request, session
from app.models import User, SessionLocal, Friendship
from app.routes.emails import send_email_in_thread
import uuid
import cloudinary.uploader


def generate_unique_filename(filename):
    """
    Generiše jedinstveno ime fajla koristeći UUID.
    """
    ext = filename.rsplit('.', 1)[1].lower()
    return f"{uuid.uuid4().hex}.{ext}"


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
UPLOAD_FOLDER = os.path.abspath('./uploads')  # Apsolutna putanja do foldera za upload

def allowed_file(filename):
    """
    Proverava da li fajl ima dozvoljenu ekstenziju.
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_db():
    """
    Creates and manages a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/accept-friend', methods=['POST'])
def accept_friend():
    """
    POST: Accept a friend request.
    """
    data = request.get_json()
    receiver_id = session.get('user', {}).get('id')
    sender_id = data.get('sender_id')

    if not receiver_id or not sender_id:
        return jsonify({"error": "Both sender and receiver IDs are required"}), 400

    db = next(get_db())

    friend_request = db.query(Friendship).filter_by(
        user1_id=sender_id, user2_id=receiver_id, status='pending'
    ).first()

    if not friend_request:
        return jsonify({"error": "Friend request not found"}), 404

    friend_request.status = 'accepted'
    db.commit()
    return jsonify({"message": "Friend request accepted"}), 200

@users_bp.route('/search', methods=['GET'])
def search_users_route():
    """
    GET: Search for users by query parameters.
    """
    query = request.args.get('query', '')
    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400

    db = next(get_db())
    search_results = db.query(User).filter(
        (User.username.ilike(f"%{query}%")) |
        (User.email.ilike(f"%{query}%")) |
        (User.first_name.ilike(f"%{query}%")) |
        (User.last_name.ilike(f"%{query}%")) |
        (User.address.ilike(f"%{query}%")) |
        (User.city.ilike(f"%{query}%"))
    ).all()

    result = [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "city": user.city,
            'profileImage': user.profile_picture_url,
        } for user in search_results
    ]

    return jsonify(result), 200

@users_bp.route('/', methods=['GET'])
def get_all_users():
    """
    GET: Retrieves all users except the currently logged-in user.
    """
    db = next(get_db())
    user_session = session.get('user')

    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    current_user_id = user_session['id']
    users = db.query(User).filter(User.id != current_user_id).all()
    result = [{'id': user.id, 'username': user.username, 'name':user.first_name + " " + user.last_name, 'email':user.email, 'city':user.city, 'country':user.country, 'profileImage':user.profile_picture_url} for user in users]
    return jsonify(result), 200

@users_bp.route('/send-friend-request', methods=['POST'])
def send_friend_request():
    """
    POST: Send a friend request from the logged-in user to another user.
    """
    db = next(get_db())
    
    user_session = session.get('user')
    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401
    
    sender_id = user_session['id']
    data = request.get_json()
    receiver_id = data.get('receiver_id')

    if not receiver_id:
        return jsonify({'error': 'Receiver ID is required'}), 400

    if sender_id == receiver_id:
        return jsonify({'error': 'Cannot send friend request to yourself'}), 400

    existing_friendship = db.query(Friendship).filter(
        (Friendship.user1_id == sender_id) & (Friendship.user2_id == receiver_id)
    ).first()

    if existing_friendship:
        if existing_friendship.status == 'pending':
            return jsonify({'error': 'Friendship request already exists'}), 400
        elif existing_friendship.status == 'accepted':
            return jsonify({'error': 'You are already friends'}), 400
        
    new_friend_request = Friendship(
        user1_id=sender_id,
        user2_id=receiver_id,
        status='pending',
        request_sent_by=sender_id
    )
    db.add(new_friend_request)
    db.commit()

    return jsonify({'message': 'Friend request sent successfully'}), 200

@users_bp.route('/accept-friend-request', methods=['POST'])
def accept_friend_request():
    """
    POST: Accepts a friend request either by request_id or user1_id.
    """
    db = next(get_db())

    user_session = session.get('user')
    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    user_id = user_session['id']
    data = request.get_json()

    friend_request_id = data.get('request_id')
    user1_id = data.get('user1_id')

    if not friend_request_id and not user1_id:
        return jsonify({'error': 'Either request_id or user1_id is required'}), 400

    if friend_request_id:
        friend_request = db.query(Friendship).filter_by(
            id=friend_request_id,
            user2_id=user_id,
            status='pending'
        ).first()
    elif user1_id:
        friend_request = db.query(Friendship).filter_by(
            user1_id=user1_id,
            user2_id=user_id,
            status='pending'
        ).first()

    if not friend_request:
        return jsonify({'error': 'Friend request not found or already accepted'}), 404

    friend_request.status = 'accepted'
    db.commit()

    return jsonify({'message': 'Friend request accepted successfully'}), 200

@users_bp.route('/reject-friend-request', methods=['POST'])
def reject_friend_request():
    """
    POST: Rejects a friend request.
    """
    data = request.get_json()
    request_id = data.get('request_id')
    user_session = session.get('user')

    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    db = next(get_db())
    friend_request = db.query(Friendship).filter_by(id=request_id, status='pending').first()

    if not friend_request:
        return jsonify({'error': 'Friend request not found or already processed'}), 404

    if friend_request.user2_id != user_session['id']:
        return jsonify({'error': 'Unauthorized action'}), 403  

    friend_request.status = 'rejected'
    db.commit()

    return jsonify({'message': 'Friend request rejected successfully'}), 200

@users_bp.route('/friend-requests', methods=['GET'])
def get_friend_requests():
    """
    GET: Retrieves all pending friend requests for the current user.
    """
    db = next(get_db())
    
    user_session = session.get('user')
    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    current_user_id = user_session['id']

    requests = db.query(Friendship).filter(
        (Friendship.user2_id == current_user_id) &  
        (Friendship.status == 'pending')  
    ).all()

    if not requests:
        return jsonify({'message': 'No pending friend requests'}), 200

    result = []
    for request in requests:
        sender = db.query(User).filter_by(id=request.user1_id).first()
        
        if sender:
            result.append({
                'id': request.id,
                'name': f"{sender.first_name} {sender.last_name}",
                'username': sender.username,
                'location': sender.city,
                'country': sender.country,
                'profileImage': sender.profile_picture_url
            })

    return jsonify(result), 200

@users_bp.route('/blocked', methods=['GET'])
def get_blocked_users():
    """
    GET: Retrieves a list of blocked users.
    """
    db = next(get_db())
    blocked_users = db.query(User).filter_by(is_blocked=True).all()

    result = []
    for user in blocked_users:
        result.append({
            'id': user.id,
            'username': user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'city': user.city,
            'country': user.country,
            'phone': user.phone_number,
            'email': user.email,
            'profileImage': user.profile_picture_url
        })

    return jsonify(result), 200

@users_bp.route('/unblock/<int:user_id>', methods=['POST'])
def unblock_user(user_id):
    """
    POST: Unblocks a user by their ID.
    """
    db = next(get_db())
    user = db.query(User).filter_by(id=user_id, is_blocked=True).first()

    if not user:
        return jsonify({'error': 'User not found or not blocked'}), 404

    user.is_blocked = False
    db.commit()
    return jsonify({'message': f'User {user.username} successfully unblocked'}), 200

@users_bp.route('/remove-friend', methods=['POST'])
def remove_friend():
    data = request.get_json()
    user_session = session.get('user')

    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    user_id = user_session['id']
    friend_id = data.get('friend_id')

    if not friend_id:
        return jsonify({'error': 'Friend ID is required'}), 400

    db = next(get_db())
    
    # Ispravan filter uslov sa zagradama i `&` operatorom
    friendship = db.query(Friendship).filter(
        ((Friendship.user1_id == user_id) & (Friendship.user2_id == friend_id)) |
        ((Friendship.user1_id == friend_id) & (Friendship.user2_id == user_id))
    ).first()

    if not friendship:
        return jsonify({'error': 'Friendship not found'}), 404

    db.delete(friendship)
    db.commit()
    return jsonify({'message': 'Friendship removed successfully'}), 200

@users_bp.route('/friend-statuses', methods=['GET'])
def get_friend_statuses():
    """
    GET: Returns the friendship status for all users relative to the logged-in user.
    """
    user_session = session.get('user')

    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    user_id = user_session['id']
    db = next(get_db())

    all_users = db.query(User).all()

    friendships = db.query(Friendship).filter(
        (Friendship.user1_id == user_id) | (Friendship.user2_id == user_id)
    ).all()

    # Kreiraj osnovni objekat sa svim korisnicima i podrazumevanim statusom
    statuses = {user.id: "notFriends" for user in all_users if user.id != user_id}

    for friendship in friendships:
        if friendship.status == 'accepted':
            friend_id = friendship.user1_id if friendship.user1_id != user_id else friendship.user2_id
            statuses[friend_id] = "friends"
        elif friendship.status == 'pending':
            if friendship.user1_id == user_id:
                statuses[friendship.user2_id] = "requestSent"
            else:
                statuses[friendship.user1_id] = "requestReceived"

    return jsonify(statuses), 200

# Ruta za upload profilne slike
@users_bp.route('/upload-profile-photo', methods=['POST'])
def upload_profile_photo():
    if 'user' not in session:
        return jsonify({"error": "User not logged in"}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400  

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Upload na Cloudinary
    upload_result = cloudinary.uploader.upload(file, folder="profile_pictures")

    if not upload_result.get("secure_url"):
        return jsonify({"error": "Failed to upload image"}), 500

    db = SessionLocal()
    user = db.query(User).filter_by(id=session['user']['id']).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    user.profile_picture_url = upload_result["secure_url"]
    db.commit()
    db.close()

    return jsonify({
        "message": "Profile picture updated successfully",
        "profileImageUrl": upload_result["secure_url"]
    }), 200
