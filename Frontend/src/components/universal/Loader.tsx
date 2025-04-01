import React from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";

const Loader: React.FC = () => {
  return (
    <HelmetProvider>
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
              z-index: 9999;
              grid-column-gap: 8px;
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
    </HelmetProvider>
  );
};

export default Loader;
