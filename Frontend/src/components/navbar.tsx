import React from 'react';
import { NavLink } from 'react-router-dom';

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
              src="https://cdn.prod.website-files.com/6733c94768b5bfe41ab3b781/6733cc4cb3455a85a1aaf2b9_home-05.svg"
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
              src="https://cdn.prod.website-files.com/6733c94768b5bfe41ab3b781/6733cc4cb3455a85a1aaf2b6_upload-03%20(1).svg"
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
              src="https://cdn.prod.website-files.com/6733c94768b5bfe41ab3b781/6733cc4cb3455a85a1aaf2b7_user-profile-right.svg"
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
              src="https://cdn.prod.website-files.com/6733c94768b5bfe41ab3b781/6733cc4cb3455a85a1aaf2b8_user-profile-circle%20(1).svg"
              alt="Settings"
              className="image-3"
            />
          </NavLink>
        </div>
      </div>
    );
  };
  
  

export default Navbar;
