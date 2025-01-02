import React, { useEffect, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useNotification } from '../notification/NotificationContext';


interface BlockedUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  profileImage?: string; // Optional property
}

interface User {
  username: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  password: string;
  profileImage?: string; // Optional property
}

interface Post {
  id: number;
  username: string;
  content: string;
  image_url?: string; // Optional property
  profileImage?: string; // Optional property
  created_at: string;
}


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
};

const UserProfile: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<'admin' | 'user'>('user'); // Default user type
  const [posts, setPosts] = useState<any[]>([]);
  const [createdposts, setCreatedPosts] = useState<any[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<any>(null);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const backendUrl = process.env.REACT_APP_BACKEND_URL; // URL iz environment varijable
  const { showNotification } = useNotification();

  //const [activeSection, setActiveSection] = useState<string>('profile');


  const navigate = useNavigate();
  const socket = io(`${backendUrl}`);

  /*
    useEffect(() => {
      // Funkcija koja menja hash u URL-u kad korisnik skroluje
      const handleScroll = () => {
        const sections = document.querySelectorAll("section");
        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          const id = section.getAttribute("id");
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            if (id && window.location.hash !== `#${id}`) {
              window.location.hash = `#${id}`; // Postavi novi hash u URL
            }
          }
        });
      };
  
      window.addEventListener('scroll', handleScroll);
  
      return () => {
        window.removeEventListener('scroll', handleScroll); // Clean up listener
      };
    }, []);
  
    useEffect(() => {
      // Kada se hash promeni u URL-u, ažuriraj aktivnu sekciju
      const handleLocationChange = () => {
        const hash = window.location.hash;
        if (hash === '#hero-section') {
          setActiveSection('profile');
        } else if (hash === '#admin-section') {
          setActiveSection('posts');
        } else if (hash === '#admin-section-blocked-users') {
          setActiveSection('blockedUsers');
        } else {
          setActiveSection('profile'); // Defaultna sekcija ako nema odgovarajućeg hash-a
        }
  
        // Pomeri sekciju u prikaz sa scrollIntoView
        const targetSection = document.querySelector(hash);
        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: "smooth", // Pomeri glatko do sekcije
            block: "start", // Početak sekcije treba biti na vrhu ekrana
          });
        }
      };
  
      // Pozovi funkciju odmah da bi postavio početnu sekciju
      handleLocationChange();
  
      // Čitaj promene u hash-u
      window.addEventListener("hashchange", handleLocationChange);
  
      return () => {
        window.removeEventListener("hashchange", handleLocationChange); // Clean up listener
      };
    }, []);
  */

  useEffect(() => {
    loadCSS('/styles/profile.css');
    setIsLoading(true);

    // Testiranje prijema događaja
    socket.on('new_pending_post', (data) => {
      //setPendingPosts((prevPosts) => [...prevPosts, data]);
      console.log('Received new pending post:', data);
    });

    //Blocked users list
    const fetchBlockedUsers = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/users/blocked`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch blocked users');
        }

        const data = await response.json();
        setBlockedUsers(data);
      } catch (error) {
        console.error('Error fetching blocked users:', error);
      }
    };

    //check is session empty
    const checkSession = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/auth/session`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();

        if (!data.user) {
          navigate('/login'); // Preusmerava na stranicu za prijavu
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        navigate('/login'); // Preusmerava na stranicu za prijavu u slučaju greške
      }
    };

    //User posts list
    const fetchUserPosts = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/posts/user-posts`, {
          method: 'GET',
          credentials: 'include', // Neophodno za sesiju
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user posts');
        }

        const data = await response.json();
        setPosts(data); // Postavi objave u stanje
      } catch (error) {
        console.error('Error fetching user posts:', error);
      }
    };

    fetch(`${backendUrl}/api/auth/session`, {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        const { user } = data;
        setUserType(user?.role || 'user');
        setUserData(user); // Postavi korisničke podatke
      })
      .catch((error) => {
        console.error('Error fetching session:', error);
        setUserType('user');
      });

    fetchUserPosts();
    checkSession();
    if (userType === 'admin') {
      fetchPendingPosts();
      fetchBlockedUsers();
    }

    setIsLoading(false);

    return () => {
      socket.disconnect();
    };
  }, [userType]);


  const handleEditPost = (post: any) => {
    setCurrentPost(post);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setCurrentPost(null);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (userData) {
      setUserData({ ...userData, [name]: value });
    }
  };


  const fetchPendingPosts = async () => {
    fetch(`${backendUrl}/api/posts/pending-posts`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json', // Recite serveru da očekujete JSON odgovor
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch pending posts');
        }
        return response.json();
      })
      .then((data) => setPendingPosts(data))
      .catch((error) => console.error('Error fetching pending posts:', error));



    // Listen for new pending posts via WebSocket
    socket.on('new_pending_post', (post) => {
      setPendingPosts((prevPosts) => [...prevPosts, post]);
    });
  };

  const handleDeletePost = async (postId: number) => {
    const confirmDelete = window.confirm('Da li ste sigurni da želite da obrišete ovu objavu?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${backendUrl}/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include', // Omogućava slanje kolačića sa sesijom
      });

      if (!response.ok) {
        throw new Error('Brisanje objave nije uspelo');
      }

      // Uklanjanje posta iz lokalnog stanja
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

      showNotification('success', 'Objava je uspešno obrisana.');
    } catch (error) {
      console.error('Greška prilikom brisanja objave:', error);
      showNotification('warning', 'Došlo je do greške prilikom brisanja objave.');
    }
  };

  const handleSaveChanges = async (updatedPost: any) => {
    const formData = new FormData();
    formData.append('content', updatedPost.content);
    if (updatedPost.newImage) {
      formData.append('image', updatedPost.newImage);
    }

    try {
      const response = await fetch(`${backendUrl}/api/posts/${updatedPost.id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      const updatedData = await response.json();
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post.id === updatedData.id ? updatedData : post))
      );
      handleCloseModal();
      showNotification('success', 'Objava je uspešno izmenjena i poslana na odobravanje.');
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`${backendUrl}/api/auth/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include', // Omogućava slanje kolačića sa sesijom
      });

      if (response.ok) {
        showNotification('success', 'Profil je uspešno ažuriran.');
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.error || 'Došlo je do greške prilikom ažuriranja profila.');
      }
    } catch (error) {
      showNotification('error', 'Greška pri povezivanju sa serverom.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprovePost = async (postId: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/posts/${postId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        showNotification('success', 'Post je odobren.');
      } else {
        showNotification('error', 'Došlo je do greške prilikom odobravanja.');
      }
    } catch (error) {
      showNotification('error', 'Greška pri povezivanju sa serverom.');
      console.error('Error approving post:', error);
    }
  };

  const handleRejectPost = async (postId: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/posts/${postId}/reject`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        showNotification('success', 'Post je odbijen.');
      } else {
        showNotification('error', 'Došlo je do greške prilikom odbijanja.');
      }
    } catch (error) {
      showNotification('error', 'Greška pri povezivanju sa serverom.');
      console.error('Error rejecting post:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies for session
      });

      if (response.ok) {
        showNotification('success', 'Uspešno ste se izlogovali.');
        // Resetuj korisničko stanje i redirektuj na login stranicu
        setUserData(null);
        setUserType('user');
        window.location.href = '/login'; // Prilagodite putanju stranici za prijavu
      } else {
        showNotification('error', 'Došlo je do greške prilikom odjave. Pokušajte ponovo.');
      }
    } catch (error) {
      console.error('Greška prilikom odjave:', error);
      showNotification('error', 'Greška pri povezivanju sa serverom.');
    }
  };

  const handleUnblock = async (userId: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/users/unblock/${userId}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to unblock user');
      }

      setBlockedUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userId)
      );

      showNotification('success', 'Korisnik je uspešno odblokiran.');
    } catch (error) {
      console.error('Error unblocking user:', error);
      showNotification('error', 'Greška pri povezivanju sa serverom.');
    }
  };


  if (isLoading) {
    return (
      <HelmetProvider>
        <Helmet>
          <style>{`
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
          `}</style>
        </Helmet>
        <div className="preloader">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      </HelmetProvider>
    );
  }

  return (
    <div className="body">
      {isEditModalOpen && (
        <section className="edit-post-section">
          <div className="w-layout-blockcontainer container edit-post-container w-container">
            <div className="edit-post-block">
              <div className="edit-post-image-and-text-block">
                <div className="edit-post-image-block">
                  <div className="text-block-8">
                    Slika <span className="text-span-3">(opciono)</span>
                  </div>
                  <div className="edit-post-image">
                    {currentPost?.image_url || currentPost?.newImage ? (
                      <>
                        <img
                          id="post-photo"
                          src={
                            currentPost?.newImage
                              ? URL.createObjectURL(currentPost.newImage)
                              : `${backendUrl}/api/posts/uploads/${currentPost.image_url}`
                          }
                          alt="Post"
                          className="image-11"
                        />
                        <a
                          href="#"
                          id="remove-picture"
                          className="link-block-4 w-inline-block"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPost({ ...currentPost, image_url: null, newImage: null });
                          }}
                        >
                          <div>X</div>
                        </a>
                      </>
                    ) : (
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCurrentPost({ ...currentPost, newImage: file });
                          }
                        }}
                      />
                    )}
                  </div>

                </div>
                <div className="edit-post-text">
                  <div className="text-block-9">Tekst objave:</div>
                  <textarea
                    id="post-text"
                    value={currentPost?.content || ''}
                    onChange={(e) =>
                      setCurrentPost({ ...currentPost, content: e.target.value })
                    }
                    style={{ maxWidth: '100%' }}
                  />
                </div>
              </div>
              <div className="edit-post-buttons">
                <a
                  href="#"
                  id="cancel"
                  className="link-block-5 w-inline-block"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCloseModal();
                  }}
                >
                  <div>Odustani</div>
                </a>
                <a
                  href="#"
                  id="edit"
                  className="link-block-5 w-inline-block"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveChanges(currentPost);
                  }}
                >
                  <div>Izmeni</div>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}


      <section id='hero-section' className="hero-section">
        <div className="w-layout-blockcontainer container hero-container w-container">
          <div className="user-info">
            <form id="email-form" className="form" onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              <div className="user-image">
                <img
                  src={`assets/Icons/${userData?.profileImage}`}
                  alt="" className="image-4" />
                <div className="text-block-6">@{userData?.username || ''}</div>
                <div className="div-block-4">
                  <a
                    href="#"
                    className="link-block-2 w-inline-block"
                    onClick={handleLogout}
                  >
                    <div>Izloguj se</div>
                    <img
                      src="\assets\Icons\logout.svg"
                      loading="lazy"
                      alt="Logout"
                    />
                  </a>
                </div>
              </div>
              <label htmlFor="username" className="user-info-label">Korisničko ime</label>
              <input
                className="user-info-input w-input"
                name="username"
                id="username"
                value={userData?.username || ''} // Vraća prazan string ako je userData null
                disabled={isSaving} // Disable while saving
              />
              <label htmlFor="firstName" className="user-info-label">Ime</label>
              <input
                className="user-info-input w-input"
                name="firstName"
                id="firstName"
                value={userData?.firstName || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="lastName" className="user-info-label">Prezime</label>
              <input
                className="user-info-input w-input"
                name="lastName"
                id="lastName"
                value={userData?.lastName || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="address" className="user-info-label">Adresa</label>
              <input
                className="user-info-input w-input"
                name="address"
                id="address"
                value={userData?.address || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="city" className="user-info-label">Grad</label>
              <input
                className="user-info-input w-input"
                name="city"
                id="city"
                value={userData?.city || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="country" className="user-info-label">Država</label>
              <input
                className="user-info-input w-input"
                name="country"
                id="country"
                value={userData?.country || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="phone" className="user-info-label">Broj telefona</label>
              <input
                className="user-info-input w-input"
                name="phone"
                id="phone"
                value={userData?.phone || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="email" className="user-info-label">Email</label>
              <input
                className="user-info-input w-input"
                name="email"
                id="email"
                value={userData?.email || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="password" className="user-info-label">Lozinka</label>
              <input
                className="user-info-input w-input"
                name="password"
                id="password"
                type="password"
                value={userData?.password || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <input
                type="submit"
                className="submit-button w-button"
                value={isSaving ? 'Čuvanje...' : 'Izmeni profil'}
                disabled={isSaving}
              />
            </form>
          </div>
          <div className="container-hr"></div>
          <div className="user-posts-block">
            <div className="div-block">
              <div>Objave</div>
              <img
                src="/assets/Icons/9-square.svg"
                alt="Grid"
                className="image-5"
              />
            </div>
            <div className="user-posts">
              {posts.length > 0 ? (
                posts.map((post, index) => (
                  <div className={`user-post ${post.status === 'pending' ? 'pending-post' : ''}`} key={index}>
                    {post.status === 'pending' && (
                      <>
                        <div className="user-post-padding-image-div">
                          <img src="/assets/Icons/alert-triangle.svg" loading="lazy" alt="" className="image-12" />
                          <div className="text-block-10">Post je na čekanju.</div>
                        </div>

                        <div className="div-block-5"></div>
                      </>
                    )}
                    {post.status === 'rejected' && (
                      <>
                        <div className="user-postreject-div"></div>
                        <div className="user-post-padding-image-div">
                          <img src="\assets\Icons\alert-triangle-RED.svg" loading="lazy" alt="" className="image-12" />
                          <div className="text-block-11">Post je odbijen!</div>
                        </div>
                      </>
                    )}
                    <div className="user-post-image-div">
                      {post.image_url ? (
                        <img
                          src={`${backendUrl}/api/posts/uploads/${post.image_url}`} 
                          alt={post.postImage} 
                          className="image"
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="user-post-info">
                      <div className="user-post-profile-image">
                        <img
                          src=
                          {
                            post.profileImage === "defaultProfilePicture.png"
                              ? "/assets/Icons/defaultProfilePicture.svg" 
                              : `${backendUrl}/api/posts/uploads/${post.profileImage}` 
                          }
                          alt="Profile"
                          className="image-15"
                        />
                      </div>
                      <div className="user-post-info-name-and-date">
                        <div className="user-post-info-name">
                          <div className="text-block">@{userData?.username || ''}</div>
                        </div>
                        <div className="user-post-info-date">
                          <div className="text-block-2">{new Date(post.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                    <div className="user-info-hr"></div>
                    <div className="user-post-text">
                      <div>{post.content}</div>
                    </div>
                    <div className="user-post-remove-and-edit-div">
                      <div className="user-post-edit" onClick={() => handleEditPost(post)}>
                        <img
                          src="\assets\Icons\edit.svg"
                          alt="Edit"
                        />
                        <div>Izmeni</div>
                      </div>
                      <div className="user-post-remove" onClick={() => handleDeletePost(post.id)}>
                        <img
                          src="/assets/Icons/trash.svg"
                          alt="Delete"
                        />
                        <div>Obriši</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div>No posts available</div>
              )}
            </div>


          </div>
        </div>
      </section>

      {userType === 'admin' && (
        <>

          <div className="body-hr">
            <div className="w-layout-blockcontainer container body-hr-container w-container"></div>
          </div>
          <section id='admin-section' className="admin-section">
            <div className="w-layout-blockcontainer container admin-container w-container">
              <div className="div-block-3">
                <div className="text-block-5">Kreirane objave</div>
              </div>
              <div className="created-posts">

                {pendingPosts.length > 0 ? (
                  pendingPosts.map((post) => (
                    <div className="created-post-block" key={post.id}>
                      <div className="created-post">
                        <div className="image-div">
                          {post.image_url ? (
                            <img
                              id="created-post-image"
                              src={`${backendUrl}/api/posts/uploads/${post.image_url}`}
                              alt="Post"
                              className="image-7"
                            />
                          ) : (
                            <div>No Image</div>
                          )}
                        </div>
                        <div className="created-post-user-info">
                          <div className="created-post-user-info-block">
                            <div className="div-block-2">
                              <img
                                src=
                                {
                                  post.profileImage === "defaultProfilePicture.svg"
                                    ? "/assets/Icons/defaultProfilePicture.svg" // Putanja do lokalnog fajla
                                    : `${backendUrl}/api/posts/uploads/${post.profileImage}` // Putanja ka serveru
                                }
                                alt="User Profile"
                                className="image-6"
                              />
                            </div>
                            <div>
                              <div className="text-block-4">
                                @{post.username}
                              </div>
                              <div className="text-block-3">{new Date(post.created_at).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="created-post-hr"></div>
                          <div className="created-post-info-div">
                            <div id="created-post-desc" className="created-post-info">
                              {post.content}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="approval-dissapproval-block">
                        <a
                          href="#"
                          id="created-post-accept"
                          className="link-block approve-linkblock w-inline-block"
                          onClick={(e) => {
                            e.preventDefault();
                            handleApprovePost(post.id);
                          }}
                        >
                          <div>Odobri</div>
                          <img
                            src="/assets/Icons/success-GREEN.svg"
                            alt="Approve"
                            className="image-8"
                          />
                        </a>
                        <a
                          href="#"
                          id="created-post-reject"
                          className="link-block dissapproval-linkblock w-inline-block"
                          onClick={(e) => {
                            e.preventDefault();
                            handleRejectPost(post.id);
                          }}
                        >
                          <div>Odbij</div>
                          <img
                            src="\assets\Icons\reject-request-RED.svg"
                            alt="Reject"
                            className="image-9"
                          />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (<div>No pending posts</div>)}
              </div>

            </div>
          </section>
          <div className="body-hr">
            <div className="w-layout-blockcontainer container body-hr-container w-container"></div>
          </div>
          <section id='admin-section-blocked-users' className="admin-section-blocked-users">
            <div className="w-layout-blockcontainer container blocked-users-container w-container">
              <div className="blocked-users-header">
                <h2 className="heading">Blokirani korisnici</h2>
              </div>
              <div className="blocked-blocked-users-list">
                {blockedUsers.length > 0 ? (
                  blockedUsers.map((user) => (
                    <div className="blocked-user-block" key={user.id}>
                      <div className="blocked-user-info">
                        <div className="blocked-user-image">
                          <img
                            src=
                            {
                              user.profileImage === "defaultProfilePicture.svg"
                                ? "/assets/Icons/defaultProfilePicture.svg" // Putanja do lokalnog fajla
                                : `${backendUrl}/api/posts/uploads/${user.profileImage}` // Putanja ka serveru
                            }
                            alt="Profile"
                            className="image-10"
                          />
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">Username</div>
                          <div className="info-bottom-text">@{user.username}</div>
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">Ime</div>
                          <div className="info-bottom-text">{user.firstName}</div>
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">Prezime</div>
                          <div className="info-bottom-text">{user.lastName}</div>
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">Grad</div>
                          <div className="info-bottom-text">{user.city}</div>
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">Država</div>
                          <div className="info-bottom-text">{user.country}</div>
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">Broj telefona</div>
                          <div className="info-bottom-text">{user.phone}</div>
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">Email</div>
                          <div className="info-bottom-text">{user.email}</div>
                        </div>
                        <a
                          href="#"
                          className="link-block-3 w-inline-block"
                          onClick={() => handleUnblock(user.id)}
                        >
                          <div className="text-block-7">Odblokiraj korisnika</div>
                        </a>
                      </div>
                      <div className="blocked-user-hr"></div>
                    </div>
                  ))
                ) : (
                  <div>No blocked users</div>
                )}
              </div>
            </div>
          </section>
          {/*
          <div className="admin-navbar">
          <a
          href="#hero-section"
          className={`admin-navbar-section ${activeSection === "profile" ? "admin-navbar-current-section" : ""}`}
          >
          Korisnički profil
          </a>
          <a
          href="#admin-section"
          className={`admin-navbar-section ${activeSection === "posts" ? "admin-navbar-current-section" : ""}`}
          >
          Kreirane objave
          </a>
          <a
          href="#admin-section-blocked-users"
          className={`admin-navbar-section ${activeSection === "blockedUsers" ? "admin-navbar-current-section" : ""}`}
          >
          Blokirani korisnici
          </a>
          <a href="#registration" className="admin-navbar-section">
          Registracija korisnika
          </a>
          </div>
          */}
        </>
      )}
    </div>
  );
};

export default UserProfile;
