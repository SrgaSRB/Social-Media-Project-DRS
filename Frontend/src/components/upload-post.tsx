import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../notification/NotificationContext';
import Loader from "../components/Loader";


const loadCSS = (hrefs: string[]) => {
  // Brišemo sve postojeće <link rel="stylesheet"> elemente iz <head>
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    link.remove();
  });

  // Dodajemo nove CSS fajlove
  hrefs.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
};

const UploadPost: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const { showNotification } = useNotification();

  useEffect(() => {
    setIsLoading(true);

    loadCSS([
      '/styles/upload-post.css',
      '/styles/notification.css',
      '/styles/navbar.css',
      '/styles/extern.css'
    ]);

    const checkSession = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/auth/session`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();

        if (!data.user) {
          navigate('/login'); // Redirect to login page if not logged in
        }
      } catch (error) {
        navigate('/login'); // Redirect to login page in case of error
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  if (isLoading) {
    return <Loader />;
  }
  

  // Handle post text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostText(e.target.value);
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('text', postText);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch(`${backendUrl}/api/posts/upload-post`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        showNotification("success" ,'The post was created successfully!');
        setPostText('');
        setImage(null);
        setPreview(null);
      } else {
        const errorData = await response.json();
        showNotification("error" ,`An error occurred: ${errorData.error || 'Please try again.'}`);
      }
    } catch (error) {
      showNotification("error" ,'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="body">
      <section className="hero-section">
        <div className="w-layout-blockcontainer container w-container">
          <div className="upload-div-block">
            <div className="image-div-block">
              <div className="text-block">
                Upload an image <span className="text-span">(optional)</span>
              </div>
              <div className="image-div">
                {preview ? (
                  <>
                    <a href="#" className="link-block w-inline-block" onClick={removeImage}>
                      <div>X</div>
                    </a>
                    <img
                      src={preview}
                      alt="Preview"
                      className="image-4"
                      id="post-image"
                      style={{ display: 'block' }}
                    />
                  </>
                ) : (
                  <>
                    {/*
                    <div>Drag and Drop to upload file</div>
                    <div>or</div>
                    */}
                    <input
                      type="file"
                      className="inputFile"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </>
                )}
              </div>
            </div>
            <div className="text-div">
              <div className="form-block w-form">
                <form onSubmit={handleSubmit} className="form">
                  <label htmlFor="post-text" className="field-label">
                    Post text
                  </label>
                  <textarea
                    required
                    placeholder="Enter text"
                    maxLength={5000}
                    id="post-text"
                    name="field"
                    className="textarea w-input"
                    value={postText}
                    onChange={handleTextChange}
                  />
                  <input
                    type="submit"
                    className="submit-button w-button"
                    value={isSubmitting ? 'Submitting...' : 'Submit'}
                    disabled={isSubmitting}
                  />
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UploadPost;
