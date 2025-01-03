import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { useNotification } from '../notification/NotificationContext';


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

  const backendUrl = process.env.REACT_APP_BACKEND_URL; //|| 'http://localhost:5000'; // URL iz environment varijable

  const { showNotification } = useNotification();


  useEffect(() => {
    loadCSS('/styles/user-search.css');
    setIsLoading(true);

    const fetchUsersAndStatuses = async () => {
      try {
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
        console.error('Error fetching users and statuses:', error);
        showNotification("error", "Došlo je do greške prilikom učitavanja podataka.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsersAndStatuses();
  }, []);

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

    // Automatsko filtriranje korisnika
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
      } else {
        showNotification('error', data.error);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      showNotification('error', 'Došlo je do greške prilikom slanja zahteva.');
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/users/remove-friend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ friend_id: friendId }),
      });

      if (response.ok) {
        showNotification("success", "Prijatelj je uspešno obrisan.");
        setFriendStatuses((prev) => ({ ...prev, [friendId]: "notFriends" }));
      } else {
        const data = await response.json();
        showNotification("error", data.error);
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      showNotification("error", "Došlo je do greške prilikom brisanja prijatelja.");
    }
  };

  const handleAcceptFriendRequest = async (requestId: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/users/accept-friend-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ request_id: requestId }),
      });

      if (response.ok) {
        showNotification("success", "Zahtev je prihvaćen.");
        setFriendStatuses((prev) => ({ ...prev, [requestId]: "friends" }));
      } else {
        const data = await response.json();
        showNotification("error", data.error);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      showNotification("error", "Došlo je do greške prilikom prihvatanja zahteva.");
    }
  };



  if (isLoading) {
    return (
      <>
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
      </>
    );
  }

  return (
    <div className="body">
      <Helmet>
        <title>Pretraga korisnika</title>
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
                  placeholder="Pretražite korisnike (ime, email, adresa, grad...)"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                />
                <div className="text-block" onClick={() => setSearchTerm('')}>
                  <img src="\assets\Icons\x-02.svg"
                    alt="" />
                </div>
              </div>
            </div>
          </div>
          <div className="users-search-result-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div className="user-block" key={user.id}>
                  {friendStatuses[user.id] === "notFriends" && (
                    <a
                      href="#"
                      className="link-block w-inline-block"
                      onClick={() => handleSendFriendRequest(user.id)}
                    >
                      <div className="text-block-4">Dodaj prijatelja</div>
                      <img
                        src="\assets\Icons\sendFriendRequest-BLUE.svg"
                        alt="Add Friend Icon"
                        className="image-4"
                      />
                    </a>
                  )}
                  {friendStatuses[user.id] === "requestSent" && (
                    <a className="link-block padding-request w-inline-block">
                      <div className="text-block-4">Zahtev je poslat</div>
                      <img src="profile-right.svg" alt="Request Sent Icon" className="image-4" />
                    </a>
                  )}
                  {friendStatuses[user.id] === "friends" && (
                    <div className="accept-and-remove-buttons-block">
                      <a
                        href="#"
                        className="link-block remove-friend w-inline-block"
                        onClick={() => handleRemoveFriend(user.id)}
                      >
                        <div className="text-block-4">Obriši prijatelja</div>
                        <img src="minus%20(1).svg" alt="Remove Friend Icon" className="image-4" />
                      </a>
                    </div>
                  )}
                  {friendStatuses[user.id] === "requestReceived" && (
                    <a
                      href="#"
                      className="link-block accept-requests w-inline-block"
                      onClick={() => handleAcceptFriendRequest(user.id)}
                    >
                      <div className="text-block-4">Prihvati zahtev korisnika</div>
                      <img
                        src="user-profile-left.svg"
                        alt="Accept Request Icon"
                        className="image-4"
                      />
                    </a>
                  )}
                </div>
              ))

            ) : (
              <div>Nema rezultata pretrage.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserSearch;
