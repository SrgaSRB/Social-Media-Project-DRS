from flask import Blueprint, request, jsonify, session
from app.models import Message, SessionLocal
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
def get_conversaion(friend_id):
    user = session.get('user')
    if not user:
        return jsonify({'error' : 'User not logged in'}), 401
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

from flask import Blueprint, request, jsonify, session
from app.models import Message, SessionLocal
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
    
    # Emitovanje poruke putem Socket.IO za real-time ažuriranje (opciono)
    socketio.emit('new_message', {
        'id': new_msg.id,
        'sender_id': user_id,
        'receiver_id': receiver_id,
        'content': content,
        'timestamp': new_msg.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
        'status': new_msg.status
    }, broadcast=True)
    
    return jsonify({'message': 'Message sent successfully'}), 201
