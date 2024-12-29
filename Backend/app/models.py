from sqlalchemy import Column, Integer, String, Boolean, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


class Post(Base):
    __tablename__ = 'posts'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    status = Column(String(20), default='approved')  # 'pending', 'approved', 'rejected'
    rejection_reason = Column(Text, nullable=True)  # Ako je post odbijen
    created_at = Column(TIMESTAMP, server_default=func.now())
    approved_by_admin = Column(Integer, ForeignKey('users.id'), nullable=True)  # Admin koji je odobrio/odbio

    # Relacije
    user = relationship("User", back_populates="posts", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[approved_by_admin])


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    address = Column(String(100))
    city = Column(String(50))
    country = Column(String(50))
    phone_number = Column(String(15), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default='user')  # 'admin' or 'user'
    is_blocked = Column(Boolean, default=False)
    rejected_posts_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relacije
    posts = relationship("Post", back_populates="user", foreign_keys="[Post.user_id]", cascade="all, delete-orphan")
    approved_posts = relationship("Post", foreign_keys="[Post.approved_by_admin]")
    sent_requests = relationship("Friendship", foreign_keys="[Friendship.user1_id]", back_populates="sender")
    received_requests = relationship("Friendship", foreign_keys="[Friendship.user2_id]", back_populates="receiver")


class Friendship(Base):
    __tablename__ = 'friendships'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user1_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    user2_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default='accepted')  # 'pending', 'accepted', 'rejected'
    request_sent_by = Column(Integer, ForeignKey('users.id'))

    # Relationships
    sender = relationship("User", foreign_keys=[user1_id], back_populates="sent_requests")
    receiver = relationship("User", foreign_keys=[user2_id], back_populates="received_requests")


# Konfiguracija baze
DATABASE_URL = "postgresql://postgres:ftn@postgres:5432/DRS"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Kreiraj tabele ako ne postoje
Base.metadata.create_all(bind=engine)
