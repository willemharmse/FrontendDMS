import React from "react";
import { useNavigate } from "react-router-dom";
import "./UploadPopup.css";

const UploadPopup = ({ message, onClose }) => {
  const navigate = useNavigate();

  const handleNoClick = () => {
    navigate("/FrontendDMS/documentManage"); // Navigate away
  };

  return (
    <div className="upload-popup-confirmation-classname">
      <div className="upload-popup-content-classname">
        <p className="upload-popup-message-classname">{message}</p>
        <p>Would you like to upload another file?</p>
        <div className="upload-popup-buttons-classname">
          <button className="upload-popup-yes-button-classname" onClick={onClose}>
            Yes
          </button>
          <button className="upload-popup-no-button-classname" onClick={handleNoClick}>
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPopup;
