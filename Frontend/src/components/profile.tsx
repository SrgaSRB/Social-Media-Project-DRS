import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useNotification } from '../notification/NotificationContext';
import Loader from "../components/Loader";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop"; // Importuj tipove za croppedArea i croppedAreaPixels


const loadCSS = (hrefs: string[]) => {
  // Brišemo sve postojeće <link rel="stylesheet"> elemente iz <head>
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    link.remove();
  });

  // Dodajemo nove CSS fajlove
  hrefs.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
};

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

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);

  //For changing profile photo
  const [isPhotoSettingsOpen, setIsPhotoSettingsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


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
    setIsLoading(true);

    loadCSS([
      '/styles/profile.css',
      '/styles/notification.css',
      '/styles/navbar.css'
    ]);

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
        showNotification("error", 'Error fetching blocked users:' + error);
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
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        navigate('/login');
      }
    };

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
        setPosts(data);
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
        setUserData(user);
      })
      .catch((error) => {
        console.error('Error fetching session:', error);
        setUserType('user');
      })
      .finally(() => setIsLoading(false));

    fetchUserPosts();
    checkSession();
    if (userType === 'admin') {
      fetchPendingPosts();
      fetchBlockedUsers();
    }


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
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${backendUrl}/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include', // Omogućava slanje kolačića sa sesijom
      });

      if (!response.ok) {
        throw new Error('Failed to delete the post');
      }

      // Uklanjanje posta iz lokalnog stanja
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));

      showNotification('success', 'The post was successfully deleted.');
    } catch (error) {
      console.error('Error deleting post:', error);
      showNotification('warning', 'An error occurred while deleting the post.');
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
      showNotification('success', 'The post was successfully updated and sent for approval.');
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
        showNotification('success', 'The profile was successfully updated.');
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.error || 'An error occurred while updating the profile.');
      }
    } catch (error) {
      showNotification('error', 'Error connecting to the server.');
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
        showNotification('success', 'The post was approved.');
      } else {
        showNotification('error', 'An error occurred while approving.');
      }
    } catch (error) {
      showNotification('error', 'Error connecting to the server.');
      console.error('Error approving post:', error);
    }
  };

  const handleRejectPost = (postId: number) => {
    setCurrentPostId(postId);
    setIsRejectModalOpen(true);
  };

  const handleRejectPostWithReason = async () => {
    if (!currentPostId) return;

    try {
      const response = await fetch(`${backendUrl}/api/posts/${currentPostId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (response.ok) {
        setPendingPosts((prevPosts) =>
          prevPosts.filter((post) => post.id !== currentPostId)
        );
        showNotification('success', 'The post was rejected.');
      } else {
        showNotification('error', 'An error occurred while rejecting.');
      }
    } catch (error) {
      showNotification('error', 'Error connecting to the server.');
      console.error('Error rejecting post:', error);
    } finally {
      setIsRejectModalOpen(false);
      setRejectionReason('');
      setCurrentPostId(null);
    }
  };


  const handleLogout = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies for session
      });

      if (response.ok) {
        showNotification('success', 'You have successfully logged out.');
        // Resetuj korisničko stanje i redirektuj na login stranicu
        setUserData(null);
        setUserType('user');
        window.location.href = '/login'; // Prilagodite putanju stranici za prijavu
      } else {
        showNotification('error', 'An error occurred while logging out. Please try again.');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      showNotification('error', 'Error connecting to the server.');
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

      showNotification('success', 'The user was successfully unblocked.');
    } catch (error) {
      console.error('Error unblocking user:', error);
      showNotification('error', 'Error connecting to the server.');
    }
  };

  // Funkcija za otvaranje prozora za dodavanje slike
  const openPhotoSettings = () => {
    setIsPhotoSettingsOpen(true);
  };

  // Funkcija za zatvaranje prozora
  const closePhotoSettings = () => {
    setIsPhotoSettingsOpen(false);
    setImageSrc(null);
  };

  // Funkcija za selektovanje slike
  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file); // Čuvamo originalni fajl
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
    }
  };

  // Funkcija za isecanje slike
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    console.log("Cropped Area:", croppedArea);
    console.log("Cropped Pixels:", croppedAreaPixels);
  }, []);

  // Funkcija za uklanjanje slike
  const removePhoto = () => {
    setImageSrc(null);
    setCroppedImage(null);
  };

  // Funkcija za slanje slike na backend
  const saveProfilePhoto = async () => {
    if (!selectedFile) return;
  
    const formData = new FormData();
    formData.append("file", selectedFile); // ✅ Ispravno dodajemo fajl
  
    try {
      const response = await fetch(`${backendUrl}/api/users/upload-profile-photo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
  
      const data = await response.json();
      if (response.ok) {
        console.log("Slika uspešno sačuvana:", data);
  
        // Ažuriraj userData nakon uspešnog upload-a
        setUserData((prevUser) => prevUser ? { ...prevUser, profileImage: data.profileImageUrl } : null);
  
        closePhotoSettings();
      } else {
        console.error("Greška pri čuvanju slike:", data);
      }
    } catch (error) {
      console.error("Greška pri uploadu slike:", error);
    }
  };
  

  if (isLoading) {
    return <Loader />;
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
                    Image <span className="text-span-3">(Optional)</span>
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
                  <div className="text-block-9">Post Text:</div>
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
                  <div>Cancel</div>
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
                  <div>Save</div>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {isRejectModalOpen && (
        <section className="reject-description-section">
          <div className="w-layout-blockcontainer container container-reject-description w-container">
            <div className="form-block w-form">
              <form
                id="reject-form"
                name="reject-form"
                className="form-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRejectPostWithReason();
                }}
              >
                <label htmlFor="rejectionReason" className="field-label">
                  Reason for post rejection
                </label>
                <textarea
                  placeholder="Unesite razlog odbijanja objave"
                  maxLength={5000}
                  id="rejectionReason"
                  name="rejectionReason"
                  className="textarea w-input"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                ></textarea>
                <div className="reject-description-buttons-div">
                  <button
                    type="button"
                    className="reject-button give-up w-button"
                    onClick={() => {
                      setIsRejectModalOpen(false);
                      setRejectionReason('');
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="reject-button w-button">
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Modal za izmenu slike */}
      {isPhotoSettingsOpen && (
        <div className="profile-photo-settings-background">
          <div className="profile-photo-settings">
            <div className="photo-div">
              {/* Input za učitavanje slike */}
              <input type="file" accept="image/*" onChange={onSelectFile} style={{ display: "none" }} id="upload-photo" />
              <label htmlFor="upload-photo" className="w-button">Choose File</label>

              {/* Prikaz kropovane slike */}
              {imageSrc && (
                <div className="crop-container">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
              )}

              {/* Ukloni sliku */}
              <button className="button w-button" onClick={removePhoto}>Remove</button>
            </div>

            {/* Dugmići za zatvaranje i čuvanje */}
            <div className="profile-photo-settings-buttons-div">
              <button className="profile-photo-settings-button-cancel w-button" onClick={closePhotoSettings}>Cancel</button>
              <button className="profile-photo-settings-button-save w-button" onClick={saveProfilePhoto}>Save</button>
            </div>
          </div>
        </div>
      )}

      <section id='hero-section' className="hero-section">
        <div className="w-layout-blockcontainer container hero-container w-container">
          <div className="user-info">
            <form id="email-form" className="form" onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              <div className="user-image">
                <div className="user-info-image-div" onClick={openPhotoSettings}>
                  <img
                    src={userData?.profileImage || "/assets/Icons/defaultProfilePicture.svg"}
                    alt="Profile"
                    className="profile-image"
                  />                  <div className="user-info-image-settings-div">
                    <img src="/assets/Icons/arrow-up.svg" alt="Change" className="user-info-image-settings-icon" />
                  </div>
                </div>
                <div className="text-block-6">@{userData?.username || ''}</div>
                <div className="div-block-4">
                  <a
                    href="#"
                    className="link-block-2 w-inline-block"
                    onClick={handleLogout}
                  >
                    <div>Log out</div>
                    <img
                      src="\assets\Icons\logout.svg"
                      loading="lazy"
                      alt="Logout"
                    />
                  </a>
                </div>
              </div>
              <label htmlFor="username" className="user-info-label">Username</label>
              <input
                className="user-info-input w-input"
                name="username"
                id="username"
                value={userData?.username || ''} // Vraća prazan string ako je userData null
                disabled={isSaving} // Disable while saving
              />
              <label htmlFor="firstName" className="user-info-label">First Name</label>
              <input
                className="user-info-input w-input"
                name="firstName"
                id="firstName"
                value={userData?.firstName || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="lastName" className="user-info-label">Last Name</label>
              <input
                className="user-info-input w-input"
                name="lastName"
                id="lastName"
                value={userData?.lastName || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="address" className="user-info-label">Address</label>
              <input
                className="user-info-input w-input"
                name="address"
                id="address"
                value={userData?.address || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="city" className="user-info-label">City</label>
              <input
                className="user-info-input w-input"
                name="city"
                id="city"
                value={userData?.city || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="country" className="user-info-label">Country</label>
              <input
                className="user-info-input w-input"
                name="country"
                id="country"
                value={userData?.country || ''} // Vraća prazan string ako je userData null
                onChange={handleInputChange}
              />
              <label htmlFor="phone" className="user-info-label">Phone number</label>
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
              <label htmlFor="password" className="user-info-label">Password</label>
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
                value={isSaving ? 'Čuvanje...' : 'Save changes'}
                disabled={isSaving}
              />
            </form>
          </div>
          <div className="container-hr"></div>
          <div className="user-posts-block">
            <div className="div-block">
              <div>Posts</div>
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
                          <div className="text-block-10">The post is pending.</div>
                        </div>

                        <div className="div-block-5"></div>
                      </>
                    )}
                    {post.status === 'rejected' && (
                      <>
                        <div className="user-postreject-div"></div>
                        <div className="user-post-padding-image-div">
                          <img src="\assets\Icons\alert-triangle-RED.svg" loading="lazy" alt="" className="image-12" />
                          <div className="text-block-11">Post is rejected!</div>
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
                            post.profileImage === "defaultProfilePicture.svg"
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
                        <div>Edit</div>
                      </div>
                      <div className="user-post-remove" onClick={() => handleDeletePost(post.id)}>
                        <img
                          src="/assets/Icons/trash.svg"
                          alt="Delete"
                        />
                        <div>Delete</div>
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
                <div className="text-block-5">Created posts</div>
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
                                    ? "/assets/Icons/defaultProfilePicture.svg"
                                    : `${backendUrl}/api/posts/uploads/${post.profileImage}`
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
                          <div>Approve</div>
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
                          <div>Reject</div>
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
                <h2 className="heading">Blocked users</h2>
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
                          <div className="info-upper-text">First Name</div>
                          <div className="info-bottom-text">{user.firstName}</div>
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">Last Name</div>
                          <div className="info-bottom-text">{user.lastName}</div>
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">City</div>
                          <div className="info-bottom-text">{user.city}</div>
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">Country</div>
                          <div className="info-bottom-text">{user.country}</div>
                        </div>
                        <div className="blocked-user-info-block">
                          <div className="info-upper-text">Phone number</div>
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
                          <div className="text-block-7">Unblock user</div>
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
