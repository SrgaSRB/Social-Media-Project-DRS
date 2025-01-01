import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/Icons/navbar-home.svg';


const Navbar: React.FC = () => {
    return (
      <div className="navbar">
        <div className="navbar-icons-div">
          <NavLink
            to="/"
            className={({ isActive }) => isActive ? "navibar-icon selected-icon" : "navibar-icon"}
          >
            <img
              loading="lazy"
              src="/assets/Icons/navbar-home.svg"
              alt="Home"
              className="image-3"
            />
          </NavLink>
          <NavLink
            to="/upload"
            className={({ isActive }) => isActive ? "navibar-icon selected-icon" : "navibar-icon"}
          >
            <img
              loading="lazy"
              src="./assets/Icons/navbar-upload.svg"
              alt="Upload"
              className="image-3"
            />
          </NavLink>
          <NavLink
            to="/friends-requests"
            className={({ isActive }) => isActive ? "navibar-icon selected-icon" : "navibar-icon"}
          >
            <img
              loading="lazy"
              src="/assets/Icons/navbar-friendsRequests.svg"
              alt="Profile"
              className="image-3"
            />
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => isActive ? "navibar-icon selected-icon" : "navibar-icon"}
          >
            <img
              loading="lazy"
              src="/assets/Icons/navbar-userProfile.svg"
              alt="Settings"
              className="image-3"
            />
          </NavLink>
        </div>
      </div>
    );
  };
  
  

export default Navbar;
