from flask import Blueprint, request, jsonify, session
from app.models import Message, SessionLocal, Friendship, User
from app import socketio  # za real-time notifikacije, ako želiš
from flask_socketio import emit

messages_bp = Blueprint('messages', __name__, url_prefix='/api/messages')

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@messages_bp.route('/conversation/<int:friend_id>', methods=['GET'])
def get_conversation(friend_id):
    # Provera da li je korisnik ulogovan
    user = session.get('user')
    if not user:
        return jsonify({'error': 'User not logged in'}), 401
    user_id = user['id']
    
    db = next(get_db())
    msgs = db.query(Message).filter(
        ((Message.sender_id == user_id) & (Message.receiver_id == friend_id)) |
        ((Message.sender_id == friend_id) & (Message.receiver_id == user_id))
    ).order_by(Message.timestamp.asc()).all()
    
    result = []
    for m in msgs:
        result.append({
            'id': m.id,
            'sender_id': m.sender_id,
            'receiver_id': m.receiver_id,
            'content': m.content,
            'timestamp': m.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'status': m.status
        })
    return jsonify(result), 200

@messages_bp.route('/send', methods=['POST'])
def send_message():
    # Provera sesije
    user = session.get('user')
    if not user:
        return jsonify({'error': 'User not logged in'}), 401

    data = request.get_json()
    receiver_id = data.get('receiver_id')
    content = data.get('content')

    if not receiver_id or not content:
        return jsonify({'error': 'Receiver and content are required'}), 400

    user_id = user['id']
    db = next(get_db())
    new_msg = Message(sender_id=user_id, receiver_id=receiver_id, content=content, status='sent')
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    
    socketio.emit('new_message', {
        'id': new_msg.id,
        'sender_id': user_id,
        'receiver_id': receiver_id,
        'content': new_msg.content,
        'timestamp': new_msg.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
        'status': new_msg.status
    })
    
    return jsonify({
        'message': 'Message sent successfully',
        'msg': {
            'id': new_msg.id,
            'sender_id': user_id,
            'receiver_id': receiver_id,
            'content': new_msg.content,
            'timestamp': new_msg.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'status': new_msg.status
        }
    }), 201


@messages_bp.route('/friends', methods=['GET'])
def get_friends():
    # Provera da li je korisnik ulogovan
    user = session.get('user')
    if not user:
        return jsonify({'error': 'User not logged in'}), 401
    user_id = user['id']
    
    db = next(get_db())
    
    # Pronalazak svih prijateljstava gde je ulogovani korisnik učesnik i status je "accepted"
    friendships = db.query(Friendship).filter(
        ((Friendship.user1_id == user_id) | (Friendship.user2_id == user_id)) &
        (Friendship.status == 'accepted')
    ).all()
    
    friends = []
    for friendship in friendships:
        # Ako je ulogovani korisnik user1, prijatelj je user2, inače je prijatelj user1
        if friendship.user1_id == user_id:
            friend = db.query(User).filter_by(id=friendship.user2_id).first()
        else:
            friend = db.query(User).filter_by(id=friendship.user1_id).first()
        if friend:
            friends.append({
                'id': friend.id,
                'name': f"{friend.first_name} {friend.last_name}",
                'username': friend.username,
                'profileImage': friend.profile_picture_url
            })
    
    return jsonify(friends), 200