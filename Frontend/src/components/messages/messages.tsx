import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import Loader from "../universal/Loader";
import ProfilePicture from "../universal/ProfilePicture";


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
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  const navigate = useNavigate();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Umesto hardkodovanog ID-ja, preuzmi stvarni ID ulogovanog korisnika (ovo je samo primer)
  const [currentUserId, setCurrentUserId] = useState<number>();

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Inicijalizuj socket (ovo možeš premestiti u globalni kontekst)
  const socket = io(backendUrl);

  useEffect(() => {
    setIsLoadingChats(true); // Početak učitavanja prijatelja

    const fetchData = async () => {
      try {
        // Provera sesije korisnika
        const sessionResponse = await fetch(`${backendUrl}/api/auth/session`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const sessionData = await sessionResponse.json();

        if (!sessionData.user) {
          navigate("/login");
          return;
        }

        setCurrentUserId(sessionData.user.id);

        // Učitavanje liste prijatelja
        const friendsResponse = await fetch(`${backendUrl}/api/messages/friends`, {
          method: "GET",
          credentials: "include",
        });

        const friendsData: Friend[] = await friendsResponse.json();
        setFriends(friendsData);

      } catch (error) {
        console.error("Greška pri učitavanju podataka:", error);
      } finally {
        setIsLoadingChats(false); // Kraj učitavanja
      }
    };

    fetchData();
  }, [backendUrl, navigate]);

  // Učitavanje razgovora sa izabranim prijateljem
  useEffect(() => {
    if (!selectedFriend) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true); // Početak učitavanja

      try {
        const response = await fetch(`${backendUrl}/api/messages/conversation/${selectedFriend.id}`, {
          credentials: "include",
        });

        const data: ChatMessage[] = await response.json();
        setMessages(data);

        setTimeout(() => {
          scrollToBottom(); // Pomeri skrol na dno nakon učitavanja
        }, 100);

      } catch (error) {
        console.error("Greška pri učitavanju poruka:", error);
      } finally {
        setIsLoadingMessages(false); // Kraj učitavanja
      }
    };

    fetchMessages();
  }, [selectedFriend, backendUrl]); // Ponovno izvršenje kada se `selectedFriend` promeni

  // Live osluškivanje novih poruka preko socket-a
  useEffect(() => {
    if (!currentUserId || !selectedFriend) return;

    const handleNewMessage = (msg: ChatMessage) => {
      if (
        (msg.sender_id === selectedFriend.id && msg.receiver_id === currentUserId) ||
        (msg.sender_id === currentUserId && msg.receiver_id === selectedFriend.id)
      ) {
        setMessages(prev => [...prev, msg]);

        setTimeout(() => {
          scrollToBottom(); // Pomeri skrol na dno
        }, 100);
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage); // Cleanup pri unmount-u
    };
  }, [selectedFriend, currentUserId]);


  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages]);


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
          setNewMessage('');
        } else {
          console.error("Error:", data);
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

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };



  return (
    <section className="chat-section">
      <div className="w-layout-blockcontainer container w-container">
        <div className='chat-wrapper'>

          {/* Lista prijatelja */}
          <div className="side-chats-block">
            <div className="text-block-17">Messages</div>

            {isLoadingChats ? (
              <Loader /> // Prikaz loadera dok se učitavaju prijatelji
            ) : (
              <div className="side-chat">
                {friends.map(friend => (
                  <div key={friend.id} className="side-chat-user" onClick={() => {
                    openChatOnMobile();
                    setSelectedFriend(friend);
                  }}>
                    <div className="side-chat-image-div">

                      <ProfilePicture profileImage={friend?.profileImage} />

                    </div>
                    <div className="side-chat-user-info">
                      <div className="text-block-19">{friend.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Chat prozor */}
          <div className={`chat-box-block ${isMobileChatOpen ? 'show' : 'hide'}`}>
            {selectedFriend ? (
              <>
                {/* Zaglavlje razgovora */}
                <div className="chat-box-user">
                  <div className="chat-box-user-back-div" onClick={closeChatOnMobile}>
                    <img src="https://cdn.prod.website-files.com/673928869b5a833529aa3a08/67b68e5d981b0268036acaf0_arrow-left.svg" loading="lazy" alt="Back" className="image-18" />
                  </div>
                  <div className="chat-boc-user-photo">

                    <ProfilePicture profileImage={selectedFriend?.profileImage} />

                  </div>
                  <div className="chat-box-user-info">
                    <div className="text-block-18">{selectedFriend.name}</div>
                  </div>
                </div>

                {/* Lista poruka */}
                <div className="chat-box-messages">
                  {isLoadingMessages ? (
                    <Loader />
                  ) : (
                    messages.map(msg =>
                      msg.sender_id === currentUserId ? (
                        <div key={msg.id} className="chat-box-messages-user-message-block">
                          <div className="chat-box-messages-user-message-text">{msg.content}</div>
                          <div className='div-block-8'><div className='div-block-9'></div></div>
                          <div className="chat-box-messages-user-message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : (
                        <div key={msg.id} className="chat-box-messages-friend-message-block">
                          <div className="chat-box-messages-friend-message-text">{msg.content}</div>
                          <div className='div-block-10'><div className='div-block-11'></div></div>
                          <div className="chat-box-messages-friend-message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      )
                    )
                  )}
                  <div ref={messagesEndRef} ></div>
                </div>


                {/* Forma za slanje poruke */}
                <div className="chat-box-send-message-block">
                  <div className="send-message-form-block w-form">
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
                <div className="text-block-18">Select a friend to start a conversation</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Messages;
