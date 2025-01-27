import React from 'react';
import { useNotification } from './NotificationContext';

export const NotificationList: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="notification-container">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="notification-div"
          style={{
            backgroundColor: `var(--notification-${notif.type})`,
            borderLeftColor: `var(--notification-${notif.type}-edge)`,
          }}
        >
          <div className="notification-text">{notif.message}</div>
          <a
            href="#"
            className="notification-close w-inline-block"
            onClick={(e) => {
              e.preventDefault();
              removeNotification(notif.id); // Ručno uklanjanje
            }}
          >
            <div className="notification-close-text">X</div>
          </a>
        </div>
      ))}
    </div>
  );
};
