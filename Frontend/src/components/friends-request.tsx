import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../notification/NotificationContext';
import Loader from "../components/Loader";
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
    link.onload = () => console.log(`Učitano: ${href}`);
    document.head.appendChild(link);
  });
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
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const { showNotification } = useNotification();

  useEffect(() => {

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
          navigate('/login'); // Redirect to login page
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        navigate('/login'); // Redirect to login in case of an error
      } finally {
        setIsLoading(false);
      }
    };

    fetch(`${backendUrl}/api/users/friend-requests`, {
      method: 'GET',
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => setRequests(data))
      .catch(error => console.error('Error fetching requests:', error));


    checkSession();

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
      showNotification('warning', 'An error occurred while accepting the request.');
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
        showNotification('error', data.error);
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      showNotification('warning', 'An error occurred while rejecting the request.');
    }
  };

  if (isLoading) {
    return <Loader />;
  }


  return (
    <section className="friends-requests-section">
      <div className="w-layout-blockcontainer container friends-requests-container w-container">
        <div className="friends-requests-wrapper">
          <div className="div-block">
            <div className="text-block-13">Your Friend Requests</div>
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

                      <ProfilePicture profileImage={request?.profileImage} />

                    </div>
                    <div className="fr-user-info">
                      <div className="text-block-15">{request.name}</div>
                      <div className="text-block-16">{request.username}</div>
                    </div>
                    <div className="fr-user-location-block">
                      <div className="location-icon">
                        <img
                          src="\assets\Icons\locationPin-RED.svg"
                          alt="Location Icon"
                          className="image-16"
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
                        <div className="text-block-11">Accept</div>
                        <img
                          src="\assets\Icons\accept-request-BLUE.svg"
                          alt="Accept"
                          className="image-15"
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
                        <div className="text-block-12">Reject</div>
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
              ))
            ) : (
              <div style={{ margin: "0 0 0 10px" }} >No friend requests available</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FriendsRequest;
