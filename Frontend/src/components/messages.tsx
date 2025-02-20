import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';


interface Friend {
  id: number;
  name: string;
  profileImage: string;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  timestamp: string;
  status: string;
}

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


const Messages: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const navigate = useNavigate();


  // Umesto hardkodovanog ID-ja, preuzmi stvarni ID ulogovanog korisnika (ovo je samo primer)
  const [currentUserId, setCurrentUserId] = useState<number>();

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Inicijalizuj socket (ovo možeš premestiti u globalni kontekst)
  const socket = io(backendUrl);

  // Učitavanje prijatelja
  useEffect(() => {
    
    loadCSS([
      '/styles/messages.css',
      '/styles/notification.css',
      '/styles/extern.css',
      '/styles/navbar.css'
    ]);

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
        }
      } catch (error) {
        console.error('Error while checking session:', error);
        navigate('/login'); // Redirect to login in case of error
      }
    };

    fetch(`${backendUrl}/api/auth/session`, {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        setCurrentUserId(data.user.id);
      })
      .catch((error) => {
        console.error('Error fetching session:', error);
      });

    checkSession();

    fetch(`${backendUrl}/api/messages/friends`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then((data: Friend[]) => setFriends(data))
      .catch(err => console.error(err));

  }, [backendUrl]);

  // Učitavanje razgovora sa izabranim prijateljem
  useEffect(() => {
    if (selectedFriend) {
      setIsLoadingMessages(true); // Početak učitavanja

      fetch(`${backendUrl}/api/messages/conversation/${selectedFriend.id}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then((data: ChatMessage[]) => {
          setMessages(data);
          setIsLoadingMessages(false); // Kraj učitavanja
        })
        .catch(err => {
          console.error(err);
          setIsLoadingMessages(false); // U slučaju greške, zaustaviti loader
        });
    }
  }, [selectedFriend, backendUrl]);


  // Live osluškivanje novih poruka preko socket-a
  useEffect(() => {
    if (!currentUserId || !selectedFriend) return;

    const handleNewMessage = (msg: ChatMessage) => {
      console.log("Primljena nova poruka:", msg);

      // Proveri da li poruka pripada trenutnom razgovoru
      if (
        msg.sender_id === selectedFriend.id && msg.receiver_id === currentUserId
      ) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [selectedFriend, currentUserId]);

  // Slanje poruke
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend || newMessage.trim() === '') return;

    const payload = {
      receiver_id: selectedFriend.id,
      content: newMessage.trim()
    };

    fetch(`${backendUrl}/api/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then((data) => {
        // Ako backend vraća novu poruku u polju 'msg', ona će biti dodata;
        // u suprotnom, live listener će je dodati kad stigne preko socket-a.
        if (data && data.msg) {
          setMessages(prev => [...prev, data.msg]);
          setNewMessage('');
        } else {
          console.error("Backend nije vratio poruku:", data);
        }
      })
      .catch(err => console.error(err));
  };

  const openChatOnMobile = () => {
    setIsMobileChatOpen(true);
  };

  const closeChatOnMobile = () => {
    setIsMobileChatOpen(false);
  };

  return (
    <section className="chat-section">
      <div className="w-layout-blockcontainer container w-container">

        {/* Lista prijatelja */}
        <div className="side-chats-block">
          <div className="text-block">Messages</div>
          <div className="side-chat">
            {friends.map(friend => (
              <div key={friend.id} className="side-chat-user" onClick={() => {
                openChatOnMobile();
                setSelectedFriend(friend)
              }}>
                <div className="side-chat-image-div">
                  <img
                    src={friend.profileImage === 'defaultProfilePicture.svg' ? '/assets/Icons/defaultProfilePicture.svg' : friend.profileImage}
                    alt="Friend"
                    className="side-chat-image"
                  />
                </div>
                <div className="side-chat-user-info">
                  <div className="text-block-2">{friend.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat prozor */}
        <div className={`chat-box-block ${isMobileChatOpen ? 'show' : 'hide'}`}>
          {selectedFriend ? (
            <>
              {/* Zaglavlje razgovora */}
              <div className="chat-box-user">
                <div className="chat-box-user-back-div" onClick={closeChatOnMobile}>
                  <img src="https://cdn.prod.website-files.com/673928869b5a833529aa3a08/67b68e5d981b0268036acaf0_arrow-left.svg" loading="lazy" alt="Back" className="image-4" />
                </div>
                <div className="chat-boc-user-photo">
                  <img
                    src={selectedFriend.profileImage === 'defaultProfilePicture.svg' ? '/assets/Icons/defaultProfilePicture.svg' : selectedFriend.profileImage}
                    alt="Friend"
                    className="image-3"
                  />
                </div>
                <div className="chat-box-user-info">
                  <div className="text-block-3">{selectedFriend.name}</div>
                </div>
              </div>

              {/* Lista poruka */}
              <div className="chat-box-messages">
                {isLoadingMessages ? (
                  <div className="loader-container">
                    <div className="loader"></div>
                  </div>
                ) : (
                  messages.map(msg =>
                    msg.sender_id === currentUserId ? (
                      <div key={msg.id} className="chat-box-messages-user-message-block">
                        <div className="chat-box-messages-user-message-text">{msg.content}</div>
                      </div>
                    ) : (
                      <div key={msg.id} className="chat-box-messages-friend-message-block">
                        <div className="chat-box-messages-friend-message-text">{msg.content}</div>
                      </div>
                    )
                  )
                )}
              </div>


              {/* Forma za slanje poruke */}
              <div className="chat-box-send-message-block">
                <div className="form-block w-form">
                  <form onSubmit={handleSendMessage} className="send-message-form">
                    <input
                      className="message-text w-input"
                      maxLength={256}
                      name="text-message"
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      required
                    />
                    <input type="submit" className="message-send-button w-button" value="Send" />
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="chat-box-user">
              <div className="text-block-3">Select a friend to start a conversation</div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default Messages;
