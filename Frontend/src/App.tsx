import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Register from './components/register';
import Login from './components/login';
import Navbar from './components/navbar';
import Index from './components/index';
import UploadPost from './components/upload-post';
import UserProfile from './components/profile';
import UserSearch from './components/user-search';
import FriendsRequest from './components/friends-request';
import Messages from './components/messages'

const App: React.FC = () => {
  const location = useLocation();

  // List of routes where Navbar should be hidden
  const hideNavbarRoutes = ['/register', '/login'];
  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />} {/* Navbar will be hidden for certain routes */}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={<UploadPost />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/user-search" element={<UserSearch />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/friends-requests" element={<FriendsRequest />} />
      </Routes>
    </>
  );
};

// Wrap the application with Router
const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
