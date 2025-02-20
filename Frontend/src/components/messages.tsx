import React, { useState, useEffect } from 'react';

interface Friend {
  id: number;
  name: string;
  profileImage: string;
}

interface ChatMessage {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
  status: string;
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
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = "/styles/notification.css";
    document.head.appendChild(link);
  };

const Messages: React.FC = () => {
  // Lista prijatelja ulogovanog korisnika
  const [friends, setFriends] = useState<Friend[]>([]);
  // Trenutno izabran prijatelj za chat
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  // Poruke u razgovoru sa izabranim prijateljem
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Tekst nove poruke
  const [newMessage, setNewMessage] = useState('');

  // Pretpostavljamo da je currentUserId dostupan (ovde je za primer fiksiran broj)
  const currentUserId = 1; // Ovo zamenite stvarnim podatkom o ulogovanom korisniku

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  console.log(backendUrl);

  // Učitavanje liste prijatelja sa endpointa /api/messages/friends
  useEffect(() => {

    loadCSS('/styles/messages.css');

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
      fetch(`${backendUrl}/api/messages/conversation/${selectedFriend.id}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then((data: ChatMessage[]) => setMessages(data))
        .catch(err => console.error(err));
    }
  }, [selectedFriend, backendUrl]);

  // Slanje poruke putem endpointa /api/messages/send
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
      .then(() => {
        // Dodajemo novu poruku u lokalno stanje
        const msg: ChatMessage = {
          id: Date.now(), // privremeni ID; pravi ID bi došao sa backend-a
          senderId: currentUserId,
          content: newMessage.trim(),
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        setMessages([...messages, msg]);
        setNewMessage('');
      })
      .catch(err => console.error(err));
  };

  return (
    <section className="chat-section">
      <div className="w-layout-blockcontainer container w-container">
        {/* Leva strana – lista prijatelja */}
        <div className="side-chats-block">
          <div className="text-block">Messages</div>
          {friends.map(friend => (
            <div key={friend.id} className="side-chat" onClick={() => setSelectedFriend(friend)}>
              <div className="side-chat-user">
                <div className="side-chat-image-div">
                  <img
                    src={friend.profileImage || '/assets/Icons/defaultProfilePicture.svg'}
                    alt="Friend"
                    className="side-chat-image"
                  />
                </div>
                <div className="side-chat-user-info">
                  <div className="text-block-2">{friend.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desna strana – chat prozor */}
        <div className="chat-box-block">
          {selectedFriend ? (
            <>
              {/* Zaglavlje razgovora */}
              <div className="chat-box-user">
                <div className="chat-boc-user-photo">
                  <img
                    src={selectedFriend.profileImage || '/assets/Icons/defaultProfilePicture.svg'}
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
                {messages.map(msg =>
                  msg.senderId === currentUserId ? (
                    <div key={msg.id} className="chat-box-messages-user-message-block">
                      <div className="chat-box-messages-user-message-text">{msg.content}</div>
                    </div>
                  ) : (
                    <div key={msg.id} className="chat-box-messages-friend-message-block">
                      <div className="chat-box-messages-friend-message-text">{msg.content}</div>
                    </div>
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
            // Ako nijedan prijatelj nije izabran
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
