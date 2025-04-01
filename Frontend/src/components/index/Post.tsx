import React, { useState } from 'react';
import ProfilePicture from "../universal/ProfilePicture";
import axios from 'axios';


interface PostProps {
  id: number;
  username: string;
  profileImage: string;
  postImage?: string;
  postText: string;
  timeAgo: string;
  backendUrl: string;
  onImageClick: (imageUrl: string, altText: string) => void;
  isLiked: boolean;
  likeCount: number;
  onLikeToggle: (postId: number) => void;
  handleOpenPost: (postId: number) => void;
  }

const Post: React.FC<PostProps> = ({
  id,
  username,
  profileImage,
  postImage,
  postText,
  timeAgo,
  backendUrl,
  onImageClick,
  isLiked,
  likeCount,
  onLikeToggle,
  handleOpenPost,
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
            <ProfilePicture profileImage={profileImage} />
          </div>
          <div className="user-post-user-info-name-and-date">
            <div className="user-post-user-info-name">
              @{<span className="text-span">{username}</span>}
            </div>
            <div className="user-post-user-info-date">{timeAgo}</div>
          </div>
        </div>
        <div className="post-hr" />

        <div className="user-post-likes-and-comments-div">

        <div className="user-post-likes-and-comments" onClick={() => onLikeToggle(id)}>

            <img
              src={
                isLiked
                  ? "https://cdn.prod.website-files.com/67334b62cd4d25faa4b76e02/67e9c25f1a919423b12eba33_heart%20(3).png"
                  : "https://cdn.prod.website-files.com/67334b62cd4d25faa4b76e02/67e9c25ff801b7bf3d2ebcfe_heart%20(2).png"
              }
              className="image-32"
              alt="Like"
            />
            <div>{likeCount}</div>
          </div>

          <div className="user-post-likes-and-comments" onClick={() => handleOpenPost(id)}>
          <img src="https://cdn.prod.website-files.com/67334b62cd4d25faa4b76e02/67e9c2c6114b7db95b3cc6a1_chat%20(1).png" loading="lazy" alt="" className="image-33" />
            {//<div>{commentCount}</div>
            }
          </div>
        </div>

        <div className="post-hr" />
        <div className="user-post-text">
          <div className="text-block-2">{postText}</div>
        </div>
      </div>
    </div>
  );
};

export default Post;
