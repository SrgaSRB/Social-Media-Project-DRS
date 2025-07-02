import React, { useState, useEffect } from 'react';

interface Post {
    id: number;
    content: string;
    image_url?: string;
    newImage?: File | null;
}

interface EditPostViewProps {
    post: Post;
    backendUrl: string;
    onClose: () => void;
    onUpdated?: (p: Post) => void;
}


const EditPostView: React.FC<EditPostViewProps> = ({ post, backendUrl, onClose, onUpdated }) => {

    const [draft, setDraft] = useState<Post>(post);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() =>

        setDraft(post)

        , [post]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('content', draft.content);

            // Ako korisnik postavlja novu sliku
            if (draft.newImage) {
                formData.append('image', draft.newImage);
            }

            // Ako korisnik uklanja staru sliku
            if (!draft.newImage && !draft.image_url) {
                formData.append('remove_image', 'true');
            }

            const res = await fetch(`${backendUrl}/api/posts/${draft.id}`, {
                method: 'PUT',
                credentials: 'include',
                body: formData,
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'Greška pri snimanju objave');
            }

            const updatedPost: Post = await res.json();
            onUpdated?.(updatedPost);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Nešto je pošlo naopako');
        } finally {
            setSaving(false);
        }
    };


    return (
        <section className="edit-post-section">
            <div className="w-layout-blockcontainer container w-container">
                <div className="edit-post-wrapper">
                    <div className="form-block-3 w-form">

                        <form className="form-3">
                            <div className="div-block-12">
                                <div className="text-block-34">Picture</div>
                                <div className="edit-post-image-div">
                                    {(draft.image_url || draft.newImage) ? (
                                        <>
                                            <img
                                                src={
                                                    draft.newImage
                                                        ? URL.createObjectURL(draft.newImage)
                                                        : `${backendUrl}/api/posts/uploads/${draft.image_url}`
                                                }
                                                alt="Post"
                                                className="image-36"
                                            />
                                            <div
                                                className="link-block-5"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setDraft({ ...draft, image_url: undefined, newImage: null });
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <img
                                                    src="https://cdn.prod.website-files.com/67334b62cd4d25faa4b76e02/67ec58796dcd3d58c13533b5_x-02%20(1).svg"
                                                    loading="lazy"
                                                    alt="Remove"
                                                    className="image-37"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <input
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setDraft({ ...draft, newImage: file });
                                            }}
                                        />
                                    )}
                                </div>

                            </div>
                            <div className="div-block-13">
                                <div className="text-block-33">Description</div>
                                <div className="div-block-14">
                                    <textarea
                                        className="textarea-2 w-input"
                                        value={draft.content}
                                        onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                                        style={{ maxWidth: '100%' }}
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="div-block-15">
                            <a className="button-3 w-button" onClick={onClose}>Cancel</a>
                            <a className="button-4 w-button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (!saving) handleSave();
                                }}>
                                <div>{saving ? 'Saving…' : 'Save'}</div>
                            </a>
                        </div>

                        {error && <p className="error-msg">{error}</p>}
                    </div>
                </div>
            </div>
        </section>

    );
}

export default EditPostView;