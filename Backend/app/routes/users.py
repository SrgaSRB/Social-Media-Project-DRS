import os
import json
from flask import Blueprint, jsonify, request
from flask import Blueprint, jsonify, request, session
from app.models import User, SessionLocal, Friendship
from app.routes.emails import send_email_in_thread

def get_db():
    """
    Creates and manages a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Kreiraj Blueprint za rute korisnika
users_bp = Blueprint('users', __name__, url_prefix='/api/users')

#Ruta za dodavanje prijatelja
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

    # Check if the friend request exists
    friend_request = db.query(Friendship).filter_by(
        user1_id=sender_id, user2_id=receiver_id, status='pending'
    ).first()

    if not friend_request:
        return jsonify({"error": "Friend request not found"}), 404

    # Update the status to 'accepted'
    friend_request.status = 'accepted'
    db.commit()
    return jsonify({"message": "Friend request accepted"}), 200


# Ruta za pretragu korisnika
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
        } for user in search_results
    ]

    return jsonify(result), 200

@users_bp.route('/', methods=['GET'])
def get_all_users():
    db = next(get_db())
    user_session = session.get('user')
    print(f"Session data: {user_session}")  # Debug ispis sesije

    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    current_user_id = user_session['id']
    users = db.query(User).filter(User.id != current_user_id).all()
    result = [{'id': user.id, 'username': user.username, 'name':user.first_name + " " + user.last_name, 'email':user.email, 'city':user.city, 'country':user.country, 'profileImage':'profileImage.jpg'} for user in users]
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

    # Prevent sending friend request to self
    if sender_id == receiver_id:
        return jsonify({'error': 'Cannot send friend request to yourself'}), 400

    # Check if the friendship already exists
    existing_friendship = db.query(Friendship).filter(
        (Friendship.user1_id == sender_id) & (Friendship.user2_id == receiver_id) |
        (Friendship.user1_id == receiver_id) & (Friendship.user2_id == sender_id)
    ).first()

    if existing_friendship:
        return jsonify({'error': 'Friendship request already exists or is already accepted'}), 400

    # Create a new friend request
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
    Accepts a friend request.
    """
    db = next(get_db())

    user_session = session.get('user')
    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401
    
    user_id = user_session['id']
    data = request.get_json()
    friend_request_id = data.get('request_id')

    if not friend_request_id:
        return jsonify({'error': 'Friend request ID is required'}), 400

    # Find the friendship request by its ID
    friend_request = db.query(Friendship).filter_by(id=friend_request_id, user2_id=user_id, status='pending').first()

    if not friend_request:
        return jsonify({'error': 'Friend request not found or already accepted'}), 404

    # Update the friendship status to 'accepted'
    friend_request.status = 'accepted'
    db.commit()

    return jsonify({'message': 'Friend request accepted successfully'}), 200

@users_bp.route('/reject-friend-request', methods=['POST'])
def reject_friend_request():
    """
    Odbija prijateljski zahtev.
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
        return jsonify({'error': 'Unauthorized action'}), 403  # Samo primalac može odbiti zahtev

    friend_request.status = 'rejected'
    db.commit()

    return jsonify({'message': 'Friend request rejected successfully'}), 200

@users_bp.route('/friend-requests', methods=['GET'])
def get_friend_requests():
    """
    GET: Vraća sve zahteve za prijateljstvo trenutnog korisnika (koji čekaju na odobrenje).
    """
    db = next(get_db())
    
    user_session = session.get('user')
    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    current_user_id = user_session['id']

    requests = db.query(Friendship).filter(
        (Friendship.user2_id == current_user_id) &  # Zahtevi koji su poslati tebi
        (Friendship.status == 'pending')  # Status "pending"
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
                'profileImage': "userimage.jpg"  # Ako koristiš sliku profila
            })

    return jsonify(result), 200

"""
#Ruta za ažuriranje korisnika prema korisničkom imenu
@users_bp.route('/<username>', methods=['PUT'])
def update_user(username):
    data = request.get_json()
    users = load_users()

    user = next((u for u in users if u['username'] == username), None)
    if not user:
        return jsonify({'error': 'Korisnik nije pronađen'}), 404

    # Ažuriraj podatke osim korisničkog imena
    for key, value in data.items():
        if key != 'username':
            user[key] = value

    save_users(users)
    return jsonify({'message': 'Korisnik uspešno ažuriran'}), 200

# Ruta za brisanje korisnika prema korisničkom imenu
@users_bp.route('/<username>', methods=['DELETE'])
def delete_user(username):
    users = load_users()

    updated_users = [u for u in users if u['username'] != username]
    if len(updated_users) == len(users):
        return jsonify({'error': 'Korisnik nije pronađen'}), 404

    save_users(updated_users)
    return jsonify({'message': 'Korisnik uspešno obrisan'}), 200
"""

@users_bp.route('/blocked', methods=['GET'])
def get_blocked_users():
    """
    GET: Vraća listu blokiranih korisnika iz tabele users.
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
        })

    return jsonify(result), 200

@users_bp.route('/unblock/<int:user_id>', methods=['POST'])
def unblock_user(user_id):
    """
    POST: Odblokira korisnika po ID-u.
    """
    db = next(get_db())
    user = db.query(User).filter_by(id=user_id, is_blocked=True).first()

    if not user:
        return jsonify({'error': 'User not found or not blocked'}), 404

    # Postavljanje is_blocked na False
    user.is_blocked = False
    db.commit()
    return jsonify({'message': f'User {user.username} successfully unblocked'}), 200
