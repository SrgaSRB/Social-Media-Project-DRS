import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../notification/NotificationContext';



const loadCSS = (href: string) => {
  // Ukloni sve linkove osim trenutnog
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.getAttribute("href") !== href) {
      link.remove();
    }
  });

  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (!existingLink) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
};

interface FriendRequest {
  id: number;
  name: string;
  username: string;
  location: string;
  country: string;
  profileImage: string;
}

const FriendsRequest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;//|| 'http://localhost:5000'; // URL iz environment varijable
  const { showNotification } = useNotification();


  useEffect(() => {
    loadCSS("/styles/friends-request.css");
    setIsLoading(true);


    const checkSession = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/auth/session`, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          }
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

    checkSession();

    fetch(`${backendUrl}/api/users/friend-requests`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => setRequests(data))
      .catch(error => console.error('Error fetching requests:', error));

      setIsLoading(false); 
    
  }, [navigate]);

  const handleAccept = async (requestId: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/users/accept-friend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ request_id: requestId }),
      });

      const data = await response.json();
      if (response.ok) {
        showNotification('success', data.message);
        setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
      } else {
        showNotification('error', data.error);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      showNotification('warning', 'Došlo je do greške prilikom prihvatanja zahteva.');
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await fetch(`${backendUrl}/api/users/reject-friend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ request_id: requestId }),
      });
  
      const data = await response.json();
      if (response.ok) {
        showNotification('success', data.message); 
        setRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
      } else {
        showNotification('error',data.error); 
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      showNotification('warning', 'Došlo je do greške prilikom odbijanja zahteva.');
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
    <div className="body 2">
      <section className="friends-requests-section">
        <div className="w-layout-blockcontainer container friends-requests-container w-container">
          <div className="div-block">
            <div className="text-block-13">Vaši zahtevi za prijateljstvo</div>
            <img
              src="\assets\Icons\friends-requests-2people.svg"
              alt="Friends Requests"
              className="image-10"
            />
          </div>
          <div className="requests-list">
            {Array.isArray(requests) && requests.length > 0 ? (
              requests.map((request) => (
                <div key={request.id} className="fr-block">
                  <div className="fr">
                    <div className="fr-user-image">
                      <img
                        src={`/assets/Icons/${request.profileImage}`}
                        alt="User Profile"
                        className="image-6"
                      />
                    </div>
                    <div className="fr-user-info">
                      <div className="text-block-7">{request.name}</div>
                      <div className="text-block-8">{request.username}</div>
                    </div>
                    <div className="fr-user-location-block">
                      <div className="location-icon">
                        <img
                          src="\assets\Icons\locationPin-RED.svg"
                          alt="Location Icon"
                          className="image-7"
                        />
                      </div>
                      <div className="fr-user-location">
                        <div className="text-block-9">{request.location},</div>
                        <div className="text-block-10">{request.country}</div>
                      </div>
                    </div>
                    <div className="request-accept-dontaccept-block">
                      <a
                        id="accept-request"
                        href="#"
                        className="request-accept w-inline-block"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAccept(request.id);
                        }}
                      >
                        <div className="text-block-11">Prihvati</div>
                        <img
                          src="\assets\Icons\accept-request-BLUE.svg"
                          alt="Accept"
                          className="image-8"
                        />
                      </a>
                      <a
                        id="reject-request"
                        href="#"
                        className="request-dontaccept w-inline-block"
                        onClick={(e) => {
                          e.preventDefault();
                          handleReject(request.id);
                        }}
                      >
                        <div className="text-block-12">Odbij</div>
                        <img
                          src="\assets\Icons\reject-request-RED.svg"
                          alt="Reject"
                          className="image-9"
                        />
                      </a>
                    </div>
                  </div>
                  <div className="fr-hr"></div>
                </div>
              ))) : (
              <div>No friend requests available</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FriendsRequest;