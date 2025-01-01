import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, redirect } from "react-router-dom";
import { useNotification } from '../notification/NotificationContext';


const loadCSS = (href: string) => {
  // Ukloni sve postojeće CSS linkove osim trenutnog
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    if (link.getAttribute("href") !== href) {
      link.remove();
    }
  });

  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (!existingLink) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
};

const Register: React.FC = () => {

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    address: "",
    city: "",
    country: "",
    phone_number: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const backendUrl = process.env.REACT_APP_BACKEND_URL; // URL iz environment varijable
  const { showNotification } = useNotification();

  const navigate = useNavigate();


  useEffect(() => {
    loadCSS("/styles/register.css");
    setTimeout(() => setIsLoading(false), 200); // Simulacija učitavanja CSS-a
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUsernameBlur = async (): Promise<void> => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: formData.username }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsernameAvailable(data.available);
      } else {
        setUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    console.log("Sending data to backend:", formData);

    try {
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log("Backend response:", response);
      if (response.ok) {
        alert('Registration successful!');
        navigate('/login'); // Redirect to login page after successful registration
      } else {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        alert(`Error: ${errorData.message || "An error occurred"}`);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('An error occurred. Please try again.');
    }
  };



  const handleLoginRedirect = () => {
    navigate("/login");
  }

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

  return (
    <section>
      <Helmet>
        <title>Register</title>
      </Helmet>
      <section className="hero-section">
        <div className="w-layout-blockcontainer container hero-container w-container">
          <div className="register-wapper">
            <div className="register-form">
              <div className="form-block-2 w-form">
                <form
                  id="register-form"
                  name="register-form"
                  className="form"
                  onSubmit={handleSubmit}
                >
                  <label htmlFor="username" className="user-info-label">
                    Korisničko ime
                  </label>
                  <input
                    className="user-info-input w-input"
                    maxLength={256}
                    name="username"
                    id="username"
                    placeholder="Unesite korisničko ime"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    onBlur={handleUsernameBlur}
                    required
                  />
                  {usernameAvailable === false && (
                    <span className="error-message">
                      Korisničko ime nije dostupno.
                    </span>
                  )}

                  <label htmlFor="first-name" className="user-info-label">
                    Ime
                  </label>
                  <input
                    className="user-info-input w-input"
                    maxLength={256}
                    name="first_name"
                    id="first_name"
                    placeholder="Unesite Vaše ime"
                    type="text"
                    autoComplete="given-name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="last-name" className="user-info-label">
                    Prezime
                  </label>
                  <input
                    className="user-info-input w-input"
                    maxLength={256}
                    name="last_name"
                    id="last_name"
                    placeholder="Unesite Vaše prezime"
                    type="text"
                    autoComplete="family-name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="street-address" className="user-info-label">
                    Adresa
                  </label>
                  <input
                    className="user-info-input w-input"
                    maxLength={256}
                    name="address"
                    id="street-address"
                    placeholder="Unesite Vašu adresu (ulica, broj)"
                    type="text"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="city" className="user-info-label">
                    Grad
                  </label>
                  <input
                    className="user-info-input w-input"
                    maxLength={256}
                    name="city"
                    id="city"
                    placeholder="Unesite grad u kome živite"
                    type="text"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="country" className="user-info-label">
                    Država
                  </label>
                  <input
                    className="user-info-input w-input"
                    maxLength={256}
                    name="country"
                    id="country"
                    placeholder="Unesite državu u kojoj živite"
                    type="text"
                    autoComplete="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="tel" className="user-info-label">
                    Broj telefona
                  </label>
                  <input
                    className="user-info-input w-input"
                    maxLength={256}
                    name="phone_number"
                    id="tel"
                    placeholder="Unesite Vaš broj telefona"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="email" className="user-info-label">
                    Email
                  </label>
                  <input
                    className="user-info-input w-input"
                    maxLength={256}
                    name="email"
                    id="email"
                    placeholder="Unesite Vašu email adresu"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="password" className="user-info-label">
                    Lozinka
                  </label>
                  <input
                    className="user-info-input w-input"
                    maxLength={256}
                    name="password"
                    id="password"
                    placeholder="Unesite Vašu lozinku"
                    type="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />

                  <input
                    type="submit"
                    className="submit-button-2 w-button"
                    value="Registruj se"
                  />
                </form>
              </div>
              <a
                href="#"
                className="link"
                onClick={(e) => {
                  e.preventDefault();
                  handleLoginRedirect();
                }}
              >Imate profil?</a>
            </div>
            <div className="image-register-div">
              <img
                src="/assets/Icons/register-background.svg"
                alt="Sign Up"
                className="image-5"
              />
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Register;
