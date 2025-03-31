import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../notification/NotificationContext';
import ModalImage from './ModalImage';
import Loader from "../components/Loader";
import Post from "../components/Post";

const loadCSS = (hrefs: string[]) => {
  // Brišemo sve postojeće <link rel="stylesheet"> elemente iz <head>
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    link.remove();
  });

  hrefs.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
};

interface Post {
  id: number;
  username: string;
  profileImage: string;
  postImage: string;
  postText: string;
  timeAgo: string;
  isLiked: boolean;
  likeCount: number;
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
        if (!hasNotification && location.state?.message) {
          const { message, type } = location.state;
          showNotification(type, message);
          setHasNotification(true);
        }
        setIsLoading(false);
      }
    };

    checkSession();
  }, [navigate, hasNotification, location.state]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchTerm = (document.getElementById('name') as HTMLInputElement)?.value || '';
    navigate('/search', { state: { searchTerm } });
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
    return <Loader />;
  }

  const handleLikeToggle = async (postId: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/posts/like/${postId}`, {
        method: "POST",
        credentials: "include",
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log("Post liked/unliked successfully:", data);
        // Ažuriraj lokalno stanje posta
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: data.liked,
                  likeCount: data.like_count,
                }
              : post
          )
        );
      } else {
        console.error("Greška:", data.error || data.message);
      }
    } catch (err) {
      console.error("Greška pri lajkovanju posta:", err);
    }
  };
  

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
                <Post
                  key={post.id}
                  id={post.id}
                  username={post.username}
                  profileImage={post.profileImage}
                  postImage={post.postImage}
                  postText={post.postText}
                  timeAgo={post.timeAgo}
                  backendUrl={backendUrl!}
                  onImageClick={handleImageClick}
                  isLiked={post.isLiked}
                  likeCount={post.likeCount}
                  onLikeToggle={handleLikeToggle}
                />
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