import React, { useState } from "react";

interface ProfilePictureProps {
  profileImage?: string | null; // URL slike ili null
  onClick?: () => void; // Funkcija koja se poziva kad se klikne na sliku
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ profileImage, onClick }) => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  return (
      <img
        src={profileImage !== "defaultProfilePicture.svg" ? `${backendUrl}/api/posts/uploads/${profileImage}` : "/assets/Icons/defaultProfilePicture.svg"}
        alt="Profile"
        className="user-profile-photo"
      />
  );
};

export default ProfilePicture;
