import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../notification/NotificationContext';
import ModalImage from './ModalImage';

const loadCSS = (href: string) => {
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.getAttribute('href') !== href) {
      link.remove();
    }
  });

  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (!existingLink) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = "/styles/notification.css";
  document.head.appendChild(link);

  {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = "/styles/extern.css";
    document.head.appendChild(link);
  }

};

interface Post {
  id: number;
  username: string;
  profileImage: string;
  postImage: string;
  postText: string;
  timeAgo: string;
}

const Index: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL; // URL from environment variable
  const { showNotification } = useNotification();
  const location = useLocation();
  const [hasNotification, setHasNotification] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalAltText, setModalAltText] = useState('');

  useEffect(() => {
    setIsLoading(true);
    loadCSS('/styles/index.css');

    const checkSession = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/auth/session`, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!data.user) {
          // Redirect the user to login if not logged in
          navigate('/login');
        } else {
          fetchPosts();
        }
      } catch (error) {
        console.error('Error while checking session:', error);
        navigate('/login'); // Redirect to login in case of error
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/posts/friends-posts`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch posts. Please try again.');
        }

        const data: Post[] = await response.json();
        setPosts(data);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
        if (!hasNotification && location.state?.message) {
          const { message, type } = location.state;
          showNotification(type, message);
          setHasNotification(true);
        }
      }
    };

    checkSession();
  }, [navigate, hasNotification, location.state]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchTerm = (document.getElementById('name') as HTMLInputElement)?.value || '';
    navigate('/user-search', { state: { searchTerm } });
  };

  const handleImageClick = (imageUrl: string, altText: string) => {
    setModalImageUrl(imageUrl);
    setModalAltText(altText);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <HelmetProvider>
        <Helmet>
          <style>
            {`
              .preloader {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-size: 24px;
                background-color: #f5f5f5;
                color: #333;
                font-family: Arial, sans-serif;
              }
              
              .spinner {
                border: 8px solid #f3f3f3;
                border-top: 8px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
              }
              
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>
        </Helmet>
        <div className="preloader">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      </HelmetProvider>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <>
    <div className="body">
      <section className="hero-section">
        <div className="w-layout-blockcontainer container hero-container w-container">
          <div className="form-block w-form">
            <form id="users-search" className="form" onSubmit={handleSearchSubmit}>
              <img
                src="\assets\Icons\search.svg"
                loading="lazy"
                alt="Search"
                className="image"
              />
              <div className="search-div">
                <input
                  className="search-input w-input"
                  maxLength={256}
                  name="name"
                  placeholder="Search for friends"
                  type="text"
                  id="name"
                />
                <div className="text-block">
                  <img src="\assets\Icons\x-02.svg" alt="" />
                </div>
              </div>
              <input type="submit" className="search-button w-button" value="Search" id="search-user-btn" />
            </form>
          </div>
          <div className="posts-div">
            {posts.map((post) => (
              <div key={post.id} className="user-post">
                <div className="user-post-image">
                  {post.postImage ? (
                    <img
                      src={`${backendUrl}/api/posts/uploads/${post.postImage}`}
                      alt={post.postImage}
                      className="image-5"
                      onClick={() =>
                        handleImageClick(
                          `${backendUrl}/api/posts/uploads/${post.postImage}`,
                          post.postImage
                        )
                      }
                    />
                  ) : (
                    <span className="image-placeholder">No Image Available</span>
                  )}
                </div>
                <div className="user-post-user-info">
                  <div className="user-post-user-info-image-and-name">
                    <div className="user-post-user-info-profile-image">
                      <img
                        src={
                          post.profileImage === "defaultProfilePicture.svg"
                            ? "/assets/Icons/defaultProfilePicture.svg" 
                            : `${backendUrl}/api/posts/uploads/${post.profileImage}` 
                        }
                        alt="Profile"
                        className="image-4"
                      />
                    </div>
                    <div className="user-post-user-info-name-and-date">
                      <div className="user-post-user-info-name">
                        @{<span className="text-span">{post.username}</span>}
                      </div>
                      <div className="user-post-user-info-date">{post.timeAgo}</div>
                    </div>
                  </div>
                  <div className="post-hr"></div>
                  <div className="user-post-text">
                    <div className="text-block-2">{post.postText}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>

    {isModalOpen && (
        <ModalImage
          imageUrl={modalImageUrl}
          altText={modalAltText}
          onClose={handleCloseModal}
        />
      )}
    
    </>

  );
};

export default Index;