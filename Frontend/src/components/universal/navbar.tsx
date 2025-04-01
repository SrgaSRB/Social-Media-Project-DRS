import React, { useEffect, useState } from "react";
import { NavLink } from 'react-router-dom';
import ProfilePicture from "../universal/ProfilePicture";


const Navbar: React.FC = () => {

  const [userData, setUserData] = useState<{ profileImage?: string } | null>(null);

  useEffect(() => {
    // Dohvati podatke korisnika iz backend-a ili localStorage-a
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/session`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error("Neuspelo učitavanje podataka");

        const data = await response.json();
        setUserData(data.user);
      } catch (error) {
        console.error("Greška pri dohvatanju korisnika:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="navbar">
      <div className="container">
        <div className="navbar-icons-div">
          <NavLink
            to="/"
            className={({ isActive }) => isActive ? "navibar-icon selected-icon" : "navibar-icon"}
          >
            <img
              loading="lazy"
              src="/assets/Icons/navbar-home.svg"
              alt="Home"
              className="image-29"
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
              className="image-29"
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
              className="image-29"
            />
          </NavLink>
          <NavLink
            to="/messages"
            className={({ isActive }) => isActive ? "navibar-icon selected-icon" : "navibar-icon"}
          >
            <img
              loading="lazy"
              src="https://cdn.prod.website-files.com/673928869b5a833529aa3a08/67b5f397cf52187542b24ae3_message-chat-01.svg"
              alt="Profile"
              className="image-29"
            />
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => isActive ? "navibar-icon selected-icon" : "navibar-icon"}
          >
            <div className="nav-bar-profile-image">

              <ProfilePicture profileImage={userData?.profileImage} />

            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
};



export default Navbar;
