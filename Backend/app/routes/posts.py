import os
from flask import Blueprint, request, jsonify, session, send_from_directory
from werkzeug.utils import secure_filename
from app.models import Post, User, Friendship, SessionLocal
from app import socketio
import uuid
import datetime
from flask_socketio import emit
from app.routes.emails import send_email_in_thread


def generate_unique_filename(filename):
    """
    Generiše jedinstveno ime fajla koristeći UUID.
    """
    ext = filename.rsplit('.', 1)[1].lower()
    return f"{uuid.uuid4().hex}.{ext}"


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
UPLOAD_FOLDER = os.path.abspath('./uploads')  # Apsolutna putanja do foldera za upload

posts_bp = Blueprint('posts', __name__, url_prefix='/api/posts')

def get_db():
    """
    Creates and manages a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def send_post_approval_email(post_id):
    try:
        # Povezivanje sa bazom podataka pomoću get_db() funkcije
        db= next(get_db())  # Uzimamo trenutnu sesiju za bazu

        # Dohvatanje postova i korisnika
        post = db.query(Post).filter_by(id=post_id).first()

        if post:
            user = db.query(User).filter_by(id=post.user_id).first()

            if user:
                user_email = user.email

                # Detalji emaila
                subject = "Vaš post je odobren"
                message = f"Vaš post sa ID {post_id} je odobren od strane administratora."

                # Fiksirani parametri za slanje emaila (Admin email)
                sender_email = "luka.zbucnovic@gmail.com"  # Ovdje je fiksiran email administratora
                sender_password = "jndx ishq rgsd ehnb"  # Koristi aplikacijsku lozinku ako koristiš Gmail
                smtp_server = "smtp.gmail.com"
                smtp_port = 587

                send_email_in_thread(sender_email,sender_password,user_email,subject,message,smtp_server,smtp_port)

                return jsonify({"message": "Email poslat korisniku."}), 200
            else:
                return jsonify({"error": "Korisnik nije pronađen."}), 404
        else:
            return jsonify({"error": "Post nije pronađen."}), 404
    except Exception:
        return jsonify({"error": "Došlo je do greške pri slanju emaila."}), 500
    
def send_post_rejection_email(post_id: int):
    db= next(get_db())
    
    try:
        # Dohvati post i korisnika koji je kreirao post
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            return jsonify({"error": "Post nije pronađen."}), 404
        
        user = db.query(User).filter(User.id == post.user_id).first()
        if not user:
            return jsonify({"error": "Korisnik koji je kreirao post nije pronađen."}), 404
        
        # Detalji email-a
        subject = "Vaš post je odbijen"
        message = f"Nažalost, vaš post sa ID {post_id} je odbijen od strane administratora. Razlog odbijanja: {post.rejection_reason if post.rejection_reason else 'Nema dodatnog objašnjenja.'}"

        # Parametri za slanje email-a
        sender_email = "luka.zbucnovic@gmail.com"  # Ovdje je fiksiran email administratora
        sender_password = "jndx ishq rgsd ehnb"  # Koristi aplikacijsku lozinku ako koristiš Gmail
        smtp_server = "smtp.gmail.com"
        smtp_port = 587

        send_email_in_thread(sender_email,sender_password,user.email,subject,message,smtp_server,smtp_port)
        
        block_user_if_rejected_posts_exceed_limit(user.id)

        return jsonify({"message": "Email o odbijanju poslat korisniku."}), 200

    except Exception:
        return jsonify({"error": "Došlo je do greške pri slanju email-a."}), 500
    
def block_user_if_rejected_posts_exceed_limit(user_id):
    
    db= next(get_db())
    
    try:
        # Prebrojavanje odbijenih objava korisnika
        rejected_posts_count = db.query(Post).filter_by(user_id=user_id, status='rejected').count()
        
        # Ažuriranje korisnika ako ima više od 3 odbijene objave
        if rejected_posts_count > 3:
            
            user = db.query(User).filter_by(id=user_id).first()
            
            if user:
                
                user.is_blocked = True
                db.commit()
                
                # Detalji email-a
                subject = "Blokirani ste"
                message = "Nažalost, zbog kršenja pravila naše zajednice (prekomeran broj odbijenih objava, preko 3) bili smo prinudjeni da Vam suspendujemo nalog na neko vreme (dok Vas admin ne nagradi za dobro vladanje)."

                # Parametri za slanje email-a
                sender_email = "luka.zbucnovic@gmail.com"  # Ovdje je fiksiran email administratora
                sender_password = "jndx ishq rgsd ehnb"  # Koristi aplikacijsku lozinku ako koristiš Gmail
                smtp_server = "smtp.gmail.com"
                smtp_port = 587

                send_email_in_thread(sender_email,sender_password,user.email,subject,message,smtp_server,smtp_port)
                
    except Exception:
        db.rollback()


@posts_bp.route('/friends-posts', methods=['GET'])
def friends_posts():
    """
    GET: Returns posts from friends with image file paths.
    """
    db = next(get_db())
    user_session = session.get('user')

    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    user_id = user_session['id']

    friends = db.query(Friendship).filter(
        (Friendship.user1_id == user_id) | (Friendship.user2_id == user_id),
        Friendship.status == 'accepted'
    ).all()

    friend_ids = set()
    for friend in friends:
        if friend.user1_id != user_id:
            friend_ids.add(friend.user1_id)
        if friend.user2_id != user_id:
            friend_ids.add(friend.user2_id)

    posts = db.query(Post).filter(
        Post.user_id.in_(friend_ids),
        Post.status == 'approved'
    ).order_by(Post.created_at.desc()).all()

    result = []
    for post in posts:
        image_path = f"{post.image_url}" if post.image_url else None
        if image_path:
            result.append({
                'id': post.id,
                'username': post.user.username,
                'profileImage': post.user.profile_picture_url,  
                'postImage': image_path,  
                'postText': post.content,
                'timeAgo': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            })
        else:
            result.append({
                'id': post.id,
                'username': post.user.username,
                'profileImage': post.user.profile_picture_url,  
                'postImage': None,  
                'postText': post.content,
                'timeAgo': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            })

    return jsonify(result), 200

@posts_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    """
    Dohvata sliku iz foldera uploads.
    """
    return send_from_directory(UPLOAD_FOLDER, filename)

@posts_bp.route('/user-posts', methods=['GET'])
def get_user_posts():
    """
    GET: Vraća sve objave trenutnog korisnika.
    """
    db = next(get_db())
    user_session = session.get('user')

    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    user_id = user_session['id']

    posts = db.query(Post).filter_by(user_id=user_id).order_by(Post.created_at.desc()).all()

    result = []
    for post in posts:
        image_path = f"{post.image_url}" if post.image_url else None
        result.append({
            'id': post.id,
            'content': post.content,
            'profileImage': post.user.profile_picture_url,  
            'image_url': image_path,
            'created_at': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'status': post.status
        })

    return jsonify(result), 200

@posts_bp.route('/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    """
    PUT: Izmeni objavu trenutnog korisnika.
    """
    db = next(get_db())
    user_session = session.get('user')

    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    user_id = user_session['id']
    post = db.query(Post).filter_by(id=post_id, user_id=user_id).first()

    if not post:
        return jsonify({'error': 'Post not found or unauthorized'}), 404

    content = request.form.get('content')
    if content is not None:
        post.content = content

    if 'image' in request.files:
        image = request.files['image']
        if allowed_file(image.filename):
            original_filename = secure_filename(image.filename)
            filename = generate_unique_filename(original_filename)
            upload_path = os.path.join(UPLOAD_FOLDER, filename)

            image.save(upload_path)

            if post.image_url:
                old_image_path = os.path.join(UPLOAD_FOLDER, post.image_url)
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)

            post.image_url = filename

    post.status = 'pending'

    db.commit()

    return jsonify({
        'id': post.id,
        'content': post.content,
        'image_url': post.image_url,
        'created_at': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'status': post.status
    }), 200

@posts_bp.route('/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    """
    DELETE: Briše objavu trenutnog korisnika.
    """
    db = next(get_db())
    user_session = session.get('user')

    if not user_session:
        return jsonify({'error': 'User not logged in'}), 401

    user_id = user_session['id']
    post = db.query(Post).filter_by(id=post_id, user_id=user_id).first()

    if not post:
        return jsonify({'error': 'Post not found or unauthorized'}), 404

    if post.image_url:
        image_path = os.path.join(UPLOAD_FOLDER, post.image_url)
        if os.path.exists(image_path):
            os.remove(image_path)

    db.delete(post)
    db.commit()

    return jsonify({'message': 'Objava je uspešno obrisana'}), 200

@posts_bp.route('/upload-post', methods=['POST'])
def upload_post():
    try:
        db = next(get_db())
        user_session = session.get('user')

        if not user_session:
            return jsonify({'error': 'User not logged in'}), 401

        user_id = user_session['id']

        text = request.form.get('text')
        if not text:
            return jsonify({'error': 'Text is required'}), 400

        image_file = request.files.get('image')
        image_filename = None

        if image_file and allowed_file(image_file.filename):
            original_filename = secure_filename(image_file.filename)
            image_filename = generate_unique_filename(original_filename)
            upload_path = os.path.join(UPLOAD_FOLDER, image_filename)

            image_file.save(upload_path)

        new_post = Post(
            user_id=user_id,
            content=text,
            image_url=image_filename,  # Samo ime fajla
            status='pending',
            created_at=datetime.datetime.utcnow()
        )

        db.add(new_post)
        db.commit()
        socketio.emit('new_pending_post', {
            'id': new_post.id,
            'username': user_session['username'],
            'content': new_post.content,
            'image_url': new_post.image_url,
            'created_at': new_post.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })

        return jsonify({
            'message': 'Post successfully created',
            'post': {
                'id': new_post.id,
                'content': new_post.content,
                'image_url': f"uploads/{new_post.image_url}" if new_post.image_url else None,
                'status': new_post.status,
                'created_at': new_post.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        }), 201
    except Exception as e:
        print(f"Error creating post: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500

@posts_bp.route('/<int:post_id>/approve', methods=['POST'])
def approve_post(post_id):
    """
    POST: Odobrava post.
    """
    db = next(get_db())
    user_session = session.get('user')

    if not user_session or user_session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    post = db.query(Post).filter_by(id=post_id).first()
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    post.status = 'approved'
    db.commit()
    
    return send_post_approval_email(post_id)

@posts_bp.route('/<int:post_id>/reject', methods=['POST'])
def reject_post(post_id):
    """
    POST: Odbija post postavljanjem statusa na 'rejected'.
    """
    db = next(get_db())
    user_session = session.get('user')

    if not user_session or user_session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    post = db.query(Post).filter_by(id=post_id).first()
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    post.status = 'rejected'
    db.commit()

    return send_post_rejection_email(post_id)


@posts_bp.route('/pending-posts', methods=['GET'])
def get_pending_posts():
    """
    GET: Vraća sve postove sa statusom 'pending'.
    """
    db = next(get_db())
    pending_posts = db.query(Post).filter_by(status='pending').all()

    result = []
    for post in pending_posts:
        result.append({
            'id': post.id,
            'username': post.user.username,
            'content': post.content,
            'image_url': post.image_url,
            'created_at': post.created_at.strftime('%Y-%m-%d %H:%M:%S')
        })

    return jsonify(result), 200
