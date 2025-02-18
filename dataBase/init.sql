-- Provera da li baza postoji i njeno kreiranje
DO
$$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_database
        WHERE datname = 'DRS'
    ) THEN
        PERFORM dblink_exec('dbname=postgres', 'CREATE DATABASE "DRS"');
    END IF;
END
$$;

-- Tabela za korisnike
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    address VARCHAR(100),
    city VARCHAR(50),
    country VARCHAR(50),
    phone_number VARCHAR(15),
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'admin' or 'user'
    is_blocked BOOLEAN DEFAULT FALSE,
    rejected_posts_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_picture_url VARCHAR(255) DEFAULT 'defaultProfilePicture.svg'
);

-- Tabela za prijateljstva
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user1_id INT REFERENCES users(id) ON DELETE CASCADE,
    user2_id INT REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'accepted', -- 'pending', 'accepted', 'rejected'
    request_sent_by INT REFERENCES users(id)
);

-- Tabela za objave
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    image_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
    rejection_reason TEXT, -- If the post is rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by_admin INT REFERENCES users(id) -- Admin who approved/rejected
);

-- Inicijalni korisnici
INSERT INTO users (first_name, last_name, address, city, country, phone_number, email, username, password, role)
VALUES
    ('Admin', 'Adminovic', 'Admin Address', 'Admin City', 'Country', '123-456', 'admin@example.com', 'admin', 'adminpassword', 'admin'),
    ('User1', 'Testovic', 'User1 Address', 'User1 City', 'Country', '111-111', 'user1@example.com', 'user1', 'user1password', 'user'),
    ('User2', 'Testovic', 'User2 Address', 'User2 City', 'Country', '222-222', 'user2@example.com', 'user2', 'user2password', 'user');

-- Prijateljstvo između User1 i User2
INSERT INTO friendships (user1_id, user2_id, status, request_sent_by)
VALUES
    (2, 3, 'accepted', 2);

-- Objave korisnika
INSERT INTO posts (user_id, content, image_url, status, approved_by_admin)
VALUES
    (2, 'First post from User1', 'photo1.jpg', 'approved', 1),
    (2, 'Second post from User1', 'photo2.jpg', 'approved', 1),
    (3, 'First post from User2', 'photo3.jpg', 'approved', 1),
    (3, 'Second post from User2', 'photo4.jpg', 'approved', 1),
    (3, 'Third post from User2', 'photo5.jpg', 'approved', 1);

    
-- Provera unosa
SELECT * FROM users;
SELECT * FROM friendships;
SELECT * FROM posts;
