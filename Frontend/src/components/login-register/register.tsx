import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../notification/NotificationContext";
import Loader from "../universal/Loader";


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
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = "/styles/notification.css";
  document.head.appendChild(link);
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

  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState(""); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    if (name === "username" && /\s/.test(value)) {
      showNotification("error", "Username cannot contain spaces.");
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleEmailBlur = async (): Promise<void> => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmailAvailable(data.available);
      } else {
        setEmailAvailable(false);
      }
    } catch (error) {
      showNotification("error","Error checking email: " + error);
      setEmailAvailable(false);
    }
  };

  const handleUsernameBlur = async (): Promise<void> => {
    try {
      const response = await fetch(`${backendUrl}/api/auth/check-username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      showNotification("error","Error checking username: " + error);
      setUsernameAvailable(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (formData.password !== confirmPassword) {
      setPasswordError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("Backend response:", response);
      if (response.ok) {
        showNotification("success","Registration successful!");
        navigate("/login"); // Redirect to login page after successful registration
      } else {
        const errorData = await response.json();
        showNotification("error" ,`Error: ${errorData.message || "An error occurred"}`);
      }
    } catch (error) {
      showNotification( "error","An error occurred. Please try again.");
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setConfirmPassword(e.target.value);

    if (formData.password !== e.target.value) {
      setPasswordError("Passwords do not match!");
    } else {
      setPasswordError("");
    }
  };
  
  return (
    <section>
      <Helmet>
        <title>Register</title>
      </Helmet>
      <section className="register-section">
        <div className="w-layout-blockcontainer container w-container">
          <div className="register-wapper">
            <div className="register-form">
              <div className="form-block-2 w-form">
                <form
                  id="register-form"
                  name="register-form"
                  className="form-2"
                  onSubmit={handleSubmit}
                >
                  <label htmlFor="username" className="user-info-label-2">
                    Username
                  </label>
                  <input
                    className="user-info-input-2 w-input"
                    maxLength={256}
                    name="username"
                    id="username"
                    placeholder="Enter your username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    onBlur={handleUsernameBlur}
                    required
                  />
                  {usernameAvailable === false && (
                    <span className="error-message">
                      Username is not available.
                    </span>
                  )}

                  <label htmlFor="first_name" className="user-info-label-2">
                    First name
                  </label>
                  <input
                    className="user-info-input-2 w-input"
                    maxLength={256}
                    name="first_name"
                    id="first_name"
                    placeholder="Enter your first name"
                    type="text"
                    autoComplete="given-name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="last_name" className="user-info-label-2">
                    Last name
                  </label>
                  <input
                    className="user-info-input-2 w-input"
                    maxLength={256}
                    name="last_name"
                    id="last_name"
                    placeholder="Enter your last name"
                    type="text"
                    autoComplete="family-name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="address" className="user-info-label-2">
                    Address
                  </label>
                  <input
                    className="user-info-input-2 w-input"
                    maxLength={256}
                    name="address"
                    id="address"
                    placeholder="Enter your address (street, number)"
                    type="text"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="city" className="user-info-label-2">
                    City
                  </label>
                  <input
                    className="user-info-input-2 w-input"
                    maxLength={256}
                    name="city"
                    id="city"
                    placeholder="Enter the city you live in"
                    type="text"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="country" className="user-info-label-2">
                    Country
                  </label>
                  <input
                    className="user-info-input-2 w-input"
                    maxLength={256}
                    name="country"
                    id="country"
                    placeholder="Enter the country you live in"
                    type="text"
                    autoComplete="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="tel" className="user-info-label-2">
                    Phone number
                  </label>
                  <input
                    className="user-info-input-2 w-input"
                    maxLength={256}
                    name="phone_number"
                    id="tel"
                    placeholder="Enter your phone number"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="email" className="user-info-label-2">
                    Email
                  </label>
                  <input
                    className="user-info-input-2 w-input"
                    maxLength={256}
                    name="email"
                    id="email"
                    placeholder="Enter your email address"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleEmailBlur}
                    required
                  />
                  {emailAvailable === false && (
                    <span className="error-message">
                      Email address is not available.
                    </span>
                  )}

                  <label htmlFor="password" className="user-info-label-2">
                    Password
                  </label>
                  <input
                    className="user-info-input-2 w-input"
                    maxLength={256}
                    name="password"
                    id="password"
                    placeholder="Enter your password"
                    type="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />

                  <label htmlFor="password-confirm" className="user-info-label-2">
                    Confirm password
                  </label>
                  <input
                    className="user-info-input-2 w-input"
                    name="confirmPassword"
                    id="password-confirm"
                    placeholder="Confirm your password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                  />
                  {passwordError && <span className="error-message">{passwordError}</span>}


                  <input
                    type="submit"
                    className="submit-button-2 w-button"
                    value="Register"
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
              >
                Already have an account?
              </a>
            </div>
            <div className="image-register-div">
              <img
                src="/assets/Icons/register-background.svg"
                alt="Sign Up"
                className="image-21"
              />
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Register;
