import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faDownLong, faSpinner, faTableColumns, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import axios from "axios";

const FCMSTemplates = ({ onClose }) => {
    const [userID, setUserID] = useState('');
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState({});

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
            console.log(userID);
        }
    }, []);

    const downloadTemplateCert = () => {
        const link = document.createElement('a');
        link.href = `${process.env.PUBLIC_URL}/TAU5 - Flameproof Certificate List V0.7 (17.09.2025).xlsx`; // Adjust path as needed
        link.setAttribute('download', 'TAU5 - Flameproof Certificate List V0.7 (17.09.2025).xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadTemplateAsset = () => {
        const link = document.createElement('a');
        link.href = `${process.env.PUBLIC_URL}/TAU5 - Flameproof Asset List V0.4 (15.09.2025).xlsx`; // Adjust path as needed
        link.setAttribute('download', 'TAU5 - Flameproof Asset List V0.4 (15.09.2025).xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString); // Convert to Date object
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero
        return `${year}-${month}-${day}`;
    };

    return (
        <div className="import-si-popup-overlay">
            <div className="import-si-popup-content" style={{ minHeight: "0" }}>
                <div className="import-si-file-header">
                    <h2 className="import-si-file-title">Flameproof Templates</h2>
                    <button className="import-si-file-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="import-si-file-group" style={{ position: "relative" }}>
                    <button
                        className="top-right-button-rsi"
                        title="Download Template"
                        onClick={() => downloadTemplateCert()}
                    >
                        <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                    </button>
                    <div className="import-si-file-text">Batch Upload Certificates</div>
                    <div className="import-si-label">Version</div>
                    <div className="import-si-value">V0.7</div>
                    <div className="import-si-label">Date Uploaded</div>
                    <div className="import-si-value">2025-09-17</div>
                </div>

                <div className="import-si-file-group" style={{ position: "relative" }}>
                    <button
                        className="top-right-button-rsi"
                        title="Download Template"
                        onClick={() => downloadTemplateAsset()}
                    >
                        <FontAwesomeIcon icon={faDownload} className="icon-um-search" />
                    </button>
                    <div className="import-si-file-text">Batch Register Assets</div>
                    <div className="import-si-label">Version</div>
                    <div className="import-si-value">V0.4</div>
                    <div className="import-si-label">Date Uploaded</div>
                    <div className="import-si-value">2025-09-15</div>
                </div>
            </div>
        </div >
    );
};

export default FCMSTemplates;