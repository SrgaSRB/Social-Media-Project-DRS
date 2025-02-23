import React from 'react';

interface PostProps {
  id: number;
  username: string;
  profileImage: string;
  postImage?: string;
  postText: string;
  timeAgo: string;
  backendUrl: string;
  onImageClick: (imageUrl: string, altText: string) => void;
}

const Post: React.FC<PostProps> = ({
  id,
  username,
  profileImage,
  postImage,
  postText,
  timeAgo,
  backendUrl,
  onImageClick
}) => {
  return (
    <div key={id} className="user-post">
      {postImage ? (
        <div className="user-post-image">
          <img
            src={`${backendUrl}/api/posts/uploads/${postImage}`}
            alt={postImage}
            className="image-5"
            onClick={() =>
              onImageClick(`${backendUrl}/api/posts/uploads/${postImage}`, postImage)
            }
          />
        </div>
      ) : (
        <span className="image-placeholder"></span>
      )}
      <div className="user-post-user-info">
        <div className="user-post-user-info-image-and-name">
          <div className="user-post-user-info-profile-image">
            <img
              src={
                profileImage === "defaultProfilePicture.svg"
                  ? "/assets/Icons/defaultProfilePicture.svg"
                  : `${backendUrl}/api/posts/uploads/${profileImage}`
              }
              alt="Profile"
              className="image-4"
            />
          </div>
          <div className="user-post-user-info-name-and-date">
            <div className="user-post-user-info-name">
              @{<span className="text-span">{username}</span>}
            </div>
            <div className="user-post-user-info-date">{timeAgo}</div>
          </div>
        </div>
        <div className="post-hr"></div>
        <div className="user-post-text">
          <div className="text-block-2">{postText}</div>
        </div>
      </div>
    </div>
  );
};

export default Post;
