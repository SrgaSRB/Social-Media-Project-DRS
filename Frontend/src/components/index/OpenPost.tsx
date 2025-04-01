import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProfilePicture from '../universal/ProfilePicture';
import Loader from "../universal/Loader";

interface CommentType {
    id: number;
    username: string;
    profileImage: string;
    content: string;
    created_at: string;
}

interface OpenPostProps {
    postId: number;
    username: string;
    profileImage: string;
    postImage?: string;
    postText: string;
    timeAgo: string;
    backendUrl: string;
    isLiked: boolean;
    likeCount: number;
    onLikeToggle: (postId: number) => void;
    onClose: () => void;
}

const OpenPost: React.FC<OpenPostProps> = ({
    postId,
    username,
    profileImage,
    postImage,
    postText,
    timeAgo,
    backendUrl,
    isLiked,
    likeCount,
    onLikeToggle,
    onClose,
}) => {

    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState<CommentType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        if (!postId) return;

        const fetchComments = async () => {
            try {
                const res = await fetch(`${backendUrl}/api/posts/${postId}/comments`, {
                    credentials: "include",
                });
                const data = await res.json();
                setComments(data);
            } catch (error) {
                console.error("Greška prilikom dohvatanja komentara:", error);
            }finally {
                setLoading(false);
            }
        };

        fetchComments();
    }, [postId, backendUrl]);


    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const res = await fetch(`${backendUrl}/api/posts/${postId}/comments`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: commentText }),
        });

        if (res.ok) {
            const newComment = await res.json();
            setComments(prev => [newComment, ...prev]);
            setCommentText("");
        }
    };

    //nece se izvrsiti zbog useeffect-a
    if (!postId) return <div>Invalid post ID</div>;

    return (
        <section className="open-post-section" onClick={onClose}>
            <div
                className="w-layout-blockcontainer container w-container"
                onClick={(e) => e.stopPropagation()} // <--- OVO SPREČAVA ZATVARANJE KAD KLIKNEŠ UNUTRA
            >
                <div className="open-post-wrapper">
                    {postImage && (
                        <div className="open-post-image-div">
                            <img src={`${backendUrl}/api/posts/uploads/${postImage}`} loading="lazy" alt="" className="image-34" />
                        </div>
                    )}
                    <div className="open-post-info">
                        <div className="user-post-user-info temp-class">
                            <div className="user-post-info-part">
                                <div className="user-post-user-info-image-and-name">
                                    <div className="user-post-user-info-profile-image">
                                        <ProfilePicture profileImage={profileImage} />
                                    </div>
                                    <div className="user-post-user-info-name-and-date">
                                        <div className="user-post-user-info-name">
                                            @<span className="text-span">{username}</span>
                                        </div>
                                        <div className="user-post-user-info-date">{timeAgo}</div>
                                    </div>
                                </div>
                                <div className="post-hr"></div>
                                <div className="user-post-likes-and-comments-div">
                                    <div className="user-post-likes-and-comments" onClick={() => onLikeToggle(postId)}>
                                        {isLiked ? (
                                            <img src="https://cdn.prod.website-files.com/67334b62cd4d25faa4b76e02/67e9c25f1a919423b12eba33_heart%20(3).png" loading="lazy" alt="" className="image-32" onClick={() => onLikeToggle(postId)} />
                                        ) : (
                                            <img src="https://cdn.prod.website-files.com/67334b62cd4d25faa4b76e02/67e9c25ff801b7bf3d2ebcfe_heart%20(2).png" loading="lazy" alt="" className="image-32" onClick={() => onLikeToggle(postId)} />
                                        )
                                        }
                                        <div>{likeCount}</div>
                                    </div>
                                    <div className="user-post-likes-and-comments">
                                        <img src="https://cdn.prod.website-files.com/67334b62cd4d25faa4b76e02/67e9c2c6114b7db95b3cc6a1_chat%20(1).png" loading="lazy" alt="" className="image-33" />
                                        <div>{comments.length}</div>
                                    </div>
                                </div>
                                <div className="post-hr"></div>
                                <div className="user-post-text">
                                    <div className="text-block-2">{postText}</div>
                                </div>
                                <div className="post-hr black-hr"></div>
                            </div>
                            <div className="user-post-comments-div-block">
                                <div className="user-post-comments-div-group">
                                        {loading ? (
                                            <Loader />
                                        ) : comments.length === 0 ? (
                                            <div className="no-comments">No comments yet</div>
                                        ) : (
                                            comments.map((comment) => (
                                                <div className="user-post-comments-div" key={comment.id}>
                                                    <div className="user-post-comments-image-div">
                                                        <img src={comment.profileImage} alt={comment.username} />
                                                    </div>
                                                    <div className="user-post-comment">
                                                        <div className="user-post-comment-user-username">@{comment.username}</div>
                                                        <div className="user-post-comment-text"><span className="text-span-5">@{comment.username}</span>{comment.content}</div>
                                                        <div className="text-block-30">{comment.created_at}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                </div>
                                <div className="user-post-comment-div-block w-form">
                                    <form className="user-post-comment-div" onSubmit={handleCommentSubmit}>
                                        <input
                                            className="text-field-2 w-input"
                                            maxLength={256}
                                            placeholder="Write a comment..."
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                        />
                                        <input type="submit" className="submit-button-5 w-button" value="Post" />
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default OpenPost;