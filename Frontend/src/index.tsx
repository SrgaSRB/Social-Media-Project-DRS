import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { NotificationProvider } from './components/notification/NotificationContext';
import { NotificationList } from './components/notification/NotificationList';
import { Analytics } from "@vercel/analytics/react"


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
    <NotificationProvider>
      <App />
      <NotificationList />
      <Analytics/>
    </NotificationProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
