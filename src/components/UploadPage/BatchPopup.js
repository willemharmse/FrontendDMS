import React from "react";
import { useNavigate } from "react-router-dom";
import "./BatchPopup.css";

const BatchPopup = ({ message, onClose }) => {
    const navigate = useNavigate();

    const handleNoClick = () => {
        navigate("/FrontendDMS/documentManage"); // Navigate away
    };

    return (
        <div className="batch-popup-confirmation-classname">
            <div className="batch-popup-content-classname">
                <p className="batch-popup-message-classname">{message}</p>
                <p>Would you like to upload more files?</p>
                <div className="batch-popup-buttons-classname">
                    <button className="batch-popup-yes-button-classname" onClick={onClose}>
                        Yes
                    </button>
                    <button className="batch-popup-no-button-classname" onClick={handleNoClick}>
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BatchPopup;
