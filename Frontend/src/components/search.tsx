import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { useNotification } from '../notification/NotificationContext';
import Loader from "../components/Loader";
import { useNavigate } from 'react-router-dom';
import ProfilePicture from "../components/ProfilePicture";

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

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: string;
  city: string;
  country: string;
  profileImage?: string;
}

const UserSearch: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const searchTermFromLocation = location.state?.searchTerm || '';
  const [searchTerm, setSearchTerm] = useState(searchTermFromLocation);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<{ [key: number]: string }>({});

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Početak učitavanja prijatelja

      loadCSS([
        "/styles/user-search.css",
        "/styles/notification.css",
        "/styles/extern.css",
        "/styles/navbar.css",
      ]);

      try {
        // Provera sesije korisnika
        const sessionResponse = await fetch(`${backendUrl}/api/auth/session`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const sessionData = await sessionResponse.json();

        if (!sessionData.user) {
          navigate("/login"); // Ako nije ulogovan, preusmerava ga na login
          return;
        }

        const [usersResponse, statusesResponse] = await Promise.all([
          fetch(`${backendUrl}/api/users/`, { method: 'GET', credentials: 'include' }),
          fetch(`${backendUrl}/api/users/friend-statuses`, { method: 'GET', credentials: 'include' }),
        ]);

        if (!usersResponse.ok || !statusesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const usersData = await usersResponse.json();
        const statusesData = await statusesResponse.json();

        setUsers(usersData);
        setFriendStatuses(statusesData);
        setFilteredUsers(usersData);

      } catch (error) {
        console.error("Greška pri učitavanju podataka:", error);
      } finally {
        setIsLoading(false); // Kraj učitavanja
      }
    };

    fetchData();
  }, [backendUrl]);


  useEffect(() => {
    if (searchTerm) {
      const results = users.filter((user) =>
        [user.name, user.username, user.email, user.address, user.city, user.country]
          .some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(results);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    const results = users.filter((user) =>
      [user.name, user.username, user.email, user.address, user.city, user.country]
        .some((field) => field?.toLowerCase().includes(term.toLowerCase()))
    );

    setFilteredUsers(results);
  };

  const handleSendFriendRequest = async (receiverId: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/users/send-friend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ receiver_id: receiverId }),
      });

      const data = await response.json();
      if (response.ok) {
        showNotification('success', data.message);
        setFriendStatuses((prev) => ({ ...prev, [receiverId]: 'requestSent' }));
      } else {
        showNotification('error', data.error);
      }
    } catch (error) {
      showNotification('error', 'An error occurred while sending the request.');
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/users/remove-friend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ friend_id: friendId }),
      });

      if (response.ok) {
        showNotification('success', 'Friend has been successfully removed.');
        setFriendStatuses((prev) => ({ ...prev, [friendId]: 'notFriends' }));
      } else {
        const data = await response.json();
        showNotification('error', data.error);
      }
    } catch (error) {
      showNotification('error', 'An error occurred while removing the friend.');
    }
  };

  const handleAcceptFriendRequest = async (user1_id: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/users/accept-friend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ user1_id: user1_id }),
      });

      const data = await response.json();
      if (response.ok) {
        showNotification('success', 'The request has been accepted.');
        setFriendStatuses((prev) => ({ ...prev, [user1_id]: 'friends' }));
      } else {
        showNotification('error', data.error);
      }
    } catch (error) {
      showNotification('error', 'An error occurred while accepting the request.');
    }
  };

  const openConfirmModal = (friendId: number) => {
    setSelectedFriendId(friendId);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedFriendId(null);
  };

  const confirmRemoveFriend = async () => {
    if (selectedFriendId !== null) {
      await handleRemoveFriend(selectedFriendId);
      closeConfirmModal();
    }
  };

  if (isLoading) {
    return <Loader />;
  }


  return (
    <div className="body">
      <Helmet>
        <title>User Search</title>
      </Helmet>
      <section className="hero-section">
        <div className="w-layout-blockcontainer container w-container">
          <div className="form-block w-form">
            <div className="form">
              <img
                src="/assets/Icons/search.svg"
                alt="Search Icon"
                className="image"
              />
              <div className="search-div">
                <input
                  className="search-input w-input"
                  maxLength={256}
                  placeholder="Search users (name, email, address, city...)"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                />
                <div className="text-block" onClick={() => setSearchTerm('')}>
                  <img
                    src="/assets/Icons/x-02.svg"
                    alt=""
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="users-search-result-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div className="user-block" key={user.id}>
                  <div className="user-info-block">
                    <div className="user-image">

                      <ProfilePicture profileImage={user?.profileImage} />

                    </div>
                    <div className="user-names-info">
                      <div className="text-block-3">{user.name}</div>
                      <div className="text-block-2">@{user.username}</div>
                    </div>
                    <div className="users-location-info">
                      <img
                        src="/assets/Icons/locationPin-RED.svg"
                        alt="Location Icon"
                        className="image-5"
                      />
                      <div className="user-location">
                        <div className="text-block-5">{user.country},</div>
                        <div className="text-block-6">{user.city}</div>
                      </div>
                    </div>
                    {friendStatuses[user.id] === 'notFriends' && (
                      <a
                        href="#"
                        className="link-block send-request w-inline-block"
                        onClick={() => handleSendFriendRequest(user.id)}
                      >
                        <div className="text-block-4">Add Friend</div>
                        <img
                          src="/assets/Icons/user-profile-add-WHITE.svg"
                          alt="Add Friend Icon"
                          className="image-4"
                        />
                      </a>
                    )}
                    {friendStatuses[user.id] === 'requestSent' && (
                      <a className="link-block padding-request w-inline-block">
                        <div className="text-block-4">Request Sent</div>
                        <img
                          src="/assets/Icons/sendFriendRequest-BLUE.svg"
                          alt="Request Sent Icon"
                          className="image-4"
                        />
                      </a>
                    )}
                    {friendStatuses[user.id] === 'friends' && (
                      <div className="accept-and-remove-buttons-block">
                        <a href="#" className="link-block accept-request w-inline-block">
                          <div className="text-block-4">Friends</div>
                          <img
                            src="/assets/Icons/accept-request-BLUE.svg"
                            loading="lazy"
                            alt=""
                            className="image-4"
                          />
                        </a>
                        <a
                          href="#"
                          className="link-block remove-friend w-inline-block"
                          onClick={() => openConfirmModal(user.id)}
                        >
                          <div className="text-block-4">Remove Friend</div>
                          <img
                            src="/assets/Icons/user-profile-minus-WHITE.svg"
                            alt="Remove Friend Icon"
                            className="image-4"
                          />
                        </a>
                      </div>
                    )}
                    {friendStatuses[user.id] === 'requestReceived' && (
                      <a
                        href="#"
                        className="link-block accept-requests w-inline-block"
                        onClick={() => handleAcceptFriendRequest(user.id)}
                      >
                        <div className="text-block-4">Accept User's Request</div>
                        <img
                          src="/assets/Icons/user-profile-left-WHITE.svg"
                          alt="Accept Request Icon"
                          className="image-4"
                        />
                      </a>
                    )}
                  </div>
                  <div className="user-block-hr"></div>
                </div>
              ))
            ) : (
              <div>No search results.</div>
            )}
          </div>
        </div>
      </section>

      {/* MODAL ZA POTVRDU BRISANJA */}
      {isConfirmModalOpen && (
        <div className="remove-friend-confirm-background">
          <div className="remove-friend-confirm-div">
            <div className="remove-friend-confirm-text">
              Are you sure you want to delete the user from your friends list?
            </div>
            <div className="remove-friend-confirm-buttons-div">
              <a href="#" className="remove-friend-confirm-cancel-button w-button" onClick={closeConfirmModal}>
                Cancel
              </a>
              <a href="#" className="remove-friend-confirm-cancel-remove w-button" onClick={confirmRemoveFriend}>
                Remove friend
              </a>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default UserSearch;
