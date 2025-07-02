import React, { createContext, useContext, useState } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
}

interface NotificationContextProps {
  notifications: Notification[];
  showNotification: (type: 'success' | 'warning' | 'error', message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (type: 'success' | 'warning' | 'error', message: string) => {
    const id = Date.now().toString(); // Jedinstveni ID za svaku notifikaciju
    setNotifications((prev) => [...prev, { id, type, message }]);
  
    setTimeout(() => removeNotification(id), 6000); // Automatsko uklanjanje posle 6s
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
