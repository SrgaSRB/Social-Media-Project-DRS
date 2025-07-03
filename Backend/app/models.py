from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

Base = declarative_base() # Base class for ORM models

class Message(Base):
    __tablename__ = 'messages'
    id = Column(Integer, primary_key=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(TIMESTAMP, server_default=func.now())
    status = Column(String(20), default='sent')  # kasnije možeš da dodaješ 'delivered', 'read', itd.

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class Post(Base):
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True, autoincrement=True) # Post ID
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False) # User who created the post
    content = Column(Text, nullable=True) # Text of the post
    image_url = Column(String(255), nullable=True) # URL of the image
    status = Column(String(20), default='approved')  # 'pending', 'approved', 'rejected'
    rejection_reason = Column(Text, nullable=True)  # Reason for rejection
    created_at = Column(TIMESTAMP, server_default=func.now()) # Time of creation
    approved_by_admin = Column(Integer, ForeignKey('users.id'), nullable=True) # Admin who approved the post

    # Reations
    user = relationship("User", back_populates="posts", foreign_keys=[user_id]) # User who created the post
    admin = relationship("User", foreign_keys=[approved_by_admin], back_populates="approved_posts") # Admin who approved the post
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True) # User ID
    first_name = Column(String(50), nullable=False) # First name
    last_name = Column(String(50), nullable=False) # Last name
    address = Column(String(100)) # Binding address
    city = Column(String(50)) # City
    country = Column(String(50)) # Country
    phone_number = Column(String(15), nullable=False) # Phone number
    email = Column(String(100), unique=True, nullable=False) # Email
    username = Column(String(50), unique=True, nullable=False) # Username
    password = Column(String(255), nullable=False) # Password
    role = Column(String(20), default='user')  # 'admin' or 'user'
    is_blocked = Column(Boolean, default=False) # Is user blocked
    rejected_posts_count = Column(Integer, default=0) # Number of rejected posts
    created_at = Column(TIMESTAMP, server_default=func.now()) # Time of creation
    profile_picture_url = Column(String(255), default='defaultProfilePicture.svg') # URL of the profile picture

    # Relations
    posts = relationship("Post", back_populates="user", foreign_keys="[Post.user_id]", cascade="all, delete-orphan") # Posts created by the user
    approved_posts = relationship("Post", foreign_keys="[Post.approved_by_admin]", back_populates="admin", overlaps="admin") # Posts approved by the admin
    sent_requests = relationship("Friendship", foreign_keys="[Friendship.user1_id]", back_populates="sender") # Friend requests sent by the user
    received_requests = relationship("Friendship", foreign_keys="[Friendship.user2_id]", back_populates="receiver") # Friend requests received by the user
    liked_posts = relationship("PostLike", back_populates="user", cascade="all, delete-orphan")

class Friendship(Base):
    __tablename__ = 'friendships' 

    id = Column(Integer, primary_key=True, autoincrement=True) # Friendship ID
    user1_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False) # User 1 ID
    user2_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False) # User 2 ID
    status = Column(String(20), default='accepted')  # 'pending', 'accepted', 'rejected' 
    request_sent_by = Column(Integer, ForeignKey('users.id')) # User who sent the request

    sender = relationship("User", foreign_keys=[user1_id], back_populates="sent_requests") 
    receiver = relationship("User", foreign_keys=[user2_id], back_populates="received_requests") 

class PostLike(Base):
    __tablename__ = 'post_likes'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="liked_posts")
    post = relationship("Post", back_populates="likes")

class Comment(Base):
    __tablename__ = 'comments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User")
    post = relationship("Post", back_populates="comments")


DATABASE_URL_RENDER = "postgresql://drs_postgres:63CgcJb2GwEPOdU4UD1Hn7eBgGLMzEKA@dpg-ctol4al2ng1s73bjnla0-a.oregon-postgres.render.com:5432/drs_db_ewbp"
DATABASE_URL_VERCEL = "postgresql://neondb_owner:npg_v4q3ylkTYfmz@ep-orange-grass-a2jbllss-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL_VERCEL)
SessionLocal = sessionmaker(bind=engine)

Base.metadata.create_all(bind=engine)