import { error } from 'console';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { text } from 'stream/consumers';
import { useNavigate } from 'react-router-dom';


const loadCSS = (href: string) => {
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.getAttribute('href') !== href) {
      link.remove();
    }
  });

  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (!existingLink) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
};

const UploadPost: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'; // URL iz environment varijable


  useEffect(() => {
    loadCSS('/styles/upload-post.css');
    setIsLoading(true);

    const checkSession = async () => {
      try {
        const response = await fetch('${backendUrl}/api/auth/session', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();

        if (!data.user) {
          navigate('/login'); // Preusmerava na stranicu za prijavu
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        navigate('/login'); // Preusmerava na stranicu za prijavu u slučaju greške
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);


  if (isLoading) {
    return (
      <>
        <Helmet>
          <style>
            {`
              .preloader {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-size: 24px;
                background-color: #f5f5f5;
                color: #333;
                font-family: Arial, sans-serif;
              }

              .spinner {
                border: 8px solid #f3f3f3;
                border-top: 8px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
              }

              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }

              .image-div img {
                display: block;
                max-width: 100%;
                height: auto;
                margin-top: 10000px;
              }
            `}
          </style>
        </Helmet>
        <div className="preloader">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      </>
    );
  }

  //Post description {text}
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostText(e.target.value);
  };

  //Post Image {file}
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('text', postText);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await fetch('${backendUrl}/api/posts/upload-post', {
        method: 'POST',
        credentials: 'include', // Za uključivanje kolačića
        body: formData, // FormData objekat se direktno koristi
      });

      if (response.ok) {
        alert('Objava je uspešno kreirana!');
        setPostText('');
        setImage(null);
        setPreview(null);
      } else {
        const errorData = await response.json();
        alert(`Došlo je do greške: ${errorData.error || 'Pokušajte ponovo.'}`);
        console.error('Greška:', errorData);
      }
    } catch (error) {
      console.error('Greška prilikom slanja objave:', error);
      alert('Došlo je do greške. Pokušajte ponovo.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  return (
    <div className="body">
      <section className="hero-section">
        <div className="w-layout-blockcontainer container w-container">
          <div className="upload-div-block">
            <div className="image-div-block">
              <div className="text-block">
                Unesite sliku <span className="text-span">(opciono)</span>
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
                    <div>Drag and Drop to upload file</div>
                    <div>or</div>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </>
                )}
              </div>

            </div>
            <div className="text-div">
              <div className="form-block w-form">
                <form onSubmit={handleSubmit} className="form">
                  <label htmlFor="post-text" className="field-label">
                    Tekst objave
                  </label>
                  <textarea
                    required
                    placeholder="Unesite tekst"
                    maxLength={5000}
                    id="post-text"
                    name="field"
                    className="textarea w-input"
                    value={postText}
                    onChange={handleTextChange}
                  ></textarea>
                  <input
                    type="submit"
                    className="submit-button w-button"
                    value={isSubmitting ? 'Šalje se...' : 'Objavi'}
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
