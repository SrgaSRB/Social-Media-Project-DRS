import React from "react";


interface ModalImageProps {
    imageUrl: string;
    altText: string;
    onClose: () => void;
}

const ModalImage : React.FC<ModalImageProps> = ({imageUrl, altText, onClose}) => {
  
    return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content">
            <img src={imageUrl} alt={altText} className="modal-image" />
            <button className="modal-close-button" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>
      );
    };
    
export default ModalImage;
    